-- Script para adicionar a coluna TEMPERATURA à tabela leads
-- Added DEFAULT 'Frio' to set default value for new leads
ALTER TABLE leads 
ADD COLUMN temperatura TEXT DEFAULT 'Frio' CHECK (temperatura IN ('Frio', 'Morno', 'Quente'));

-- Comentário sobre a coluna
COMMENT ON COLUMN leads.temperatura IS 'Temperatura do lead: Frio, Morno ou Quente. Valor padrão: Frio';
