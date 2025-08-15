-- Adicionar coluna observacoes_closer na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS observacoes_closer TEXT;

-- Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'observacoes_closer';
