/*
  # Business Case Type Extension

  1. New Fields
    - Add business_case_type (array of text) to investment_requests
    - Add supporting_documents (jsonb) to store file metadata
    - Add conditional fields for different business case types

  2. Enhanced Approval Matrix
    - Add business_case_type routing rules
    - Support for role-based routing by case type

  3. New Tables
    - business_case_routing for complex approval workflows
    - supporting_documents for file management

  4. Functions
    - Enhanced routing logic for business case types
    - Validation functions for required fields
*/

-- Add business case type fields to investment_requests
DO $$
BEGIN
  -- Add business_case_type array field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'business_case_type'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN business_case_type text[] DEFAULT '{}';
  END IF;

  -- Add supporting documents field (JSON metadata)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'supporting_documents'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN supporting_documents jsonb DEFAULT '[]';
  END IF;

  -- Add conditional fields for different business case types
  
  -- ESG specific fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'carbon_footprint_data'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN carbon_footprint_data jsonb DEFAULT '{}';
  END IF;

  -- IPO Prep specific fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'stock_exchange_target'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN stock_exchange_target text;
  END IF;

  -- Compliance specific fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'regulatory_requirements'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN regulatory_requirements jsonb DEFAULT '{}';
  END IF;

  -- Cost Control specific fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'cost_savings_target'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN cost_savings_target numeric(15,2) DEFAULT 0;
  END IF;

  -- Expansion specific fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'market_expansion_data'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN market_expansion_data jsonb DEFAULT '{}';
  END IF;

  -- Asset Creation specific fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'asset_details'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN asset_details jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create business case routing table for complex approval workflows
CREATE TABLE IF NOT EXISTS business_case_routing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_case_type text NOT NULL,
  required_role text NOT NULL,
  approval_level integer NOT NULL,
  department text DEFAULT 'All',
  amount_min numeric(15,2) DEFAULT 0,
  amount_max numeric(15,2) DEFAULT 999999999,
  is_mandatory boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on business_case_routing
ALTER TABLE business_case_routing ENABLE ROW LEVEL SECURITY;

-- Create policies for business_case_routing
CREATE POLICY "Enable all access for authenticated users" ON business_case_routing
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for anonymous users" ON business_case_routing
  FOR SELECT TO anon USING (true);

-- Insert default business case routing rules
INSERT INTO business_case_routing (business_case_type, required_role, approval_level, department, amount_min, amount_max, is_mandatory) VALUES
  -- ESG cases require Sustainability Officer
  ('ESG', 'Sustainability_Officer', 2, 'All', 0, 999999999, true),
  ('ESG', 'Approver_L3', 3, 'All', 100000, 999999999, true),
  
  -- IPO Prep requires CFO and Legal
  ('IPO Prep', 'CFO', 3, 'All', 0, 999999999, true),
  ('IPO Prep', 'Legal_Officer', 2, 'All', 0, 999999999, true),
  ('IPO Prep', 'Approver_L4', 4, 'All', 500000, 999999999, true),
  
  -- Compliance requires Compliance Officer
  ('Compliance', 'Compliance_Officer', 2, 'All', 0, 999999999, true),
  
  -- Cost Control has standard routing
  ('Cost Control', 'Approver_L1', 1, 'All', 0, 50000, false),
  ('Cost Control', 'Approver_L2', 2, 'All', 50001, 200000, false),
  
  -- Expansion requires additional business review
  ('Expansion', 'Business_Development', 2, 'All', 100000, 999999999, true),
  ('Expansion', 'Approver_L3', 3, 'All', 500000, 999999999, true),
  
  -- Asset Creation requires Asset Manager
  ('Asset Creation', 'Asset_Manager', 2, 'All', 50000, 999999999, true)
ON CONFLICT DO NOTHING;

-- Add new roles to user_profiles constraint
DO $$
BEGIN
  -- Drop existing constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'user_profiles_role_check'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_role_check;
  END IF;
  
  -- Add new constraint with additional roles
  ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN (
    'Admin', 'Submitter', 'Approver_L1', 'Approver_L2', 'Approver_L3', 'Approver_L4',
    'Sustainability_Officer', 'CFO', 'Legal_Officer', 'Compliance_Officer', 
    'Business_Development', 'Asset_Manager'
  ));
END $$;

-- Create function to validate business case requirements
CREATE OR REPLACE FUNCTION validate_business_case_requirements(
  p_business_case_types text[],
  p_supporting_documents jsonb,
  p_carbon_footprint_data jsonb,
  p_stock_exchange_target text,
  p_regulatory_requirements jsonb
)
RETURNS text[] AS $$
DECLARE
  validation_errors text[] := '{}';
BEGIN
  -- Check if at least one business case type is selected
  IF array_length(p_business_case_types, 1) IS NULL OR array_length(p_business_case_types, 1) = 0 THEN
    validation_errors := array_append(validation_errors, 'At least one Business Case Type must be selected');
  END IF;
  
  -- ESG validation
  IF 'ESG' = ANY(p_business_case_types) THEN
    IF jsonb_array_length(p_supporting_documents) = 0 THEN
      validation_errors := array_append(validation_errors, 'ESG cases require supporting documents (ESG reports, sustainability plans, etc.)');
    END IF;
    
    IF p_carbon_footprint_data IS NULL OR p_carbon_footprint_data = '{}' THEN
      validation_errors := array_append(validation_errors, 'ESG cases require carbon footprint data');
    END IF;
  END IF;
  
  -- IPO Prep validation
  IF 'IPO Prep' = ANY(p_business_case_types) THEN
    IF p_stock_exchange_target IS NULL OR p_stock_exchange_target = '' THEN
      validation_errors := array_append(validation_errors, 'IPO Prep cases require target stock exchange specification');
    END IF;
    
    IF jsonb_array_length(p_supporting_documents) = 0 THEN
      validation_errors := array_append(validation_errors, 'IPO Prep cases require supporting documents (business plans, financial projections, etc.)');
    END IF;
  END IF;
  
  -- Compliance validation
  IF 'Compliance' = ANY(p_business_case_types) THEN
    IF p_regulatory_requirements IS NULL OR p_regulatory_requirements = '{}' THEN
      validation_errors := array_append(validation_errors, 'Compliance cases require regulatory requirements documentation');
    END IF;
  END IF;
  
  RETURN validation_errors;
END;
$$ LANGUAGE plpgsql;

-- Enhanced routing function that considers business case types
CREATE OR REPLACE FUNCTION get_required_approval_levels_for_business_case(
  p_amount numeric,
  p_department text,
  p_business_case_types text[]
)
RETURNS TABLE(role text, level integer, is_mandatory boolean) AS $$
BEGIN
  -- Get standard approval levels based on amount
  RETURN QUERY
  SELECT 
    am.role,
    am.level,
    false as is_mandatory
  FROM approval_matrix am
  WHERE am.active = true
    AND (am.department = 'All' OR am.department = p_department)
    AND p_amount >= am.amount_min
    AND p_amount <= am.amount_max
  
  UNION
  
  -- Get business case specific routing
  SELECT 
    bcr.required_role as role,
    bcr.approval_level as level,
    bcr.is_mandatory
  FROM business_case_routing bcr
  WHERE bcr.active = true
    AND bcr.business_case_type = ANY(p_business_case_types)
    AND (bcr.department = 'All' OR bcr.department = p_department)
    AND p_amount >= bcr.amount_min
    AND p_amount <= bcr.amount_max
  
  ORDER BY level, is_mandatory DESC;
END;
$$ LANGUAGE plpgsql;

-- Update the route_request_for_approval function to handle business case types
CREATE OR REPLACE FUNCTION route_request_for_approval()
RETURNS TRIGGER AS $$
DECLARE
  total_amount numeric;
  required_level integer;
  validation_errors text[];
  approval_levels record;
  routing_info text := '';
BEGIN
  -- Only process if status is changing to 'Submitted'
  IF NEW.status = 'Submitted' AND (OLD.status IS NULL OR OLD.status != 'Submitted') THEN
    -- Validate business case requirements
    validation_errors := validate_business_case_requirements(
      NEW.business_case_type,
      NEW.supporting_documents,
      NEW.carbon_footprint_data,
      NEW.stock_exchange_target,
      NEW.regulatory_requirements
    );
    
    -- If validation fails, prevent submission
    IF array_length(validation_errors, 1) > 0 THEN
      RAISE EXCEPTION 'Validation failed: %', array_to_string(validation_errors, '; ');
    END IF;
    
    -- Use base currency amounts for approval routing
    total_amount := NEW.base_currency_capex + NEW.base_currency_opex;
    
    -- Get all required approval levels for this business case
    routing_info := 'Business Case Types: ' || array_to_string(NEW.business_case_type, ', ') || '. ';
    
    -- Find the minimum required level to start with
    SELECT MIN(level) INTO required_level
    FROM get_required_approval_levels_for_business_case(total_amount, NEW.department, NEW.business_case_type);
    
    required_level := COALESCE(required_level, 1);
    
    -- Update status to the appropriate pending level
    NEW.status := 'Pending - Level ' || required_level;
    
    -- Build routing information
    FOR approval_levels IN 
      SELECT role, level, is_mandatory 
      FROM get_required_approval_levels_for_business_case(total_amount, NEW.department, NEW.business_case_type)
      ORDER BY level
    LOOP
      routing_info := routing_info || 'Level ' || approval_levels.level || ': ' || approval_levels.role;
      IF approval_levels.is_mandatory THEN
        routing_info := routing_info || ' (Required)';
      END IF;
      routing_info := routing_info || '; ';
    END LOOP;
    
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
      'Automatically routed to Level ' || required_level || ' for approval. Amount: ' || NEW.currency || ' ' || (NEW.capex + NEW.opex) || ' / USD ' || total_amount || '. ' || routing_info,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on business_case_routing
CREATE TRIGGER update_business_case_routing_updated_at
    BEFORE UPDATE ON business_case_routing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investment_requests_business_case_type ON investment_requests USING GIN (business_case_type);
CREATE INDEX IF NOT EXISTS idx_business_case_routing_type ON business_case_routing(business_case_type);
CREATE INDEX IF NOT EXISTS idx_business_case_routing_role ON business_case_routing(required_role);

-- Add some sample users with new roles for testing
INSERT INTO user_profiles (email, name, role, department, active) VALUES
  ('sustainability@approvia.com', 'Green Smith', 'Sustainability_Officer', 'ESG', true),
  ('legal@approvia.com', 'Legal Eagle', 'Legal_Officer', 'Legal', true),
  ('compliance@approvia.com', 'Compliance Jones', 'Compliance_Officer', 'Compliance', true),
  ('bizdev@approvia.com', 'Business Developer', 'Business_Development', 'Strategy', true),
  ('assets@approvia.com', 'Asset Manager', 'Asset_Manager', 'Operations', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  active = EXCLUDED.active,
  updated_at = now();