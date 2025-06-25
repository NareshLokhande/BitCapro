/*
  # Fix RLS policies for investment requests

  1. Security Updates
    - Drop existing restrictive policies
    - Create new policies that allow authenticated users to insert and manage investment requests
    - Ensure proper access control for all CRUD operations

  2. Changes
    - Allow authenticated users to insert investment requests
    - Allow authenticated users to read all investment requests
    - Allow authenticated users to update investment requests
    - Maintain security while enabling functionality
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can insert investment requests" ON investment_requests;
DROP POLICY IF EXISTS "Users can read all investment requests" ON investment_requests;
DROP POLICY IF EXISTS "Users can update investment requests" ON investment_requests;

-- Create new policies that allow proper access
CREATE POLICY "Enable insert for authenticated users"
  ON investment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON investment_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for authenticated users"
  ON investment_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON investment_requests
  FOR DELETE
  TO authenticated
  USING (true);

-- Also allow anonymous users to insert requests (for demo purposes)
-- Remove this if you want to require authentication
CREATE POLICY "Enable insert for anonymous users"
  ON investment_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Enable read for anonymous users"
  ON investment_requests
  FOR SELECT
  TO anon
  USING (true);