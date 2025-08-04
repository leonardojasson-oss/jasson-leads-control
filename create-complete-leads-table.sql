-- TABELA LEADS COMPLETA COM TODAS AS 48 COLUNAS

CREATE TABLE IF NOT EXISTS leads (
  -- 01. IDENTIFICAÇÃO
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 02-13. INFORMAÇÕES BÁSICAS DA EMPRESA
  nome_empresa TEXT NOT NULL,
  produto_marketing TEXT,
  nicho TEXT NOT NULL,
  data_hora_compra TIMESTAMP,
  valor_pago_lead DECIMAL(10,2),
  tipo_lead TEXT,
  faturamento TEXT,
  canal TEXT,
  nivel_urgencia TEXT,
  regiao TEXT,
  cidade TEXT,
  cnpj TEXT,

  -- 14-18. INFORMAÇÕES DE CONTATO
  nome_contato TEXT NOT NULL,
  cargo_contato TEXT,
  email TEXT NOT NULL,
  email_corporativo TEXT,
  telefone TEXT,

  -- 19-23. EQUIPE E PROCESSO
  sdr TEXT NOT NULL,
  closer TEXT,
  arrematador TEXT,
  produto TEXT,
  anuncios TEXT,

  -- 24-28. STATUS E ACOMPANHAMENTO
  status TEXT NOT NULL,
  observacoes TEXT,
  data_ultimo_contato DATE,
  motivo_perda_pv TEXT,
  tem_comentario_lbf BOOLEAN DEFAULT FALSE,

  -- 29-32. INFORMAÇÕES DA QUALIFICAÇÃO
  investimento_trafego TEXT,
  ticket_medio TEXT,
  qtd_lojas TEXT,
  qtd_vendedores TEXT,

  -- 33-43. VENDAS E FINANCEIRO
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

  -- 44-46. COMISSÕES
  comissao_sdr DECIMAL(5,2),
  comissao_closer DECIMAL(5,2),
  status_comissao TEXT,

  -- 47-48. METADADOS
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_sdr ON leads(sdr);
CREATE INDEX IF NOT EXISTS idx_leads_closer ON leads(closer);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_nome_empresa ON leads(nome_empresa);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- SEGURANÇA
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true);

-- COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE leads IS 'Tabela principal de leads do sistema Jasson Oliveira & Co';
COMMENT ON COLUMN leads.id IS 'Identificador único UUID';
COMMENT ON COLUMN leads.nome_empresa IS 'Nome da empresa do lead (obrigatório)';
COMMENT ON COLUMN leads.nicho IS 'Segmento/nicho da empresa (obrigatório)';
COMMENT ON COLUMN leads.nome_contato IS 'Nome da pessoa de contato (obrigatório)';
COMMENT ON COLUMN leads.email IS 'Email principal (obrigatório)';
COMMENT ON COLUMN leads.sdr IS 'SDR responsável pelo lead (obrigatório)';
COMMENT ON COLUMN leads.status IS 'Status atual do lead (obrigatório)';
