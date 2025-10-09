-- Add created_by and assigned_to columns to leads tables
-- These columns track who created the lead and who it's assigned to

-- Add columns to leads_inbound if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_inbound' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE leads_inbound ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_inbound' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE leads_inbound ADD COLUMN assigned_to uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add columns to leads_prospeccao_ativa if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_prospeccao_ativa' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE leads_prospeccao_ativa ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_prospeccao_ativa' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE leads_prospeccao_ativa ADD COLUMN assigned_to uuid REFERENCES auth.users(id);
  END IF;
END $$;
