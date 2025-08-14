-- Execute este SQL manualmente no Supabase Dashboard se a criação automática falhar

CREATE TABLE IF NOT EXISTS leads_jasson (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Informações básicas
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

  -- Contato
  nome_contato TEXT NOT NULL,
  cargo_contato TEXT,
  email TEXT NOT NULL,
  email_corporativo TEXT,
  telefone TEXT,

  -- Equipe e processo
  sdr TEXT NOT NULL,
  closer TEXT,
  arrematador TEXT,
  produto TEXT,
  anuncios TEXT,

  -- Status e acompanhamento
  status TEXT NOT NULL,
  observacoes TEXT,
  data_ultimo_contato DATE,
  motivo_perda_pv TEXT,
  tem_comentario_lbf BOOLEAN DEFAULT FALSE,

  -- Informações da qualificação
  investimento_trafego TEXT,
  ticket_medio TEXT,
  qtd_lojas TEXT,
  qtd_vendedores TEXT,

  -- Vendas e financeiro
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

  -- Comissões
  comissao_sdr DECIMAL(5,2),
  comissao_closer DECIMAL(5,2),
  status_comissao TEXT,

  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_jasson_status ON leads_jasson(status);
CREATE INDEX IF NOT EXISTS idx_leads_jasson_sdr ON leads_jasson(sdr);
CREATE INDEX IF NOT EXISTS idx_leads_jasson_closer ON leads_jasson(closer);
CREATE INDEX IF NOT EXISTS idx_leads_jasson_created_at ON leads_jasson(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_jasson_nome_empresa ON leads_jasson(nome_empresa);

-- Habilitar Row Level Security (RLS)
ALTER TABLE leads_jasson ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações
DROP POLICY IF EXISTS "Allow all operations on leads_jasson" ON leads_jasson;
CREATE POLICY "Allow all operations on leads_jasson" ON leads_jasson
  FOR ALL USING (true);

-- Inserir dados de exemplo (opcional)
INSERT INTO leads_jasson (
  nome_empresa, produto_marketing, nicho, valor_pago_lead, tipo_lead,
  nome_contato, email, telefone, sdr, arrematador, status
) VALUES (
  'Empresa Teste', 'Produto Teste', 'Varejo', 100.00, 'leadbroker',
  'João Silva', 'joao@teste.com', '(11) 99999-9999', 'antonio', 'alan', 'BACKLOG'
) ON CONFLICT DO NOTHING;
