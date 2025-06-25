/*
  # Enhanced Approval Workflow System

  1. Updates to existing tables
    - Update investment_requests status field to support level-based statuses
    - Add indexes for better performance on approval queries

  2. Enhanced approval matrix
    - Ensure proper level-based approval hierarchy
    - Add constraints for data integrity

  3. Enhanced approval log
    - Add better tracking of approval actions
    - Ensure proper foreign key relationships

  4. Functions and triggers
    - Add function to automatically route requests to appropriate approval levels
    - Add triggers to update request status based on approval actions
*/

-- Update investment_requests to support level-based statuses
DO $$
BEGIN
  -- Add check constraint for valid statuses including level-based ones
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'investment_requests_status_check'
  ) THEN
    ALTER TABLE investment_requests 
    ADD CONSTRAINT investment_requests_status_check 
    CHECK (status IN (
      'Draft', 
      'Submitted', 
      'Pending - Level 1', 
      'Pending - Level 2', 
      'Pending - Level 3', 
      'Pending - Level 4',
      'Under Review', 
      'Approved', 
      'Rejected', 
      'On Hold'
    ));
  END IF;
END $$;

-- Function to determine the appropriate approval level for a request
CREATE OR REPLACE FUNCTION get_required_approval_level(
  p_amount numeric,
  p_department text
)
RETURNS integer AS $$
DECLARE
  required_level integer;
BEGIN
  -- Find the minimum level that can approve this amount
  SELECT MIN(level) INTO required_level
  FROM approval_matrix
  WHERE active = true
    AND (department = 'All' OR department = p_department)
    AND p_amount >= amount_min
    AND p_amount <= amount_max;
  
  -- If no specific level found, default to level 1
  RETURN COALESCE(required_level, 1);
END;
$$ LANGUAGE plpgsql;

-- Function to route request to appropriate approval level
CREATE OR REPLACE FUNCTION route_request_for_approval()
RETURNS TRIGGER AS $$
DECLARE
  total_amount numeric;
  required_level integer;
BEGIN
  -- Only process if status is changing to 'Submitted'
  IF NEW.status = 'Submitted' AND (OLD.status IS NULL OR OLD.status != 'Submitted') THEN
    total_amount := NEW.capex + NEW.opex;
    required_level := get_required_approval_level(total_amount, NEW.department);
    
    -- Update status to the appropriate pending level
    NEW.status := 'Pending - Level ' || required_level;
    
    -- Log the routing action
    INSERT INTO approval_log (
      request_id,
      approved_by,
      role,
      level,
      status,
      comments,
      timestamp
    ) VALUES (
      NEW.id,
      'System',
      'System',
      0,
      'Routed for Approval',
      'Automatically routed to Level ' || required_level || ' for approval (Amount: $' || total_amount || ')',
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic routing
DROP TRIGGER IF EXISTS trigger_route_request_for_approval ON investment_requests;
CREATE TRIGGER trigger_route_request_for_approval
  BEFORE UPDATE ON investment_requests
  FOR EACH ROW
  EXECUTE FUNCTION route_request_for_approval();

-- Function to handle approval workflow progression
CREATE OR REPLACE FUNCTION process_approval_action()
RETURNS TRIGGER AS $$
DECLARE
  request_record investment_requests%ROWTYPE;
  total_amount numeric;
  next_level integer;
  new_status text;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM investment_requests
  WHERE id = NEW.request_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  total_amount := request_record.capex + request_record.opex;
  
  -- Process based on approval status
  IF NEW.status = 'Approved' THEN
    -- Find next approval level
    SELECT MIN(level) INTO next_level
    FROM approval_matrix
    WHERE active = true
      AND level > NEW.level
      AND (department = 'All' OR department = request_record.department)
      AND total_amount >= amount_min
      AND total_amount <= amount_max;
    
    IF next_level IS NOT NULL THEN
      -- Route to next level
      new_status := 'Pending - Level ' || next_level;
    ELSE
      -- No more levels, fully approved
      new_status := 'Approved';
    END IF;
    
  ELSIF NEW.status = 'Rejected' THEN
    new_status := 'Rejected';
    
  ELSIF NEW.status = 'On Hold' THEN
    new_status := 'On Hold';
    
  ELSE
    -- No status change needed
    RETURN NEW;
  END IF;
  
  -- Update the request status
  UPDATE investment_requests
  SET 
    status = new_status,
    last_updated = now()
  WHERE id = NEW.request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for approval workflow progression
DROP TRIGGER IF EXISTS trigger_process_approval_action ON approval_log;
CREATE TRIGGER trigger_process_approval_action
  AFTER INSERT ON approval_log
  FOR EACH ROW
  EXECUTE FUNCTION process_approval_action();

-- Ensure approval matrix has proper data
INSERT INTO approval_matrix (level, role, department, amount_min, amount_max, active) VALUES
  (1, 'Approver_L1', 'All', 0, 50000, true),
  (2, 'Approver_L2', 'All', 0, 200000, true),
  (3, 'Approver_L3', 'All', 0, 500000, true),
  (4, 'Approver_L4', 'All', 0, 999999999, true),
  (0, 'Admin', 'All', 0, 999999999, true)
ON CONFLICT DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investment_requests_status_amount ON investment_requests(status, (capex + opex));
CREATE INDEX IF NOT EXISTS idx_approval_matrix_level_amount ON approval_matrix(level, amount_min, amount_max) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_approval_log_request_user ON approval_log(request_id, user_id);

-- Update existing submitted requests to have proper status
UPDATE investment_requests 
SET status = 'Pending - Level 1'
WHERE status = 'Submitted';

-- Update existing under review requests to have proper status
UPDATE investment_requests 
SET status = 'Pending - Level 2'
WHERE status = 'Under Review';