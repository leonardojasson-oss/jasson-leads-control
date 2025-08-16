-- Adicionando coluna data_assinatura na tabela leads (plural)
ALTER TABLE leads ADD COLUMN data_assinatura DATE;

-- Comentário sobre a nova coluna
COMMENT ON COLUMN leads.data_assinatura IS 'Data de assinatura do contrato - quando preenchida indica venda realizada';
