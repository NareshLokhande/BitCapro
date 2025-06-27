import { supabase } from './supabase';
import { NotificationData, NotificationService } from './notifications';

export interface NotificationCreateParams {
  user_id: string;
  request_id: string;
  project_title: string;
  message: string;
  type: 'approval_request' | 'approval_action' | 'request_submitted' | 'request_completed' | 'delay_alert' | 'rejection_notification';
  action_url?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export class NotificationManager {
  /**
   * Create a notification in the database
   */
  static async createNotification(params: NotificationCreateParams): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.user_id,
          request_id: params.request_id,
          project_title: params.project_title,
          message: params.message,
          type: params.type,
          action_url: params.action_url,
          priority: params.priority,
          metadata: params.metadata,
          read: false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      return !error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Notify approvers when a request is submitted
   */
  static async notifyApprovers(
    requestId: string,
    projectTitle: string,
    amount: number,
    currency: string,
    requesterName: string,
    businessCaseTypes: string[] = []
  ): Promise<void> {
    try {
      // Find approvers who need to be notified based on approval matrix
      const { data: approvers, error } = await supabase.rpc('get_approvers_for_request', {
        p_request_id: requestId,
        p_amount: amount
      });

      if (error) {
        console.error('Error finding approvers:', error);
        return;
      }

      // Create notifications for each approver
      for (const approver of approvers) {
        // Create in-app notification
        await this.createNotification({
          user_id: approver.user_id,
          request_id: requestId,
          project_title: projectTitle,
          message: `New investment request requires your approval: ${projectTitle}`,
          type: 'approval_request',
          action_url: `/app/tracker?request=${requestId}`,
          priority: amount > 500000 ? 'high' : amount > 100000 ? 'medium' : 'low',
          metadata: {
            amount,
            currency,
            requesterName,
            businessCaseTypes
          }
        });

        // Send external notification if configured
        if (NotificationService) {
          const notificationData: NotificationData = {
            type: 'approval_request',
            requestId,
            projectTitle,
            amount,
            currency,
            requesterName,
            requesterEmail: '',
            approverName: approver.name,
            approverEmail: approver.email,
            businessCaseTypes,
            urgency: amount > 500000 ? 'high' : amount > 100000 ? 'medium' : 'low'
          };
          
          NotificationService.sendNotification(notificationData).catch(err => {
            console.error('Error sending external notification:', err);
          });
        }
      }
    } catch (error) {
      console.error('Error in notifyApprovers:', error);
    }
  }

  /**
   * Notify when an approval action is taken
   */
  static async notifyApprovalAction(
    requestId: string,
    projectTitle: string,
    action: 'approved' | 'rejected' | 'held',
    approverName: string,
    approverRole: string,
    comments: string,
    requesterId: string,
    requesterName: string,
    amount: number,
    currency: string
  ): Promise<void> {
    try {
      // 1. Notify the requester
      const actionVerb = action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'put on hold';
      
      await this.createNotification({
        user_id: requesterId,
        request_id: requestId,
        project_title: projectTitle,
        message: `Your request has been ${actionVerb} by ${approverName} (${approverRole})`,
        type: 'approval_action',
        action_url: `/app/tracker?request=${requestId}`,
        priority: action === 'rejected' ? 'high' : action === 'held' ? 'medium' : 'low',
        metadata: {
          action,
          approverName,
          approverRole,
          comments
        }
      });

      // 2. If rejected, notify users in the approval chain
      if (action === 'rejected') {
        // Find next approver in hierarchy
        const { data: nextApprover } = await supabase.rpc('get_next_approver_in_hierarchy', {
          p_request_id: requestId,
          p_current_level: parseInt(approverRole.split('_')[1] || '0')
        });

        if (nextApprover) {
          // Notify the next approver in the hierarchy
          await this.createNotification({
            user_id: nextApprover.user_id,
            request_id: requestId,
            project_title: projectTitle,
            message: `Request rejected by ${approverName}. Your review is required as the next approver in the hierarchy.`,
            type: 'rejection_notification',
            action_url: `/app/tracker?request=${requestId}`,
            priority: 'high',
            metadata: {
              action: 'rejected',
              rejectedBy: approverName,
              rejectedByRole: approverRole,
              comments
            }
          });

          // Send external notification
          if (NotificationService) {
            const notificationData: NotificationData = {
              type: 'rejection_notification',
              requestId,
              projectTitle,
              amount,
              currency,
              requesterName,
              requesterEmail: '',
              rejectedBy: approverName,
              rejectedByRole: approverRole,
              nextApproverName: nextApprover.name,
              nextApproverEmail: nextApprover.email,
              nextApproverRole: nextApprover.role,
              comments,
              urgency: 'high'
            };
            
            NotificationService.sendNotification(notificationData).catch(err => {
              console.error('Error sending external notification:', err);
            });
          }
        }

        // Also notify previous approvers in the chain
        const { data: previousApprovers } = await supabase.rpc('get_previous_approvers', {
          p_request_id: requestId,
          p_current_level: parseInt(approverRole.split('_')[1] || '0')
        });

        if (previousApprovers && previousApprovers.length > 0) {
          for (const approver of previousApprovers) {
            await this.createNotification({
              user_id: approver.user_id,
              request_id: requestId,
              project_title: projectTitle,
              message: `Request you previously approved has been rejected by ${approverName} (${approverRole}).`,
              type: 'approval_action',
              action_url: `/app/tracker?request=${requestId}`,
              priority: 'medium',
              metadata: {
                action: 'rejected',
                approverName,
                approverRole,
                comments
              }
            });
          }
        }
      }

      // 3. If approved, notify the next approver in the chain
      if (action === 'approved') {
        // Find next approver
        const { data: nextApprover } = await supabase.rpc('get_next_approver', {
          p_request_id: requestId,
          p_current_level: parseInt(approverRole.split('_')[1] || '0')
        });

        if (nextApprover) {
          await this.createNotification({
            user_id: nextApprover.user_id,
            request_id: requestId,
            project_title: projectTitle,
            message: `Request approved by ${approverName} and now requires your approval.`,
            type: 'approval_request',
            action_url: `/app/tracker?request=${requestId}`,
            priority: 'medium',
            metadata: {
              previousApprover: approverName,
              previousApproverRole: approverRole,
              comments
            }
          });
        } else {
          // Final approval - notify requester of completion
          await this.createNotification({
            user_id: requesterId,
            request_id: requestId,
            project_title: projectTitle,
            message: `Your request has been fully approved! Final approval by ${approverName}.`,
            type: 'request_completed',
            action_url: `/app/tracker?request=${requestId}`,
            priority: 'medium',
            metadata: {
              finalApprover: approverName,
              finalApproverRole: approverRole,
              comments
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in notifyApprovalAction:', error);
    }
  }

  /**
   * Notify about delays in approval process
   */
  static async notifyDelays(): Promise<void> {
    try {
      // Find requests that have been pending for too long
      const { data: delayedRequests, error } = await supabase.rpc('get_delayed_requests', {
        p_delay_threshold_days: 7 // Configurable threshold
      });

      if (error) {
        console.error('Error finding delayed requests:', error);
        return;
      }

      for (const request of delayedRequests) {
        // Notify current approver
        if (request.current_approver_id) {
          await this.createNotification({
            user_id: request.current_approver_id,
            request_id: request.id,
            project_title: request.project_title,
            message: `Approval request has been pending for ${request.days_pending} days. Urgent action required.`,
            type: 'delay_alert',
            action_url: `/app/tracker?request=${request.id}`,
            priority: 'high',
            metadata: {
              daysPending: request.days_pending,
              submittedDate: request.submitted_date
            }
          });
        }

        // Notify requester
        await this.createNotification({
          user_id: request.user_id,
          request_id: request.id,
          project_title: request.project_title,
          message: `Your request has been pending approval for ${request.days_pending} days.`,
          type: 'delay_alert',
          action_url: `/app/tracker?request=${request.id}`,
          priority: 'medium',
          metadata: {
            daysPending: request.days_pending,
            currentApprover: request.current_approver_name,
            currentApproverRole: request.current_approver_role
          }
        });
      }
    } catch (error) {
      console.error('Error in notifyDelays:', error);
    }
  }
}