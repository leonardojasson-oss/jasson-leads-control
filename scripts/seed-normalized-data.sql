-- scripts/seed-normalized-data.sql

-- Seed 'status' table
INSERT INTO status (nome) VALUES
('BACKLOG'), ('TENTANDO CONTATO'), ('REUNIAO AGENDADA'), ('REUNIAO REALIZADA'),
('PROPOSTA ENVIADA'), ('NEGOCIACAO'), ('CONTRATO ASSINADO'), ('GANHO'),
('DROPADO'), ('FOLLOW INFINITO'), ('QUALIFICANDO'), ('NO-SHOW')
ON CONFLICT (nome) DO NOTHING;

-- Seed 'segmento' table (nicho)
INSERT INTO segmento (nome) VALUES
('Serviço'), ('Varejo'), ('Indústria'), ('Assessoria'), ('Turismo'), ('E-commerce'), ('Outro')
ON CONFLICT (nome) DO NOTHING;

-- Seed 'origem' table
INSERT INTO origem (nome) VALUES
('LeadBroker'), ('Orgânico'), ('Indicação'), ('Outro')
ON CONFLICT (nome) DO NOTHING;

-- Seed 'canal' table
INSERT INTO canal (nome) VALUES
('Google Ads'), ('Facebook Ads'), ('Instagram Ads'), ('LinkedIn'),
('Email Marketing'), ('Telefone'), ('Outro')
ON CONFLICT (nome) DO NOTHING;

-- Seed 'urgencia' table
INSERT INTO urgencia (nome) VALUES
('Baixa'), ('Média'), ('Alta'), ('Crítica')
ON CONFLICT (nome) DO NOTHING;

-- Seed 'faturamento' table
INSERT INTO faturamento (valor) VALUES
('50 a 70 mil'), ('70 a 100 mil'), ('100 a 200 mil'), ('200 a 400 mil'),
('400 a 1 milhão'), ('1 a 4 milhões'), ('4 a 16 milhões'), ('16 a 40 milhões'),
('+40 milhões'), ('-100k')
ON CONFLICT (valor) DO NOTHING;

-- Seed 'cargo_contato' table
INSERT INTO cargo_contato (nome) VALUES
('CEO'), ('Diretor'), ('Gerente'), ('Coordenador'), ('Analista'), ('Proprietário'), ('Outro')
ON CONFLICT (nome) DO NOTHING;

-- Seed 'produto' table
INSERT INTO produto (nome) VALUES
('Produto Teste'), ('Serviço A'), ('Serviço B'), ('Consultoria'), ('Software'), ('Produto Importado')
ON CONFLICT (nome) DO NOTHING;

-- Seed 'regiao' table
INSERT INTO regiao (nome) VALUES
('Sudeste'), ('Sul'), ('Nordeste'), ('Norte'), ('Centro-Oeste')
ON CONFLICT (nome) DO NOTHING;

-- Seed 'cidade' table (requires regiao IDs)
INSERT INTO cidade (nome, id_regiao) VALUES
('São Paulo', (SELECT id FROM regiao WHERE nome = 'Sudeste')),
('Rio de Janeiro', (SELECT id FROM regiao WHERE nome = 'Sudeste')),
('Porto Alegre', (SELECT id FROM regiao WHERE nome = 'Sul')),
('Curitiba', (SELECT id FROM regiao WHERE nome = 'Sul')),
('Salvador', (SELECT id FROM regiao WHERE nome = 'Nordeste')),
('Belo Horizonte', (SELECT id FROM regiao WHERE nome = 'Sudeste'))
ON CONFLICT (nome) DO NOTHING;

-- Seed 'vendedor' table (SDRs, Closers, Arrematadores)
INSERT INTO vendedor (nome) VALUES
('antonio'), ('gabrielli'), ('vanessa'), ('leonardo'), ('jasson'), ('alan'), ('william')
ON CONFLICT (nome) DO NOTHING;

-- Seed 'papel' table
INSERT INTO papel (nome) VALUES
('SDR'), ('Closer'), ('Arrematador')
ON CONFLICT (nome) DO NOTHING;

-- Insert example data into core tables (after lookups are seeded)

-- Example Contatos
INSERT INTO contato (nome, email, id_cargo_contato, email_comporativo) VALUES
('João Silva', 'joao.silva@exemplo.com', (SELECT id FROM cargo_contato WHERE nome = 'Gerente'), TRUE),
('Maria Souza', 'maria.souza@outra.com', (SELECT id FROM cargo_contato WHERE nome = 'Proprietário'), TRUE),
('Pedro Costa', 'pedro.costa@teste.com', (SELECT id FROM cargo_contato WHERE nome = 'Analista'), FALSE)
ON CONFLICT (email) DO NOTHING;

-- Example Leads (using UUID for id)
-- REMOVIDO ON CONFLICT (razao_social) DO NOTHING;
INSERT INTO lead (
    razao_social, nome_fantazia, id_contato, id_segmento, data_compra, horario_compra, valor, venda,
    id_origem, id_faturamento, id_canal, id_urgencia, id_cidade, is_anuncio, id_status,
    data_ultimo_contato, cs, rm, rr, ns, data_marcacao, data_reuniao, data_assinatura,
    fee, escopo_fechado, fee_total, observacoes_closer, motivo_perda
) VALUES
(
    'Empresa Alpha', 'Alpha Solutions', (SELECT id FROM contato WHERE email = 'joao.silva@exemplo.com'),
    (SELECT id FROM segmento WHERE nome = 'Serviço'), '2023-01-15', '10:30:00', 15000.00, TRUE,
    (SELECT id FROM origem WHERE nome = 'LeadBroker'), (SELECT id FROM faturamento WHERE valor = '100 a 200 mil'),
    (SELECT id FROM canal WHERE nome = 'Google Ads'), (SELECT id FROM urgencia WHERE nome = 'Alta'),
    (SELECT id FROM cidade WHERE nome = 'São Paulo'), TRUE, (SELECT id FROM status WHERE nome = 'GANHO'),
    '2023-01-10', TRUE, TRUE, TRUE, FALSE, '2023-01-05', '2023-01-08', '2023-01-15',
    1500.00, 0.00, 1500.00, 'Observação do closer para Alpha.', NULL
),
(
    'Empresa Beta', 'Beta Corp', (SELECT id FROM contato WHERE email = 'maria.souza@outra.com'),
    (SELECT id FROM segmento WHERE nome = 'Varejo'), '2023-02-20', '14:00:00', 0.00, FALSE,
    (SELECT id FROM origem WHERE nome = 'Orgânico'), (SELECT id FROM faturamento WHERE valor = '50 a 70 mil'),
    (SELECT id FROM canal WHERE nome = 'Facebook Ads'), (SELECT id FROM urgencia WHERE nome = 'Média'),
    (SELECT id FROM cidade WHERE nome = 'Rio de Janeiro'), FALSE, (SELECT id FROM status WHERE nome = 'TENTANDO CONTATO'),
    '2023-02-18', FALSE, FALSE, FALSE, FALSE, NULL, NULL, NULL,
    0.00, 0.00, 0.00, NULL, NULL
),
(
    'Empresa Gamma', 'Gamma Inc.', (SELECT id FROM contato WHERE email = 'pedro.costa@teste.com'),
    (SELECT id FROM segmento WHERE nome = 'Indústria'), '2023-03-01', '09:00:00', 0.00, FALSE,
    (SELECT id FROM origem WHERE nome = 'LeadBroker'), (SELECT id FROM faturamento WHERE valor = '400 a 1 milhão'),
    (SELECT id FROM canal WHERE nome = 'LinkedIn'), (SELECT id FROM urgencia WHERE nome = 'Alta'),
    (SELECT id FROM cidade WHERE nome = 'Curitiba'), TRUE,
    (SELECT id FROM status WHERE nome = 'REUNIAO AGENDADA'),
    '2023-02-25', TRUE, TRUE, FALSE, FALSE, '2023-02-28', '2023-03-05', NULL,
    0.00, 0.00, 0.00, NULL, 'Preço muito alto'
);

-- Link Vendedores to Leads (using lead IDs from previous inserts)
INSERT INTO vendedor_lead (id_lead, id_vendedor, id_papel) VALUES
((SELECT id FROM lead WHERE razao_social = 'Empresa Alpha'), (SELECT id FROM vendedor WHERE nome = 'antonio'), (SELECT id FROM papel WHERE nome = 'SDR')),
((SELECT id FROM lead WHERE razao_social = 'Empresa Alpha'), (SELECT id FROM vendedor WHERE nome = 'jasson'), (SELECT id FROM papel WHERE nome = 'Closer')),
((SELECT id FROM lead WHERE razao_social = 'Empresa Alpha'), (SELECT id FROM vendedor WHERE nome = 'alan'), (SELECT id FROM papel WHERE nome = 'Arrematador')),

((SELECT id FROM lead WHERE razao_social = 'Empresa Beta'), (SELECT id FROM vendedor WHERE nome = 'gabrielli'), (SELECT id FROM papel WHERE nome = 'SDR')),
((SELECT id FROM lead WHERE razao_social = 'Empresa Beta'), (SELECT id FROM vendedor WHERE nome = 'leonardo'), (SELECT id FROM papel WHERE nome = 'Closer')),

((SELECT id FROM lead WHERE razao_social = 'Empresa Gamma'), (SELECT id FROM vendedor WHERE nome = 'vanessa'), (SELECT id FROM papel WHERE nome = 'SDR')),
((SELECT id FROM lead WHERE razao_social = 'Empresa Gamma'), (SELECT id FROM vendedor WHERE nome = 'jasson'), (SELECT id FROM papel WHERE nome = 'Closer'))
ON CONFLICT (id_lead, id_vendedor, id_papel) DO NOTHING;

-- Link Products to Leads
INSERT INTO lead_produto (id_lead, id_produto) VALUES
((SELECT id FROM lead WHERE razao_social = 'Empresa Alpha'), (SELECT id FROM produto WHERE nome = 'Serviço A')),
((SELECT id FROM lead WHERE razao_social = 'Empresa Beta'), (SELECT id FROM produto WHERE nome = 'Produto Teste')),
((SELECT id FROM lead WHERE razao_social = 'Empresa Gamma'), (SELECT id FROM produto WHERE nome = 'Consultoria'))
ON CONFLICT (id_lead, id_produto) DO NOTHING;

-- Add Comments to Leads
INSERT INTO comentario (comentario, id_cliente) VALUES
('Lead muito promissor, alta chance de fechamento.', (SELECT id FROM lead WHERE razao_social = 'Empresa Alpha')),
('Cliente com pouca urgência, precisa de mais nutrição.', (SELECT id FROM lead WHERE razao_social = 'Empresa Beta'))
ON CONFLICT (id_cliente) DO NOTHING;
