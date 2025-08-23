-- Script para renomear colunas com nomes incorretos na tabela leads
-- Execute este script ANTES de atualizar o código da aplicação

-- Renomear observacoes para observacoes_sdr
ALTER TABLE leads RENAME COLUMN observacoes TO observacoes_sdr;

-- Renomear data_venda para data_marcacao
ALTER TABLE leads RENAME COLUMN data_venda TO data_marcacao;

-- Renomear data_fechamento para data_reuniao
ALTER TABLE leads RENAME COLUMN data_fechamento TO data_reuniao;

-- Renomear fee_total para fee_mrr
ALTER TABLE leads RENAME COLUMN fee_total TO fee_mrr;

-- Verificar se as colunas foram renomeadas corretamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('observacoes_sdr', 'data_marcacao', 'data_reuniao', 'fee_mrr')
ORDER BY column_name;
