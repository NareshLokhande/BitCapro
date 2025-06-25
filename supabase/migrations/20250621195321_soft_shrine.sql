/*
  # Investment Request Management System Schema

  1. New Tables
    - `investment_requests`
      - Core investment request data with all required fields
      - Includes compliance checklist fields
      - Multi-year data support
    - `approval_matrix`
      - Approval workflow configuration
      - Role-based approval levels with amount thresholds
    - `approval_log`
      - Tracks all approval actions and comments
      - Maintains audit trail
    - `kpis`
      - Financial metrics for each request
      - IRR, NPV, Payback Period calculations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Investment Requests Table
CREATE TABLE IF NOT EXISTS investment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_title text NOT NULL,
  objective text NOT NULL,
  description text NOT NULL,
  legal_entity text NOT NULL,
  location text NOT NULL,
  project_status text NOT NULL DEFAULT 'Planning',
  purpose text NOT NULL,
  is_in_budget boolean DEFAULT true,
  capex decimal(15,2) NOT NULL DEFAULT 0,
  opex decimal(15,2) NOT NULL DEFAULT 0,
  start_year integer NOT NULL,
  end_year integer NOT NULL,
  department text NOT NULL,
  submitted_by text NOT NULL,
  submitted_date timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now(),
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Draft',
  category text NOT NULL,
  
  -- Compliance Checklist
  strategic_fit boolean DEFAULT false,
  risk_assessment boolean DEFAULT false,
  supply_plan boolean DEFAULT false,
  legal_fit boolean DEFAULT false,
  it_fit boolean DEFAULT false,
  hsseq_compliance boolean DEFAULT false,
  
  -- Multi-year data (JSON for flexibility)
  yearly_breakdown jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Approval Matrix Table
CREATE TABLE IF NOT EXISTS approval_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level integer NOT NULL,
  role text NOT NULL,
  department text NOT NULL DEFAULT 'All',
  amount_min decimal(15,2) NOT NULL DEFAULT 0,
  amount_max decimal(15,2) NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Approval Log Table
CREATE TABLE IF NOT EXISTS approval_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES investment_requests(id) ON DELETE CASCADE,
  approved_by text NOT NULL,
  role text NOT NULL,
  level integer NOT NULL,
  status text NOT NULL,
  comments text,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- KPIs Table
CREATE TABLE IF NOT EXISTS kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES investment_requests(id) ON DELETE CASCADE,
  irr decimal(5,2) DEFAULT 0,
  npv decimal(15,2) DEFAULT 0,
  payback_period decimal(4,1) DEFAULT 0,
  basis_of_calculation text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE investment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investment_requests
CREATE POLICY "Users can read all investment requests"
  ON investment_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert investment requests"
  ON investment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update investment requests"
  ON investment_requests
  FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for approval_matrix
CREATE POLICY "Users can read approval matrix"
  ON approval_matrix
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage approval matrix"
  ON approval_matrix
  FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for approval_log
CREATE POLICY "Users can read approval logs"
  ON approval_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert approval logs"
  ON approval_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for kpis
CREATE POLICY "Users can read KPIs"
  ON kpis
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage KPIs"
  ON kpis
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default approval matrix
INSERT INTO approval_matrix (level, role, department, amount_min, amount_max) VALUES
(1, 'Department Manager', 'All', 0, 50000),
(2, 'Director', 'All', 50001, 200000),
(3, 'VP/CFO', 'All', 200001, 500000),
(4, 'CEO', 'All', 500001, 999999999);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investment_requests_status ON investment_requests(status);
CREATE INDEX IF NOT EXISTS idx_investment_requests_department ON investment_requests(department);
CREATE INDEX IF NOT EXISTS idx_investment_requests_submitted_date ON investment_requests(submitted_date);
CREATE INDEX IF NOT EXISTS idx_approval_log_request_id ON approval_log(request_id);
CREATE INDEX IF NOT EXISTS idx_kpis_request_id ON kpis(request_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_investment_requests_updated_at 
  BEFORE UPDATE ON investment_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_matrix_updated_at 
  BEFORE UPDATE ON approval_matrix 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at 
  BEFORE UPDATE ON kpis 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();