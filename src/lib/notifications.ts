// Notification System for Approvia
// Handles Slack and Email notifications for approval workflows

export interface NotificationConfig {
  slackWebhookUrl?: string;
  emailService?: 'sendgrid' | 'mailgun' | 'smtp';
  emailApiKey?: string;
  emailFrom?: string;
  emailDomain?: string;
}

export interface NotificationData {
  type:
    | 'approval_request'
    | 'approval_action'
    | 'request_submitted'
    | 'request_completed'
    | 'delay_alert';
  requestId: string;
  projectTitle: string;
  amount: number;
  currency: string;
  requesterName: string;
  requesterEmail: string;
  approverName?: string;
  approverEmail?: string;
  action?: 'approved' | 'rejected' | 'held';
  comments?: string;
  delayDays?: number;
  businessCaseTypes?: string[];
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SlackMessage {
  text?: string;
  blocks?: unknown[];
  attachments?: unknown[];
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class NotificationService {
  private static config: NotificationConfig = {};

  static initialize(config: NotificationConfig) {
    this.config = config;
  }

  // Send notification based on type
  static async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      const promises: Promise<boolean>[] = [];

      // Send Slack notification if configured
      if (this.config.slackWebhookUrl) {
        promises.push(this.sendSlackNotification(data));
      }

      // Send email notification if configured
      if (this.config.emailService) {
        promises.push(this.sendEmailNotification(data));
      }

      const results = await Promise.allSettled(promises);
      return results.some(
        (result) => result.status === 'fulfilled' && result.value,
      );
    } catch (error) {
      console.error('Notification error:', error);
      return false;
    }
  }

  // Send Slack notification
  private static async sendSlackNotification(
    data: NotificationData,
  ): Promise<boolean> {
    if (!this.config.slackWebhookUrl) return false;

    try {
      const message = this.buildSlackMessage(data);

      const response = await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('Slack notification error:', error);
      return false;
    }
  }

  // Send email notification
  private static async sendEmailNotification(
    data: NotificationData,
  ): Promise<boolean> {
    if (!this.config.emailService || !this.config.emailApiKey) return false;

    try {
      const message = this.buildEmailMessage(data);

      switch (this.config.emailService) {
        case 'sendgrid':
          return await this.sendViaSendGrid(message);
        case 'mailgun':
          return await this.sendViaMailgun(message);
        case 'smtp':
          return await this.sendViaSMTP(message);
        default:
          return false;
      }
    } catch (error) {
      console.error('Email notification error:', error);
      return false;
    }
  }

  // Build Slack message
  private static buildSlackMessage(data: NotificationData): SlackMessage {
    const urgencyColors = {
      low: '#36a64f',
      medium: '#ffa500',
      high: '#ff6b6b',
      critical: '#8b0000',
    };

    const color = urgencyColors[data.urgency || 'medium'];

    switch (data.type) {
      case 'approval_request':
        return {
          text: `🔔 New approval request: ${data.projectTitle}`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '🔔 New Investment Request Requires Approval',
                emoji: true,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Project:*\n${data.projectTitle}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Amount:*\n${
                    data.currency
                  } ${data.amount.toLocaleString()}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Requester:*\n${data.requesterName}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Business Case:*\n${
                    data.businessCaseTypes?.join(', ') || 'N/A'
                  }`,
                },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Review Request',
                    emoji: true,
                  },
                  style: 'primary',
                  url: `${window.location.origin}/app/tracker?request=${data.requestId}`,
                },
              ],
            },
          ],
          attachments: [
            {
              color,
              footer: 'Approvia Investment Management',
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        };

      case 'approval_action': {
        const actionEmoji =
          data.action === 'approved'
            ? '✅'
            : data.action === 'rejected'
            ? '❌'
            : '⏸️';
        const actionText =
          data.action === 'approved'
            ? 'Approved'
            : data.action === 'rejected'
            ? 'Rejected'
            : 'Put On Hold';

        return {
          text: `${actionEmoji} Request ${actionText}: ${data.projectTitle}`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${actionEmoji} Investment Request ${actionText}`,
                emoji: true,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Project:*\n${data.projectTitle}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Action:*\n${actionText}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Approver:*\n${data.approverName}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Amount:*\n${
                    data.currency
                  } ${data.amount.toLocaleString()}`,
                },
              ],
            },
            ...(data.comments
              ? [
                  {
                    type: 'section',
                    text: {
                      type: 'mrkdwn',
                      text: `*Comments:*\n${data.comments}`,
                    },
                  },
                ]
              : []),
          ],
          attachments: [
            {
              color:
                data.action === 'approved'
                  ? '#36a64f'
                  : data.action === 'rejected'
                  ? '#ff6b6b'
                  : '#ffa500',
              footer: 'Approvia Investment Management',
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        };
      }

      case 'delay_alert':
        return {
          text: `⚠️ Delay Alert: ${data.projectTitle} has been pending for ${data.delayDays} days`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '⚠️ Approval Delay Alert',
                emoji: true,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Project:*\n${data.projectTitle}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Days Pending:*\n${data.delayDays} days`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Amount:*\n${
                    data.currency
                  } ${data.amount.toLocaleString()}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Requester:*\n${data.requesterName}`,
                },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Review Now',
                    emoji: true,
                  },
                  style: 'danger',
                  url: `${window.location.origin}/app/tracker?request=${data.requestId}`,
                },
              ],
            },
          ],
          attachments: [
            {
              color: '#ff6b6b',
              footer: 'Approvia Investment Management',
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        };

      default:
        return {
          text: `Investment Request Update: ${data.projectTitle}`,
        };
    }
  }

  // Build email message
  private static buildEmailMessage(data: NotificationData): EmailMessage {
    const urgencyStyles = {
      low: 'color: #36a64f;',
      medium: 'color: #ffa500;',
      high: 'color: #ff6b6b;',
      critical: 'color: #8b0000; font-weight: bold;',
    };

    const urgencyStyle = urgencyStyles[data.urgency || 'medium'];

    switch (data.type) {
      case 'approval_request':
        return {
          to: data.approverEmail || '',
          subject: `Approval Required: ${data.projectTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">🔔 Investment Request Approval Required</h1>
              </div>
              <div style="padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
                <h2 style="${urgencyStyle}">${data.projectTitle}</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${
                      data.currency
                    } ${data.amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Requester:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${
                      data.requesterName
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Business Case:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${
                      data.businessCaseTypes?.join(', ') || 'N/A'
                    }</td>
                  </tr>
                </table>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${window.location.origin}/app/tracker?request=${
            data.requestId
          }" 
                     style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Review Request
                  </a>
                </div>
                <p style="color: #666; font-size: 12px;">
                  This is an automated notification from Approvia Investment Management System.
                </p>
              </div>
            </div>
          `,
        };

      case 'delay_alert':
        return {
          to: data.approverEmail || '',
          subject: `⚠️ Delay Alert: ${data.projectTitle} pending for ${data.delayDays} days`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">⚠️ Approval Delay Alert</h1>
              </div>
              <div style="padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
                <h2 style="color: #ff6b6b;">${data.projectTitle}</h2>
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <strong>⚠️ This request has been pending for ${
                    data.delayDays
                  } days</strong>
                  <p style="margin: 10px 0 0 0; color: #856404;">
                    Delays may impact project timelines and ROI calculations.
                  </p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${
                      data.currency
                    } ${data.amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Requester:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${
                      data.requesterName
                    }</td>
                  </tr>
                </table>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${window.location.origin}/app/tracker?request=${
            data.requestId
          }" 
                     style="background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Review Now
                  </a>
                </div>
              </div>
            </div>
          `,
        };

      default:
        return {
          to: data.requesterEmail,
          subject: `Investment Request Update: ${data.projectTitle}`,
          html: `<p>Your investment request "${data.projectTitle}" has been updated.</p>`,
        };
    }
  }

  // Send via SendGrid
  private static async sendViaSendGrid(
    message: EmailMessage,
  ): Promise<boolean> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.emailApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: message.to }] }],
        from: { email: this.config.emailFrom || 'noreply@approvia.com' },
        subject: message.subject,
        content: [
          { type: 'text/html', value: message.html },
          {
            type: 'text/plain',
            value: message.text || message.html.replace(/<[^>]*>/g, ''),
          },
        ],
      }),
    });

    return response.ok;
  }

  // Send via Mailgun
  private static async sendViaMailgun(message: EmailMessage): Promise<boolean> {
    const formData = new FormData();
    formData.append('from', this.config.emailFrom || 'noreply@approvia.com');
    formData.append('to', message.to);
    formData.append('subject', message.subject);
    formData.append('html', message.html);
    if (message.text) formData.append('text', message.text);

    const response = await fetch(
      `https://api.mailgun.net/v3/${this.config.emailDomain}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`api:${this.config.emailApiKey}`)}`,
        },
        body: formData,
      },
    );

    return response.ok;
  }

  // Send via SMTP (basic implementation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async sendViaSMTP(message: EmailMessage): Promise<boolean> {
    // This would require a more complex SMTP implementation
    // For now, we'll use a simple fetch to an SMTP service
    console.warn('SMTP email sending not fully implemented');
    return false;
  }
}

// Environment variable setup
if (typeof window !== 'undefined') {
  const slackWebhook = import.meta.env.VITE_SLACK_WEBHOOK_URL;
  const emailService = import.meta.env.VITE_EMAIL_SERVICE;
  const emailApiKey = import.meta.env.VITE_EMAIL_API_KEY;
  const emailFrom = import.meta.env.VITE_EMAIL_FROM;
  const emailDomain = import.meta.env.VITE_EMAIL_DOMAIN;

  if (slackWebhook || emailService) {
    NotificationService.initialize({
      slackWebhookUrl: slackWebhook,
      emailService: emailService as 'sendgrid' | 'mailgun' | 'smtp',
      emailApiKey,
      emailFrom,
      emailDomain,
    });
  }
}
