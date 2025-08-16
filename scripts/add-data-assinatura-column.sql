-- Adicionar coluna data_assinatura à tabela leads
ALTER TABLE leads 
ADD COLUMN data_assinatura DATE;

-- Comentário explicativo
COMMENT ON COLUMN leads.data_assinatura IS 'Data de assinatura do contrato/proposta pelo cliente';
