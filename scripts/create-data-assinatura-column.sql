-- Adicionar coluna data_assinatura na tabela leads
ALTER TABLE leads ADD COLUMN data_assinatura DATE;

-- Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'data_assinatura';
