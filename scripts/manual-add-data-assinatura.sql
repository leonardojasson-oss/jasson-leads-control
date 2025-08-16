-- Script para adicionar a coluna data_assinatura na tabela leads
-- Execute este comando no Supabase Dashboard > SQL Editor

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS data_assinatura DATE;

-- Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'data_assinatura';
