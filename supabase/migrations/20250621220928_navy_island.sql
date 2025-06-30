/*
  # Create Demo Users and Profiles

  1. New Data
    - Insert demo users into user_profiles table
    - These correspond to the demo credentials shown on the login page
    - Each user has appropriate role and department assignments

  2. Users Created
    - System Administrator (Admin role)
    - Emily Davis (CEO/Approver_L4)
    - Robert Chen (CFO/Approver_L3) 
    - Sarah Wilson (Director/Approver_L2)
    - Mike Johnson (Manager/Approver_L1)
    - John Doe (Submitter)

  3. Security
    - All users are set as active
    - Proper role assignments for approval workflow
    - Department assignments for organizational structure

  Note: The actual Supabase Auth users need to be created manually in the Supabase dashboard
  with the emails and password 'password123', or users can sign up through the application.
*/

-- Insert demo user profiles
-- Note: These profiles will be linked to Auth users when they sign up or are created
INSERT INTO user_profiles (user_id, email, name, role, department, active) VALUES
  -- Generate placeholder UUIDs for now - these will be updated when real auth users are created
  (gen_random_uuid(), 'admin@BitCapro.com', 'System Administrator', 'Admin', 'IT', true),
  (gen_random_uuid(), 'ceo@BitCapro.com', 'Emily Davis', 'Approver_L4', 'Executive', true),
  (gen_random_uuid(), 'cfo@BitCapro.com', 'Robert Chen', 'Approver_L3', 'Finance', true),
  (gen_random_uuid(), 'director1@BitCapro.com', 'Sarah Wilson', 'Approver_L2', 'Operations', true),
  (gen_random_uuid(), 'manager1@BitCapro.com', 'Mike Johnson', 'Approver_L1', 'Engineering', true),
  (gen_random_uuid(), 'john.doe@BitCapro.com', 'John Doe', 'Submitter', 'Engineering', true)
ON CONFLICT (email) DO NOTHING;

-- Insert approval matrix rules to support the approval workflow
INSERT INTO approval_matrix (level, role, department, amount_min, amount_max, active) VALUES
  (1, 'Approver_L1', 'All', 0, 50000, true),
  (2, 'Approver_L2', 'All', 0, 200000, true),
  (3, 'Approver_L3', 'All', 0, 500000, true),
  (4, 'Approver_L4', 'All', 0, 999999999, true),
  (0, 'Admin', 'All', 0, 999999999, true)
ON CONFLICT DO NOTHING;