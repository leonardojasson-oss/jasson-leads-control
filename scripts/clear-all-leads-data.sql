-- scripts/clear-all-leads-data.sql

-- ATENÇÃO: Este script irá APAGAR PERMANENTEMENTE TODOS OS DADOS DE LEADS
-- E SEUS REGISTROS RELACIONADOS das tabelas abaixo.
-- Esta ação é IRREVERSÍVEL. Faça um backup se necessário.

-- 1. Apagar registros das tabelas de associação primeiro (dependem da tabela 'lead')
-- TRUNCATE TABLE é mais rápido e reseta sequências, mas DELETE também funciona.
-- Usaremos DELETE para respeitar as políticas de RLS se houverem, embora TRUNCATE seja mais "limpo" para um reset total.

DELETE FROM vendedor_lead;
DELETE FROM lead_produto;
DELETE FROM comentario;

-- 2. Apagar os leads da tabela principal 'lead'
DELETE FROM lead;

-- 3. Apagar os contatos que não estão mais referenciados por nenhum lead
-- Isso garante que contatos órfãos sejam removidos.
DELETE FROM contato
WHERE id NOT IN (SELECT id_contato FROM lead WHERE id_contato IS NOT NULL);

-- Opcional: Se você quiser resetar completamente as tabelas de lookup também,
-- e re-inserir os dados de seed, você pode descomentar as linhas abaixo.
-- Isso é útil se você suspeita que as tabelas de lookup também foram corrompidas.
-- Se você já executou 'seed-normalized-data.sql' e tem certeza que as lookups estão ok,
-- não precisa executar esta parte.

-- DELETE FROM status;
-- DELETE FROM segmento;
-- DELETE FROM origem;
-- DELETE FROM canal;
-- DELETE FROM urgencia;
-- DELETE FROM faturamento;
-- DELETE FROM cargo_contato;
-- DELETE FROM produto;
-- DELETE FROM cidade;
-- DELETE FROM regiao;
-- DELETE FROM vendedor;
-- DELETE FROM papel;

-- Lembre-se de re-executar 'scripts/seed-normalized-data.sql'
-- se você apagou as tabelas de lookup ou se elas não estavam populadas corretamente.
