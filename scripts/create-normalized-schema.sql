-- scripts/create-normalized-schema.sql

-- Drop existing tables if they exist to ensure a clean slate for the new schema
-- BE CAREFUL WITH THIS IN PRODUCTION ENVIRONMENTS!
-- This will delete all data in these tables.
DROP TABLE IF EXISTS vendedor_lead CASCADE;
DROP TABLE IF EXISTS lead_produto CASCADE;
DROP TABLE IF EXISTS comentario CASCADE;
DROP TABLE IF EXISTS lead CASCADE;
DROP TABLE IF EXISTS contato CASCADE;

-- Drop lookup tables
DROP TABLE IF EXISTS status CASCADE;
DROP TABLE IF EXISTS segmento CASCADE;
DROP TABLE IF EXISTS origem CASCADE;
DROP TABLE IF EXISTS canal CASCADE;
DROP TABLE IF EXISTS urgencia CASCADE;
DROP TABLE IF EXISTS faturamento CASCADE;
DROP TABLE IF EXISTS cargo_contato CASCADE;
DROP TABLE IF EXISTS produto CASCADE;
DROP TABLE IF EXISTS cidade CASCADE;
DROP TABLE IF EXISTS regiao CASCADE;
DROP TABLE IF EXISTS vendedor CASCADE;
DROP TABLE IF EXISTS papel CASCADE;

-- Create Lookup Tables First (order matters for foreign keys)
CREATE TABLE IF NOT EXISTS status (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS segmento (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS origem (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS canal (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS urgencia (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS faturamento (
    id SERIAL PRIMARY KEY,
    valor TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS cargo_contato (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS produto (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS regiao (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS cidade (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL,
    id_regiao INTEGER REFERENCES regiao(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS vendedor (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS papel (
    id SERIAL PRIMARY KEY,
    nome TEXT UNIQUE NOT NULL
);

-- Create Core Tables
CREATE TABLE IF NOT EXISTS contato (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    id_cargo_contato INTEGER REFERENCES cargo_contato(id) ON DELETE SET NULL,
    email_comporativo BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS lead (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- Using UUID for main lead ID
    razao_social TEXT NOT NULL,
    nome_fantazia TEXT,
    id_contato INTEGER REFERENCES contato(id) ON DELETE CASCADE, -- If contact is deleted, lead is deleted
    id_segmento INTEGER REFERENCES segmento(id) ON DELETE SET NULL,
    data_compra DATE,
    horario_compra TIME,
    valor DECIMAL(10,2),
    venda BOOLEAN DEFAULT FALSE,
    id_origem INTEGER REFERENCES origem(id) ON DELETE SET NULL,
    id_faturamento INTEGER REFERENCES faturamento(id) ON DELETE SET NULL,
    id_canal INTEGER REFERENCES canal(id) ON DELETE SET NULL,
    id_urgencia INTEGER REFERENCES urgencia(id) ON DELETE SET NULL,
    id_cidade INTEGER REFERENCES cidade(id) ON DELETE SET NULL,
    is_anuncio BOOLEAN DEFAULT FALSE,
    id_status INTEGER REFERENCES status(id) ON DELETE SET NULL,
    data_ultimo_contato DATE,
    cs BOOLEAN DEFAULT FALSE, -- Conseguiu Contato
    rm BOOLEAN DEFAULT FALSE, -- Reunião Marcada
    rr BOOLEAN DEFAULT FALSE, -- Reunião Realizada
    ns BOOLEAN DEFAULT FALSE, -- No-Show
    data_marcacao DATE,
    data_reuniao DATE,
    data_assinatura DATE,
    fee DECIMAL(10,2),
    escopo_fechado DECIMAL(10,2),
    fee_total DECIMAL(10,2),
    observacoes_closer TEXT, -- Nova coluna para observações do closer
    motivo_perda TEXT,      -- Nova coluna para motivo de perda
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comentario (
    id SERIAL PRIMARY KEY,
    comentario TEXT,
    id_cliente UUID REFERENCES lead(id) ON DELETE CASCADE UNIQUE -- ADICIONADO UNIQUE AQUI
);

-- Junction Tables
CREATE TABLE IF NOT EXISTS vendedor_lead (
    id_lead UUID REFERENCES lead(id) ON DELETE CASCADE,
    id_vendedor INTEGER REFERENCES vendedor(id) ON DELETE CASCADE,
    id_papel INTEGER REFERENCES papel(id) ON DELETE CASCADE,
    PRIMARY KEY (id_lead, id_vendedor, id_papel)
);

CREATE TABLE IF NOT EXISTS lead_produto (
    id_lead UUID REFERENCES lead(id) ON DELETE CASCADE,
    id_produto INTEGER REFERENCES produto(id) ON DELETE CASCADE,
    PRIMARY KEY (id_lead, id_produto)
);

-- Enable Row Level Security (RLS) for all new tables
ALTER TABLE status ENABLE ROW LEVEL SECURITY;
ALTER TABLE segmento ENABLE ROW LEVEL SECURITY;
ALTER TABLE origem ENABLE ROW LEVEL SECURITY;
ALTER TABLE canal ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargo_contato ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE regiao ENABLE ROW LEVEL SECURITY;
ALTER TABLE cidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE papel ENABLE ROW LEVEL SECURITY;
ALTER TABLE contato ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentario ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedor_lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_produto ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (you can restrict later)
CREATE POLICY "Allow all on status" ON status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on segmento" ON segmento FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on origem" ON origem FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on canal" ON canal FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on urgencia" ON urgencia FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on faturamento" ON faturamento FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cargo_contato" ON cargo_contato FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on produto" ON produto FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on regiao" ON regiao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cidade" ON cidade FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vendedor" ON vendedor FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on papel" ON papel FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on contato" ON contato FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on lead" ON lead FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on comentario" ON comentario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vendedor_lead" ON vendedor_lead FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on lead_produto" ON lead_produto FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance on core tables
CREATE INDEX IF NOT EXISTS idx_lead_status ON lead(id_status);
CREATE INDEX IF NOT EXISTS idx_vendedor_lead_papel_vendedor ON vendedor_lead(id_papel, id_vendedor);
CREATE INDEX IF NOT EXISTS idx_lead_created_at ON lead(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_razao_social ON lead(razao_social);
CREATE INDEX IF NOT EXISTS idx_contato_email ON contato(email);
