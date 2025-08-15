-- Criar tabela leads manualmente com todas as colunas necessárias
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_empresa TEXT NOT NULL,
    produto_marketing TEXT,
    nicho TEXT,
    data_hora_compra TIMESTAMPTZ,
    valor_pago_lead DECIMAL(10,2),
    tipo_lead TEXT,
    faturamento TEXT,
    canal TEXT,
    nivel_urgencia TEXT,
    regiao TEXT,
    cidade TEXT,
    cnpj TEXT,
    nome_contato TEXT NOT NULL,
    cargo_contato TEXT,
    email TEXT NOT NULL,
    email_corporativo TEXT,
    telefone TEXT,
    sdr TEXT,
    closer TEXT,
    arrematador TEXT,
    produto TEXT,
    anuncios TEXT,
    status TEXT DEFAULT 'BACKLOG',
    observacoes TEXT,
    observacoes_closer TEXT,
    data_ultimo_contato DATE,
    motivo_perda_pv TEXT,
    tem_comentario_lbf BOOLEAN DEFAULT FALSE,
    investimento_trafego TEXT,
    ticket_medio TEXT,
    qtd_lojas TEXT,
    qtd_vendedores TEXT,
    conseguiu_contato BOOLEAN DEFAULT FALSE,
    reuniao_agendada BOOLEAN DEFAULT FALSE,
    reuniao_realizada BOOLEAN DEFAULT FALSE,
    valor_proposta DECIMAL(10,2),
    valor_venda DECIMAL(10,2),
    data_venda DATE,
    data_fechamento DATE,
    fee DECIMAL(10,2),
    escopo_fechado TEXT,
    fee_total DECIMAL(10,2),
    venda_via_jasson_co BOOLEAN DEFAULT FALSE,
    comissao_sdr DECIMAL(10,2),
    comissao_closer DECIMAL(10,2),
    status_comissao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_sdr ON leads(sdr);
CREATE INDEX IF NOT EXISTS idx_leads_closer ON leads(closer);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Verificar se a tabela foi criada
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;
