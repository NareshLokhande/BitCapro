/*
  # Add Currency Support to Investment Requests

  1. Schema Updates
    - Add currency field to investment_requests table
    - Add exchange_rate field for conversion tracking
    - Add base_currency_capex and base_currency_opex for USD equivalents
    - Update constraints and indexes

  2. Currency Support
    - Support for major currencies (USD, EUR, GBP, JPY, CAD, AUD, etc.)
    - Store original amounts in selected currency
    - Store USD equivalents for comparison and approval matrix
    - Track exchange rates used for conversion

  3. Indexes
    - Add indexes for currency-based queries
    - Maintain performance for approval workflows
*/

-- Add currency support columns to investment_requests
DO $$
BEGIN
  -- Add currency field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'currency'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN currency text NOT NULL DEFAULT 'USD';
  END IF;

  -- Add exchange rate field (rate to USD)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'exchange_rate'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN exchange_rate decimal(10,6) NOT NULL DEFAULT 1.0;
  END IF;

  -- Add base currency amounts (USD equivalents)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'base_currency_capex'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN base_currency_capex decimal(15,2) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'base_currency_opex'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN base_currency_opex decimal(15,2) NOT NULL DEFAULT 0;
  END IF;

  -- Add currency conversion timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investment_requests' AND column_name = 'currency_conversion_date'
  ) THEN
    ALTER TABLE investment_requests ADD COLUMN currency_conversion_date timestamptz DEFAULT now();
  END IF;
END $$;

-- Add constraint for supported currencies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'investment_requests_currency_check'
  ) THEN
    ALTER TABLE investment_requests 
    ADD CONSTRAINT investment_requests_currency_check 
    CHECK (currency IN (
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'SGD',
      'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK',
      'RUB', 'TRY', 'BRL', 'MXN', 'ZAR', 'KRW', 'THB', 'MYR', 'IDR', 'PHP'
    ));
  END IF;
END $$;

-- Create function to update base currency amounts
CREATE OR REPLACE FUNCTION update_base_currency_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate USD equivalents
  NEW.base_currency_capex := NEW.capex * NEW.exchange_rate;
  NEW.base_currency_opex := NEW.opex * NEW.exchange_rate;
  NEW.currency_conversion_date := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update base currency amounts
DROP TRIGGER IF EXISTS trigger_update_base_currency ON investment_requests;
CREATE TRIGGER trigger_update_base_currency
  BEFORE INSERT OR UPDATE ON investment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_base_currency_amounts();

-- Update existing records to have USD as default currency
UPDATE investment_requests 
SET 
  currency = 'USD',
  exchange_rate = 1.0,
  base_currency_capex = capex,
  base_currency_opex = opex,
  currency_conversion_date = now()
WHERE currency IS NULL OR currency = '';

-- Update approval matrix to work with base currency amounts
-- The approval workflow will use base_currency_capex + base_currency_opex for amount comparisons

-- Update the route_request_for_approval function to use base currency
CREATE OR REPLACE FUNCTION route_request_for_approval()
RETURNS TRIGGER AS $$
DECLARE
  total_amount numeric;
  required_level integer;
BEGIN
  -- Only process if status is changing to 'Submitted'
  IF NEW.status = 'Submitted' AND (OLD.status IS NULL OR OLD.status != 'Submitted') THEN
    -- Use base currency amounts for approval routing
    total_amount := NEW.base_currency_capex + NEW.base_currency_opex;
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
      'Automatically routed to Level ' || required_level || ' for approval (Amount: ' || NEW.currency || ' ' || (NEW.capex + NEW.opex) || ' / USD ' || total_amount || ')',
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the process_approval_action function to use base currency
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
  
  -- Use base currency amounts for approval decisions
  total_amount := request_record.base_currency_capex + request_record.base_currency_opex;
  
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

-- Add indexes for currency-based queries
CREATE INDEX IF NOT EXISTS idx_investment_requests_currency ON investment_requests(currency);
CREATE INDEX IF NOT EXISTS idx_investment_requests_base_amount ON investment_requests((base_currency_capex + base_currency_opex));

-- Create a view for easy currency conversion display
CREATE OR REPLACE VIEW investment_requests_with_currency AS
SELECT 
  ir.*,
  (ir.capex + ir.opex) as total_amount_original,
  (ir.base_currency_capex + ir.base_currency_opex) as total_amount_usd,
  CASE 
    WHEN ir.currency = 'USD' THEN '$'
    WHEN ir.currency = 'EUR' THEN '€'
    WHEN ir.currency = 'GBP' THEN '£'
    WHEN ir.currency = 'JPY' THEN '¥'
    WHEN ir.currency = 'CAD' THEN 'C$'
    WHEN ir.currency = 'AUD' THEN 'A$'
    ELSE ir.currency || ' '
  END as currency_symbol
FROM investment_requests ir;