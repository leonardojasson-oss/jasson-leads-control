-- Estrutura completa da tabela leads
-- Execute este SQL no Supabase para criar a tabela com todas as colunas

CREATE TABLE IF NOT EXISTS leads (
  -- IDENTIFICAÇÃO
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- INFORMAÇÕES BÁSICAS DA EMPRESA
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

  -- INFORMAÇÕES DE CONTATO
  nome_contato TEXT NOT NULL,
  cargo_contato TEXT,
  email TEXT NOT NULL,
  email_corporativo TEXT,
  telefone TEXT,

  -- EQUIPE E PROCESSO
  sdr TEXT NOT NULL,
  closer TEXT,
  arrematador TEXT,
  produto TEXT,
  anuncios TEXT,

  -- STATUS E ACOMPANHAMENTO
  status TEXT NOT NULL,
  observacoes TEXT,
  data_ultimo_contato DATE,
  motivo_perda_pv TEXT,
  tem_comentario_lbf BOOLEAN DEFAULT FALSE,

  -- INFORMAÇÕES DA QUALIFICAÇÃO
  investimento_trafego TEXT,
  ticket_medio TEXT,
  qtd_lojas TEXT,
  qtd_vendedores TEXT,

  -- VENDAS E FINANCEIRO
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

  -- COMISSÕES
  comissao_sdr DECIMAL(5,2),
  comissao_closer DECIMAL(5,2),
  status_comissao TEXT,

  -- METADADOS
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_sdr ON leads(sdr);
CREATE INDEX IF NOT EXISTS idx_leads_closer ON leads(closer);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_nome_empresa ON leads(nome_empresa);

-- SEGURANÇA
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true);
