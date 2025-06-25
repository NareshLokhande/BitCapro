/*
  # Create demo users with proper approval hierarchy

  1. Demo Users Setup
    - Creates demo users in auth.users with proper credentials
    - Links them to user_profiles with correct roles
    - Ensures approval matrix is properly configured

  2. Security
    - Uses existing RLS policies
    - Maintains proper user-profile relationships
    - Ensures approval workflow integrity

  3. Demo Credentials
    - admin@approvia.com / password123 (Admin - can manage everything)
    - ceo@approvia.com / password123 (Approver_L4 - CEO level approval)
    - cfo@approvia.com / password123 (Approver_L3 - CFO level approval)
    - director1@approvia.com / password123 (Approver_L2 - Director level)
    - manager1@approvia.com / password123 (Approver_L1 - Manager level)
    - john.doe@approvia.com / password123 (Submitter - can submit requests)
*/

-- Temporarily disable the trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Insert demo users into auth.users only if they don't exist
DO $$
BEGIN
  -- Admin user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@approvia.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'admin@approvia.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "System Administrator"}',
      false,
      'authenticated',
      'authenticated'
    );
  END IF;

  -- CEO user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ceo@approvia.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000000',
      'ceo@approvia.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Emily Davis"}',
      false,
      'authenticated',
      'authenticated'
    );
  END IF;

  -- CFO user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cfo@approvia.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000000',
      'cfo@approvia.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Robert Chen"}',
      false,
      'authenticated',
      'authenticated'
    );
  END IF;

  -- Director user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'director1@approvia.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000000',
      'director1@approvia.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Sarah Wilson"}',
      false,
      'authenticated',
      'authenticated'
    );
  END IF;

  -- Manager user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager1@approvia.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      '00000000-0000-0000-0000-000000000005',
      '00000000-0000-0000-0000-000000000000',
      'manager1@approvia.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Mike Johnson"}',
      false,
      'authenticated',
      'authenticated'
    );
  END IF;

  -- Submitter user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'john.doe@approvia.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      '00000000-0000-0000-0000-000000000006',
      '00000000-0000-0000-0000-000000000000',
      'john.doe@approvia.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "John Doe"}',
      false,
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;

-- Insert corresponding records into the users table (if it exists and is separate from auth.users)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    INSERT INTO users (id, email, created_at, updated_at) VALUES
      ('00000000-0000-0000-0000-000000000001', 'admin@approvia.com', now(), now()),
      ('00000000-0000-0000-0000-000000000002', 'ceo@approvia.com', now(), now()),
      ('00000000-0000-0000-0000-000000000003', 'cfo@approvia.com', now(), now()),
      ('00000000-0000-0000-0000-000000000004', 'director1@approvia.com', now(), now()),
      ('00000000-0000-0000-0000-000000000005', 'manager1@approvia.com', now(), now()),
      ('00000000-0000-0000-0000-000000000006', 'john.doe@approvia.com', now(), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Insert user profiles with proper roles and hierarchy
INSERT INTO user_profiles (user_id, email, name, role, department, active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@approvia.com', 'System Administrator', 'Admin', 'IT', true),
  ('00000000-0000-0000-0000-000000000002', 'ceo@approvia.com', 'Emily Davis', 'Approver_L4', 'Executive', true),
  ('00000000-0000-0000-0000-000000000003', 'cfo@approvia.com', 'Robert Chen', 'Approver_L3', 'Finance', true),
  ('00000000-0000-0000-0000-000000000004', 'director1@approvia.com', 'Sarah Wilson', 'Approver_L2', 'Operations', true),
  ('00000000-0000-0000-0000-000000000005', 'manager1@approvia.com', 'Mike Johnson', 'Approver_L1', 'Operations', true),
  ('00000000-0000-0000-0000-000000000006', 'john.doe@approvia.com', 'John Doe', 'Submitter', 'Engineering', true)
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  active = EXCLUDED.active,
  updated_at = now();

-- Ensure approval matrix is properly configured for the hierarchy
DELETE FROM approval_matrix WHERE id IS NOT NULL;

INSERT INTO approval_matrix (level, role, department, amount_min, amount_max, active) VALUES
  (1, 'Approver_L1', 'All', 0, 50000, true),
  (2, 'Approver_L2', 'All', 50001, 200000, true),
  (3, 'Approver_L3', 'All', 200001, 500000, true),
  (4, 'Approver_L4', 'All', 500001, 999999999, true),
  (0, 'Admin', 'All', 0, 999999999, true);

-- Re-enable the trigger for future user registrations
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert some sample investment requests to demonstrate the workflow
INSERT INTO investment_requests (
  project_title,
  objective,
  description,
  legal_entity,
  location,
  project_status,
  purpose,
  is_in_budget,
  capex,
  opex,
  start_year,
  end_year,
  department,
  submitted_by,
  priority,
  status,
  category,
  strategic_fit,
  risk_assessment,
  supply_plan,
  legal_fit,
  it_fit,
  hsseq_compliance,
  yearly_breakdown,
  user_id
) VALUES
  (
    'Digital Transformation Initiative',
    'Modernize IT infrastructure and improve operational efficiency',
    'Comprehensive digital transformation including cloud migration, process automation, and data analytics platform implementation',
    'TechCorp Solutions Ltd',
    'New York, NY',
    'Planning',
    'Operational Efficiency',
    true,
    250000,
    75000,
    2024,
    2026,
    'IT',
    'John Doe',
    'High',
    'Submitted',
    'Technology',
    true,
    true,
    true,
    true,
    true,
    true,
    '{"2024": {"capex": 150000, "opex": 25000}, "2025": {"capex": 75000, "opex": 25000}, "2026": {"capex": 25000, "opex": 25000}}',
    '00000000-0000-0000-0000-000000000006'
  ),
  (
    'Manufacturing Equipment Upgrade',
    'Replace aging production line equipment',
    'Complete overhaul of production line 3 with state-of-the-art manufacturing equipment to improve efficiency and product quality',
    'Manufacturing Corp Inc',
    'Detroit, MI',
    'Planning',
    'Capacity Expansion',
    false,
    450000,
    85000,
    2024,
    2025,
    'Manufacturing',
    'John Doe',
    'Critical',
    'Under Review',
    'Equipment',
    true,
    true,
    false,
    true,
    false,
    true,
    '{"2024": {"capex": 300000, "opex": 45000}, "2025": {"capex": 150000, "opex": 40000}}',
    '00000000-0000-0000-0000-000000000006'
  ),
  (
    'Small Office Renovation',
    'Renovate the break room and meeting spaces',
    'Update furniture, lighting, and technology in common areas to improve employee satisfaction and productivity',
    'TechCorp Solutions Ltd',
    'Austin, TX',
    'Planning',
    'Employee Satisfaction',
    true,
    25000,
    5000,
    2024,
    2024,
    'Facilities',
    'John Doe',
    'Low',
    'Draft',
    'Infrastructure',
    true,
    true,
    true,
    true,
    true,
    true,
    '{"2024": {"capex": 25000, "opex": 5000}}',
    '00000000-0000-0000-0000-000000000006'
  );

-- Insert corresponding KPIs for the sample requests
INSERT INTO kpis (request_id, irr, npv, payback_period, basis_of_calculation)
SELECT 
  ir.id,
  CASE 
    WHEN ir.project_title = 'Digital Transformation Initiative' THEN 28.5
    WHEN ir.project_title = 'Manufacturing Equipment Upgrade' THEN 35.2
    WHEN ir.project_title = 'Small Office Renovation' THEN 15.0
  END as irr,
  CASE 
    WHEN ir.project_title = 'Digital Transformation Initiative' THEN 185000
    WHEN ir.project_title = 'Manufacturing Equipment Upgrade' THEN 275000
    WHEN ir.project_title = 'Small Office Renovation' THEN 45000
  END as npv,
  CASE 
    WHEN ir.project_title = 'Digital Transformation Initiative' THEN 2.3
    WHEN ir.project_title = 'Manufacturing Equipment Upgrade' THEN 1.8
    WHEN ir.project_title = 'Small Office Renovation' THEN 4.2
  END as payback_period,
  CASE 
    WHEN ir.project_title = 'Digital Transformation Initiative' THEN 'Cost savings from automation and efficiency gains over 5-year period'
    WHEN ir.project_title = 'Manufacturing Equipment Upgrade' THEN 'Increased production capacity and reduced maintenance costs'
    WHEN ir.project_title = 'Small Office Renovation' THEN 'Employee productivity improvements and reduced facility costs'
  END as basis_of_calculation
FROM investment_requests ir
WHERE ir.project_title IN ('Digital Transformation Initiative', 'Manufacturing Equipment Upgrade', 'Small Office Renovation')
ON CONFLICT DO NOTHING;

-- Insert some approval logs to show the workflow in action
INSERT INTO approval_log (request_id, approved_by, role, level, status, comments, user_id)
SELECT 
  ir.id,
  'Mike Johnson',
  'Approver_L1',
  1,
  'Under Review',
  'Reviewing technical feasibility and resource allocation requirements',
  '00000000-0000-0000-0000-000000000005'
FROM investment_requests ir
WHERE ir.project_title = 'Digital Transformation Initiative'
ON CONFLICT DO NOTHING;