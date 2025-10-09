-- Setup RLS policies for leads tables based on user roles
-- ADMIN/GESTOR: full access
-- SDR/CLOSER: can view all, update only their assigned leads

-- Enable RLS on all leads tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_inbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_prospeccao_ativa ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LEADS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins and Gestores can do everything on leads" ON leads;
DROP POLICY IF EXISTS "SDRs and Closers can view all leads" ON leads;
DROP POLICY IF EXISTS "SDRs and Closers can update assigned leads" ON leads;
DROP POLICY IF EXISTS "All authenticated users can insert leads" ON leads;

-- Admins and Gestores have full access
CREATE POLICY "Admins and Gestores can do everything on leads" 
  ON leads FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- SDRs and Closers can view all leads
CREATE POLICY "SDRs and Closers can view all leads" 
  ON leads FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SDR', 'CLOSER')
    )
  );

-- SDRs and Closers can update leads assigned to them
CREATE POLICY "SDRs and Closers can update assigned leads" 
  ON leads FOR UPDATE 
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

-- All authenticated users can insert leads
CREATE POLICY "All authenticated users can insert leads" 
  ON leads FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- LEADS_INBOUND TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins and Gestores can do everything on leads_inbound" ON leads_inbound;
DROP POLICY IF EXISTS "SDRs and Closers can view all leads_inbound" ON leads_inbound;
DROP POLICY IF EXISTS "SDRs and Closers can update assigned leads_inbound" ON leads_inbound;
DROP POLICY IF EXISTS "All authenticated users can insert leads_inbound" ON leads_inbound;

CREATE POLICY "Admins and Gestores can do everything on leads_inbound" 
  ON leads_inbound FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

CREATE POLICY "SDRs and Closers can view all leads_inbound" 
  ON leads_inbound FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SDR', 'CLOSER')
    )
  );

CREATE POLICY "SDRs and Closers can update assigned leads_inbound" 
  ON leads_inbound FOR UPDATE 
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

CREATE POLICY "All authenticated users can insert leads_inbound" 
  ON leads_inbound FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- LEADS_PROSPECCAO_ATIVA TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins and Gestores can do everything on leads_prospeccao_ativa" ON leads_prospeccao_ativa;
DROP POLICY IF EXISTS "SDRs and Closers can view all leads_prospeccao_ativa" ON leads_prospeccao_ativa;
DROP POLICY IF EXISTS "SDRs and Closers can update assigned leads_prospeccao_ativa" ON leads_prospeccao_ativa;
DROP POLICY IF EXISTS "All authenticated users can insert leads_prospeccao_ativa" ON leads_prospeccao_ativa;

CREATE POLICY "Admins and Gestores can do everything on leads_prospeccao_ativa" 
  ON leads_prospeccao_ativa FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

CREATE POLICY "SDRs and Closers can view all leads_prospeccao_ativa" 
  ON leads_prospeccao_ativa FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('SDR', 'CLOSER')
    )
  );

CREATE POLICY "SDRs and Closers can update assigned leads_prospeccao_ativa" 
  ON leads_prospeccao_ativa FOR UPDATE 
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')
    )
  );

CREATE POLICY "All authenticated users can insert leads_prospeccao_ativa" 
  ON leads_prospeccao_ativa FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
