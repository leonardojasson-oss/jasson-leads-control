-- Verificar a estrutura atual da tabela leads
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar especificamente se a coluna data_assinatura existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'data_assinatura'
    AND table_schema = 'public'
) as data_assinatura_exists;
