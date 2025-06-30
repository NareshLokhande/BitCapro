/*
  # Fix Notifications Table RLS Policies

  1. Security Updates
    - Add proper INSERT policy for notifications table
    - Allow authenticated users to create notifications
    - Allow users to update their own notifications (mark as read)
    - Ensure notification system can function properly

  2. Changes
    - Add INSERT policy for authenticated users to create notifications
    - Update existing policies to ensure proper access
    - Fix any missing policies that prevent notification creation
*/

-- Ensure notifications table exists with proper structure
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES investment_requests(id) ON DELETE CASCADE,
  project_title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('approval_request', 'approval_action', 'request_submitted', 'request_completed', 'delay_alert', 'rejection_notification')),
  read boolean NOT NULL DEFAULT false,
  action_url text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can only see their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated users to create notifications" ON notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON notifications;

-- Create comprehensive RLS policies for notifications

-- Allow authenticated users to insert notifications (for system-generated notifications)
CREATE POLICY "Allow authenticated users to create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to read only their own notifications
CREATE POLICY "Users can only see their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to update only their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create function to send notifications
CREATE OR REPLACE FUNCTION notify_on_request_submission()
RETURNS TRIGGER AS $$
DECLARE
  approver_record RECORD;
  total_amount numeric;
BEGIN
  -- Only trigger on status change to 'Submitted'
  IF NEW.status = 'Submitted' AND (OLD.status IS NULL OR OLD.status != 'Submitted') THEN
    total_amount := NEW.base_currency_capex + NEW.base_currency_opex;
    
    -- Notify all potential approvers
    FOR approver_record IN
      SELECT DISTINCT up.user_id, up.name, up.role
      FROM user_profiles up
      JOIN approval_matrix am ON up.role = am.role
      WHERE am.active = true
        AND (am.department = 'All' OR am.department = NEW.department)
        AND total_amount >= am.amount_min
        AND total_amount <= am.amount_max
        AND up.active = true
        AND up.user_id IS NOT NULL
    LOOP
      INSERT INTO notifications (
        user_id,
        request_id,
        project_title,
        message,
        type,
        priority,
        action_url,
        metadata
      ) VALUES (
        approver_record.user_id,
        NEW.id,
        NEW.project_title,
        'New investment request "' || NEW.project_title || '" requires your approval. Amount: ' || NEW.currency || ' ' || (NEW.capex + NEW.opex),
        'approval_request',
        CASE 
          WHEN NEW.priority = 'Critical' THEN 'critical'
          WHEN NEW.priority = 'High' THEN 'high'
          ELSE 'medium'
        END,
        '/app/tracker',
        jsonb_build_object(
          'approver_role', approver_record.role,
          'amount', total_amount,
          'currency', NEW.currency,
          'department', NEW.department
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to notify on approval actions
CREATE OR REPLACE FUNCTION notify_on_approval_action()
RETURNS TRIGGER AS $$
DECLARE
  request_record investment_requests%ROWTYPE;
  submitter_user_id uuid;
  next_approver_record RECORD;
  total_amount numeric;
BEGIN
  -- Get request details
  SELECT * INTO request_record FROM investment_requests WHERE id = NEW.request_id;
  
  -- Get submitter user_id
  SELECT user_id INTO submitter_user_id FROM investment_requests WHERE id = NEW.request_id;
  
  total_amount := request_record.base_currency_capex + request_record.base_currency_opex;
  
  -- Notify submitter about approval action
  IF submitter_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      request_id,
      project_title,
      message,
      type,
      priority,
      action_url,
      metadata
    ) VALUES (
      submitter_user_id,
      NEW.request_id,
      request_record.project_title,
      CASE 
        WHEN NEW.status = 'Approved' THEN 'Your request "' || request_record.project_title || '" has been approved by ' || NEW.approved_by
        WHEN NEW.status = 'Rejected' THEN 'Your request "' || request_record.project_title || '" has been rejected by ' || NEW.approved_by
        WHEN NEW.status = 'On Hold' THEN 'Your request "' || request_record.project_title || '" has been put on hold by ' || NEW.approved_by
        ELSE 'Your request "' || request_record.project_title || '" status has been updated by ' || NEW.approved_by
      END,
      CASE 
        WHEN NEW.status = 'Approved' THEN 'approval_action'
        WHEN NEW.status = 'Rejected' THEN 'rejection_notification'
        ELSE 'approval_action'
      END,
      CASE 
        WHEN NEW.status = 'Rejected' THEN 'high'
        ELSE 'medium'
      END,
      '/app/tracker',
      jsonb_build_object(
        'action', NEW.status,
        'approver', NEW.approved_by,
        'level', NEW.level,
        'comments', NEW.comments
      )
    );
  END IF;
  
  -- If approved and there are more levels, notify next approvers
  IF NEW.status = 'Approved' THEN
    FOR next_approver_record IN
      SELECT DISTINCT up.user_id, up.name, up.role
      FROM user_profiles up
      JOIN approval_matrix am ON up.role = am.role
      WHERE am.active = true
        AND am.level > NEW.level
        AND (am.department = 'All' OR am.department = request_record.department)
        AND total_amount >= am.amount_min
        AND total_amount <= am.amount_max
        AND up.active = true
        AND up.user_id IS NOT NULL
    LOOP
      INSERT INTO notifications (
        user_id,
        request_id,
        project_title,
        message,
        type,
        priority,
        action_url,
        metadata
      ) VALUES (
        next_approver_record.user_id,
        NEW.request_id,
        request_record.project_title,
        'Investment request "' || request_record.project_title || '" has been approved at Level ' || NEW.level || ' and now requires your approval',
        'approval_request',
        CASE 
          WHEN request_record.priority = 'Critical' THEN 'critical'
          WHEN request_record.priority = 'High' THEN 'high'
          ELSE 'medium'
        END,
        '/app/tracker',
        jsonb_build_object(
          'previous_approver', NEW.approved_by,
          'previous_level', NEW.level,
          'approver_role', next_approver_record.role,
          'amount', total_amount,
          'currency', request_record.currency
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for notifications
DROP TRIGGER IF EXISTS trigger_notify_on_request_submission ON investment_requests;
CREATE TRIGGER trigger_notify_on_request_submission
  AFTER UPDATE OF status ON investment_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_request_submission();

DROP TRIGGER IF EXISTS trigger_notify_on_approval_action ON approval_log;
CREATE TRIGGER trigger_notify_on_approval_action
  AFTER INSERT ON approval_log
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_approval_action();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;