/*
  # Create automatic user profile creation trigger

  1. Functions
    - `handle_new_user()` - Creates a user profile when a new user signs up
    - `create_user_profile()` - Helper function to create user profiles

  2. Triggers
    - Automatically creates a user profile when a new user is created in auth.users

  3. Security
    - Function is created with SECURITY DEFINER to bypass RLS
    - Only creates profiles for new authenticated users
*/

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name, role, department, active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Submitter'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile manually
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id uuid,
  p_email text,
  p_name text,
  p_role text,
  p_department text
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name, role, department, active)
  VALUES (p_user_id, p_email, p_name, p_role, p_department, true)
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;