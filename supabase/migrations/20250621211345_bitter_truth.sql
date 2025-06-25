/*
  # Add KPI insert policy for anonymous users

  1. Security Changes
    - Add policy to allow anonymous users to insert KPI data
    - This matches the existing pattern used for investment_requests table
    - Maintains data security while allowing the application to function

  2. Policy Details
    - Allows INSERT operations for 'anon' role on 'kpis' table
    - Consistent with the investment_requests table policies
    - Required for the submit request functionality to work properly
*/

-- Add policy to allow anonymous users to insert KPI data
CREATE POLICY "Enable insert for anonymous users"
  ON kpis
  FOR INSERT
  TO anon
  WITH CHECK (true);