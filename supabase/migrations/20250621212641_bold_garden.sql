  /*
    # Insert Sample Users for Testing

    This migration creates sample users with different roles for testing the authentication system.
    
    Login Credentials:
    - admin@BitCapro.com / password123 (Admin)
    - manager1@BitCapro.com / password123 (Approver_L1 - Department Manager)
    - director1@BitCapro.com / password123 (Approver_L2 - Director)
    - cfo@BitCapro.com / password123 (Approver_L3 - CFO)
    - ceo@BitCapro.com / password123 (Approver_L4 - CEO)
    - john.doe@BitCapro.com / password123 (Submitter)
    - jane.smith@BitCapro.com / password123 (Submitter)
  */

  -- Note: In a real application, users would be created through the Supabase Auth signup process
  -- This is for demonstration purposes only

  -- Insert sample user profiles (these will be linked when users sign up)
  INSERT INTO user_profiles (id, email, name, role, department, active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@BitCapro.com', 'System Administrator', 'Admin', 'IT', true),
    ('22222222-2222-2222-2222-222222222222', 'manager1@BitCapro.com', 'Mike Johnson', 'Approver_L1', 'IT', true),
    ('33333333-3333-3333-3333-333333333333', 'director1@BitCapro.com', 'Sarah Wilson', 'Approver_L2', 'IT', true),
    ('44444444-4444-4444-4444-444444444444', 'cfo@BitCapro.com', 'Robert Chen', 'Approver_L3', 'Finance', true),
    ('55555555-5555-5555-5555-555555555555', 'ceo@BitCapro.com', 'Emily Davis', 'Approver_L4', 'Executive', true),
    ('66666666-6666-6666-6666-666666666666', 'john.doe@BitCapro.com', 'John Doe', 'Submitter', 'IT', true),
    ('77777777-7777-7777-7777-777777777777', 'jane.smith@BitCapro.com', 'Jane Smith', 'Submitter', 'Manufacturing', true)
  ON CONFLICT (email) DO NOTHING;

  -- Update approval matrix to match the roles
  UPDATE approval_matrix SET role = 'Approver_L1' WHERE level = 1;
  UPDATE approval_matrix SET role = 'Approver_L2' WHERE level = 2;
  UPDATE approval_matrix SET role = 'Approver_L3' WHERE level = 3;
  UPDATE approval_matrix SET role = 'Approver_L4' WHERE level = 4;