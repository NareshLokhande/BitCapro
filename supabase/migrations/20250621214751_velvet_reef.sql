/*
  # Fix Authentication Schema Issues

  1. Database Setup
    - Ensure users table exists and is properly configured
    - Add missing trigger function for updated_at columns
    - Fix any schema inconsistencies

  2. Security
    - Ensure proper RLS policies are in place
    - Verify auth integration works correctly

  3. Functions
    - Add trigger function for updating timestamps
    - Add function to handle new user creation
*/

-- Ensure the users table exists (this should be handled by Supabase Auth, but let's make sure)
-- Note: We don't create this table as it's managed by Supabase Auth
-- But we need to ensure our foreign key references work

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used to automatically create user profiles
  -- when a new user signs up through Supabase Auth
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the auth.users table exists and our foreign keys are valid
-- This is a safety check - if auth.users doesn't exist, we need to know
DO $$
BEGIN
  -- Check if auth.users exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'auth.users table does not exist. Please check your Supabase project setup.';
  END IF;
END $$;

-- Ensure user_profiles table has proper constraints
-- Update the foreign key to reference auth.users instead of public.users
DO $$
BEGIN
  -- Drop existing foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_fkey' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
  END IF;
  
  -- Add correct foreign key reference to auth.users
  ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Update investment_requests foreign key as well
DO $$
BEGIN
  -- Drop existing foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'investment_requests_user_id_fkey' 
    AND table_name = 'investment_requests'
  ) THEN
    ALTER TABLE investment_requests DROP CONSTRAINT investment_requests_user_id_fkey;
  END IF;
  
  -- Add correct foreign key reference to auth.users
  ALTER TABLE investment_requests 
  ADD CONSTRAINT investment_requests_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);
END $$;

-- Update approval_log foreign key as well
DO $$
BEGIN
  -- Drop existing foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'approval_log_user_id_fkey' 
    AND table_name = 'approval_log'
  ) THEN
    ALTER TABLE approval_log DROP CONSTRAINT approval_log_user_id_fkey;
  END IF;
  
  -- Add correct foreign key reference to auth.users
  ALTER TABLE approval_log 
  ADD CONSTRAINT approval_log_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);
END $$;

-- Create a trigger on auth.users to automatically create user profiles
-- This ensures that when someone signs up, they get a profile record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name, role, active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'Submitter', -- Default role
    true
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Ensure RLS is properly configured for all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_log ENABLE ROW LEVEL SECURITY;