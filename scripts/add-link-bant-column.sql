-- Add LINK BANT column to leads table
ALTER TABLE leads 
ADD COLUMN link_bant TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN leads.link_bant IS 'Campo para armazenar links BANT (URLs)';
