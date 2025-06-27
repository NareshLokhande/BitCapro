/*
  # Notifications System

  1. New Tables
    - `notifications` - Stores user notifications for the approval workflow
    - Tracks read/unread status, notification types, and metadata

  2. Security
    - Enable RLS on notifications table
    - Add policies for user-specific notifications
    - Ensure users can only see their own notifications

  3. Functions
    - Add helper functions for finding approvers
    - Add functions for notification management
    - Add functions for delay detection
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES investment_requests(id) ON DELETE CASCADE,
  project_title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'approval_request', 
    'approval_action', 
    'request_submitted', 
    'request_completed', 
    'delay_alert', 
    'rejection_notification'
  )),
  read boolean NOT NULL DEFAULT false,
  action_url text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can only see their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Function to get approvers for a request based on amount and business case types
CREATE OR REPLACE FUNCTION get_approvers_for_request(
  p_request_id uuid,
  p_amount numeric
)
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  role text
) AS $$
DECLARE
  v_department text;
  v_business_case_types text[];
BEGIN
  -- Get request details
  SELECT department, business_case_type INTO v_department, v_business_case_types
  FROM investment_requests
  WHERE id = p_request_id;
  
  -- Return approvers based on standard approval matrix
  RETURN QUERY
  SELECT 
    up.user_id,
    up.name,
    up.email,
    up.role
  FROM user_profiles up
  JOIN approval_matrix am ON up.role = am.role
  WHERE am.active = true
    AND (am.department = 'All' OR am.department = v_department)
    AND p_amount >= am.amount_min
    AND p_amount <= am.amount_max
    AND up.active = true;
  
  -- Also include approvers from business case routing if applicable
  IF v_business_case_types IS NOT NULL AND array_length(v_business_case_types, 1) > 0 THEN
    RETURN QUERY
    SELECT DISTINCT
      up.user_id,
      up.name,
      up.email,
      up.role
    FROM user_profiles up
    JOIN business_case_routing bcr ON up.role = bcr.required_role
    WHERE bcr.active = true
      AND bcr.business_case_type = ANY(v_business_case_types)
      AND (bcr.department = 'All' OR bcr.department = v_department)
      AND p_amount >= bcr.amount_min
      AND p_amount <= bcr.amount_max
      AND up.active = true;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get the next approver in the approval chain
CREATE OR REPLACE FUNCTION get_next_approver(
  p_request_id uuid,
  p_current_level integer
)
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  role text
) AS $$
DECLARE
  v_department text;
  v_amount numeric;
  v_next_level integer;
BEGIN
  -- Get request details
  SELECT 
    department, 
    (base_currency_capex + base_currency_opex) INTO v_department, v_amount
  FROM investment_requests
  WHERE id = p_request_id;
  
  -- Find the next approval level
  SELECT MIN(level) INTO v_next_level
  FROM approval_matrix
  WHERE active = true
    AND level > p_current_level
    AND (department = 'All' OR department = v_department)
    AND v_amount >= amount_min
    AND v_amount <= amount_max;
  
  IF v_next_level IS NULL THEN
    RETURN;
  END IF;
  
  -- Return the next approver
  RETURN QUERY
  SELECT 
    up.user_id,
    up.name,
    up.email,
    up.role
  FROM user_profiles up
  JOIN approval_matrix am ON up.role = am.role
  WHERE am.level = v_next_level
    AND am.active = true
    AND (am.department = 'All' OR am.department = v_department)
    AND v_amount >= am.amount_min
    AND v_amount <= am.amount_max
    AND up.active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get the next approver in the hierarchy (for rejection notifications)
CREATE OR REPLACE FUNCTION get_next_approver_in_hierarchy(
  p_request_id uuid,
  p_current_level integer
)
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  role text
) AS $$
BEGIN
  -- For rejections, we want to notify the next level up
  -- This is different from the next approver in the workflow
  RETURN QUERY
  SELECT 
    up.user_id,
    up.name,
    up.email,
    up.role
  FROM user_profiles up
  WHERE up.role = 'Approver_L' || (p_current_level + 1)
    AND up.active = true
  ORDER BY up.created_at
  LIMIT 1;
  
  -- If no next level approver, try to find an admin
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      up.user_id,
      up.name,
      up.email,
      up.role
    FROM user_profiles up
    WHERE up.role = 'Admin'
      AND up.active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get previous approvers in the chain
CREATE OR REPLACE FUNCTION get_previous_approvers(
  p_request_id uuid,
  p_current_level integer
)
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  role text
) AS $$
BEGIN
  -- Return approvers who have already approved this request
  RETURN QUERY
  SELECT DISTINCT
    up.user_id,
    up.name,
    up.email,
    up.role
  FROM approval_log al
  JOIN user_profiles up ON al.user_id = up.user_id
  WHERE al.request_id = p_request_id
    AND al.status = 'Approved'
    AND al.level < p_current_level
    AND up.active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get delayed requests
CREATE OR REPLACE FUNCTION get_delayed_requests(
  p_delay_threshold_days integer
)
RETURNS TABLE (
  id uuid,
  project_title text,
  user_id uuid,
  submitted_date timestamptz,
  days_pending integer,
  current_approver_id uuid,
  current_approver_name text,
  current_approver_role text
) AS $$
DECLARE
  v_current_date timestamptz := now();
BEGIN
  RETURN QUERY
  WITH pending_requests AS (
    SELECT 
      ir.id,
      ir.project_title,
      ir.user_id,
      ir.submitted_date,
      EXTRACT(DAY FROM (v_current_date - ir.submitted_date)) AS days_pending,
      -- Extract the level from the status (e.g., 'Pending - Level 2' -> 2)
      CASE 
        WHEN ir.status LIKE 'Pending - Level %' 
        THEN SUBSTRING(ir.status FROM 'Level ([0-9]+)')::integer
        ELSE NULL
      END AS current_level
    FROM investment_requests ir
    WHERE ir.status LIKE 'Pending - Level %'
      AND EXTRACT(DAY FROM (v_current_date - ir.submitted_date)) >= p_delay_threshold_days
  )
  SELECT 
    pr.id,
    pr.project_title,
    pr.user_id,
    pr.submitted_date,
    pr.days_pending::integer,
    up.user_id AS current_approver_id,
    up.name AS current_approver_name,
    up.role AS current_approver_role
  FROM pending_requests pr
  LEFT JOIN user_profiles up ON 
    up.role = 'Approver_L' || pr.current_level
    AND up.active = true
  WHERE pr.current_level IS NOT NULL
  ORDER BY pr.days_pending DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to send notifications when a request is submitted
CREATE OR REPLACE FUNCTION notify_on_request_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_approver RECORD;
  v_requester RECORD;
  v_total_amount numeric;
BEGIN
  -- Process if status is 'Submitted' or a pending status
  -- Handle both INSERT (new requests) and UPDATE (status changes)
  IF (NEW.status = 'Submitted' OR NEW.status LIKE 'Pending - Level %') AND 
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status IS NULL OR OLD.status = 'Draft'))) THEN
    
    -- Get requester info
    SELECT name, email INTO v_requester
    FROM user_profiles
    WHERE user_id = NEW.user_id;
    
    -- Calculate total amount
    v_total_amount := NEW.base_currency_capex + NEW.base_currency_opex;
    
    -- Find approvers who need to be notified
    FOR v_approver IN 
      SELECT * FROM get_approvers_for_request(NEW.id, v_total_amount)
    LOOP
      -- Insert notification for each approver
      INSERT INTO notifications (
        user_id,
        request_id,
        project_title,
        message,
        type,
        action_url,
        priority,
        metadata,
        created_at
      ) VALUES (
        v_approver.user_id,
        NEW.id,
        NEW.project_title,
        'New investment request requires your approval: ' || NEW.project_title,
        'approval_request',
        '/app/tracker?request=' || NEW.id,
        CASE 
          WHEN v_total_amount > 500000 THEN 'high'
          WHEN v_total_amount > 100000 THEN 'medium'
          ELSE 'low'
        END,
        jsonb_build_object(
          'amount', v_total_amount,
          'currency', NEW.currency,
          'requesterName', v_requester.name,
          'businessCaseTypes', NEW.business_case_type
        ),
        now()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_on_request_submission ON investment_requests;

-- Create trigger for notification on request submission (both INSERT and UPDATE)
CREATE TRIGGER trigger_notify_on_request_submission
  AFTER INSERT OR UPDATE OF status ON investment_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_request_submission();

-- Create a function to send notifications when an approval action is taken
CREATE OR REPLACE FUNCTION notify_on_approval_action()
RETURNS TRIGGER AS $$
DECLARE
  v_request RECORD;
  v_requester RECORD;
  v_approver RECORD;
  v_next_approver RECORD;
  v_total_amount numeric;
  v_current_level integer;
BEGIN
  -- Only process for approval actions
  IF NEW.status IN ('Approved', 'Rejected', 'On Hold') THEN
    -- Get request details
    SELECT 
      ir.id,
      ir.project_title,
      ir.user_id,
      ir.base_currency_capex + ir.base_currency_opex AS total_amount,
      ir.currency,
      ir.department
    INTO v_request
    FROM investment_requests ir
    WHERE ir.id = NEW.request_id;
    
    -- Get requester info
    SELECT up.user_id, up.name, up.email INTO v_requester
    FROM user_profiles up
    WHERE up.user_id = v_request.user_id;
    
    -- Get approver info
    SELECT up.name, up.email, up.role INTO v_approver
    FROM user_profiles up
    WHERE up.user_id = NEW.user_id;
    
    -- Extract current level from approver role
    v_current_level := CASE 
      WHEN v_approver.role LIKE 'Approver_L%' 
      THEN SUBSTRING(v_approver.role FROM 'L([0-9]+)')::integer
      ELSE 0
    END;
    
    -- 1. Notify requester of the action
    INSERT INTO notifications (
      user_id,
      request_id,
      project_title,
      message,
      type,
      action_url,
      priority,
      metadata
    ) VALUES (
      v_requester.user_id,
      NEW.request_id,
      v_request.project_title,
      CASE 
        WHEN NEW.status = 'Approved' THEN 'Your request has been approved by ' || v_approver.name || ' (' || v_approver.role || ')'
        WHEN NEW.status = 'Rejected' THEN 'Your request has been rejected by ' || v_approver.name || ' (' || v_approver.role || ')'
        ELSE 'Your request has been put on hold by ' || v_approver.name || ' (' || v_approver.role || ')'
      END,
      'approval_action',
      '/app/tracker?request=' || NEW.request_id,
      CASE 
        WHEN NEW.status = 'Rejected' THEN 'high'
        WHEN NEW.status = 'On Hold' THEN 'medium'
        ELSE 'low'
      END,
      jsonb_build_object(
        'action', lower(NEW.status),
        'approverName', v_approver.name,
        'approverRole', v_approver.role,
        'comments', NEW.comments
      )
    );
    
    -- 2. If rejected, notify next approver in hierarchy
    IF NEW.status = 'Rejected' THEN
      FOR v_next_approver IN 
        SELECT * FROM get_next_approver_in_hierarchy(NEW.request_id, v_current_level)
      LOOP
        -- Only notify if there is a next approver
        IF v_next_approver.user_id IS NOT NULL THEN
          INSERT INTO notifications (
            user_id,
            request_id,
            project_title,
            message,
            type,
            action_url,
            priority,
            metadata
          ) VALUES (
            v_next_approver.user_id,
            NEW.request_id,
            v_request.project_title,
            'Request rejected by ' || v_approver.name || '. Your review is required as the next approver in the hierarchy.',
            'rejection_notification',
            '/app/tracker?request=' || NEW.request_id,
            'high',
            jsonb_build_object(
              'rejectedBy', v_approver.name,
              'rejectedByRole', v_approver.role,
              'comments', NEW.comments
            )
          );
        END IF;
      END LOOP;
      
      -- Also notify previous approvers in the chain
      FOR v_approver IN 
        SELECT * FROM get_previous_approvers(NEW.request_id, v_current_level)
      LOOP
        INSERT INTO notifications (
          user_id,
          request_id,
          project_title,
          message,
          type,
          action_url,
          priority,
          metadata
        ) VALUES (
          v_approver.user_id,
          NEW.request_id,
          v_request.project_title,
          'Request you previously approved has been rejected by ' || NEW.approved_by || ' (' || NEW.role || ').',
          'approval_action',
          '/app/tracker?request=' || NEW.request_id,
          'medium',
          jsonb_build_object(
            'action', 'rejected',
            'approverName', NEW.approved_by,
            'approverRole', NEW.role,
            'comments', NEW.comments
          )
        );
      END LOOP;
    END IF;
    
    -- 3. If approved, notify next approver in workflow
    IF NEW.status = 'Approved' THEN
      FOR v_next_approver IN 
        SELECT * FROM get_next_approver(NEW.request_id, v_current_level)
      LOOP
        -- Only notify if there is a next approver
        IF v_next_approver.user_id IS NOT NULL THEN
          INSERT INTO notifications (
            user_id,
            request_id,
            project_title,
            message,
            type,
            action_url,
            priority,
            metadata
          ) VALUES (
            v_next_approver.user_id,
            NEW.request_id,
            v_request.project_title,
            'Request approved by ' || v_approver.name || ' and now requires your approval.',
            'approval_request',
            '/app/tracker?request=' || NEW.request_id,
            'medium',
            jsonb_build_object(
              'previousApprover', v_approver.name,
              'previousApproverRole', v_approver.role,
              'comments', NEW.comments
            )
          );
        ELSE
          -- Final approval - notify requester of completion
          INSERT INTO notifications (
            user_id,
            request_id,
            project_title,
            message,
            type,
            action_url,
            priority,
            metadata
          ) VALUES (
            v_requester.user_id,
            NEW.request_id,
            v_request.project_title,
            'Your request has been fully approved! Final approval by ' || v_approver.name || '.',
            'request_completed',
            '/app/tracker?request=' || NEW.request_id,
            'medium',
            jsonb_build_object(
              'finalApprover', v_approver.name,
              'finalApproverRole', v_approver.role,
              'comments', NEW.comments
            )
          );
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notification on approval action
CREATE TRIGGER trigger_notify_on_approval_action
  AFTER INSERT ON approval_log
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_approval_action();