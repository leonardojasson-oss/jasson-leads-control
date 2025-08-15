-- Mostrar estrutura completa da tabela leads
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;

-- Contar registros na tabela
SELECT COUNT(*) as total_leads FROM leads;

-- Mostrar alguns registros de exemplo
SELECT 
    id,
    nome_empresa,
    status,
    sdr,
    observacoes,
    observacoes_closer,
    created_at
FROM leads 
ORDER BY created_at DESC 
LIMIT 5;
