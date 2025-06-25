/*
  # Authentication and User Management System

  1. New Tables
    - `user_profiles` - Extended user information with roles
    - Sample users with different roles for testing

  2. Security
    - Enable RLS on user_profiles table
    - Add policies for user management
    - Update existing policies to work with authenticated users

  3. Sample Data
    - Create sample users with different roles
    - Admin, Approvers at different levels, and Submitters
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Submitter', 'Approver_L1', 'Approver_L2', 'Approver_L3', 'Approver_L4')),
  department text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'Admin'
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, name, role, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Submitter'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'General')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update investment_requests to link to user_id instead of text
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Update approval_log to link to user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'approval_log' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE approval_log ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Update RLS policies for investment_requests to work with authenticated users
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON investment_requests;
DROP POLICY IF EXISTS "Enable read for anonymous users" ON investment_requests;

-- Users can only see requests they submitted or requests they can approve
CREATE POLICY "Users can read relevant requests"
  ON investment_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR -- Own requests
    EXISTS ( -- Or requests they can approve based on role and amount
      SELECT 1 FROM user_profiles up
      JOIN approval_matrix am ON (
        up.role = am.role AND 
        (am.department = 'All' OR am.department = investment_requests.department) AND
        (investment_requests.capex + investment_requests.opex) >= am.amount_min AND
        (investment_requests.capex + investment_requests.opex) <= am.amount_max AND
        am.active = true
      )
      WHERE up.user_id = auth.uid()
    ) OR
    EXISTS ( -- Or user is admin
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'Admin'
    )
  );

-- Users can insert their own requests
CREATE POLICY "Users can insert own requests"
  ON investment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own requests or approvers can update status
CREATE POLICY "Users can update relevant requests"
  ON investment_requests
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR -- Own requests
    EXISTS ( -- Or can approve based on role
      SELECT 1 FROM user_profiles up
      JOIN approval_matrix am ON (
        up.role = am.role AND 
        (am.department = 'All' OR am.department = investment_requests.department) AND
        (investment_requests.capex + investment_requests.opex) >= am.amount_min AND
        (investment_requests.capex + investment_requests.opex) <= am.amount_max AND
        am.active = true
      )
      WHERE up.user_id = auth.uid()
    ) OR
    EXISTS ( -- Or user is admin
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'Admin'
    )
  );

-- Update KPIs policies to work with authenticated users
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON kpis;

CREATE POLICY "Users can manage relevant KPIs"
  ON kpis
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investment_requests ir
      WHERE ir.id = kpis.request_id AND (
        ir.user_id = auth.uid() OR -- Own request's KPIs
        EXISTS ( -- Or can approve the request
          SELECT 1 FROM user_profiles up
          JOIN approval_matrix am ON (
            up.role = am.role AND 
            (am.department = 'All' OR am.department = ir.department) AND
            (ir.capex + ir.opex) >= am.amount_min AND
            (ir.capex + ir.opex) <= am.amount_max AND
            am.active = true
          )
          WHERE up.user_id = auth.uid()
        ) OR
        EXISTS ( -- Or user is admin
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() AND role = 'Admin'
        )
      )
    )
  );

-- Update approval_log policies
CREATE POLICY "Users can read relevant approval logs"
  ON approval_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investment_requests ir
      WHERE ir.id = approval_log.request_id AND (
        ir.user_id = auth.uid() OR -- Own request's logs
        EXISTS ( -- Or can approve the request
          SELECT 1 FROM user_profiles up
          JOIN approval_matrix am ON (
            up.role = am.role AND 
            (am.department = 'All' OR am.department = ir.department) AND
            (ir.capex + ir.opex) >= am.amount_min AND
            (ir.capex + ir.opex) <= am.amount_max AND
            am.active = true
          )
          WHERE up.user_id = auth.uid()
        ) OR
        EXISTS ( -- Or user is admin
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() AND role = 'Admin'
        )
      )
    )
  );

CREATE POLICY "Approvers can insert approval logs"
  ON approval_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM investment_requests ir
      JOIN user_profiles up ON up.user_id = auth.uid()
      JOIN approval_matrix am ON (
        up.role = am.role AND 
        (am.department = 'All' OR am.department = ir.department) AND
        (ir.capex + ir.opex) >= am.amount_min AND
        (ir.capex + ir.opex) <= am.amount_max AND
        am.active = true
      )
      WHERE ir.id = approval_log.request_id
    )
  );

-- Create updated_at trigger for user_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();