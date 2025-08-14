// Script para listar todas as colunas da tabela leads

console.log("📋 === ESTRUTURA COMPLETA DA TABELA LEADS ===\n")

const columns = [
  // IDENTIFICAÇÃO
  { name: "id", type: "UUID", required: true, description: "Identificador único (gerado automaticamente)" },

  // INFORMAÇÕES BÁSICAS DA EMPRESA
  { name: "nome_empresa", type: "TEXT", required: true, description: "Nome da empresa do lead" },
  { name: "produto_marketing", type: "TEXT", required: false, description: "Produto de marketing que gerou o lead" },
  { name: "nicho", type: "TEXT", required: true, description: "Segmento/nicho da empresa" },
  { name: "data_hora_compra", type: "TIMESTAMP", required: false, description: "Data e hora da compra do lead" },
  { name: "valor_pago_lead", type: "DECIMAL(10,2)", required: false, description: "Valor pago pelo lead em R$" },
  { name: "tipo_lead", type: "TEXT", required: false, description: "Origem do lead (leadbroker, orgânico, etc.)" },
  { name: "faturamento", type: "TEXT", required: false, description: "Faixa de faturamento da empresa" },
  { name: "canal", type: "TEXT", required: false, description: "Canal de aquisição" },
  { name: "nivel_urgencia", type: "TEXT", required: false, description: "Nível de urgência (baixo, médio, alto)" },
  { name: "regiao", type: "TEXT", required: false, description: "Região geográfica" },
  { name: "cidade", type: "TEXT", required: false, description: "Cidade da empresa" },
  { name: "cnpj", type: "TEXT", required: false, description: "CNPJ da empresa" },

  // INFORMAÇÕES DE CONTATO
  { name: "nome_contato", type: "TEXT", required: true, description: "Nome da pessoa de contato" },
  { name: "cargo_contato", type: "TEXT", required: false, description: "Cargo da pessoa de contato" },
  { name: "email", type: "TEXT", required: true, description: "Email principal" },
  { name: "email_corporativo", type: "TEXT", required: false, description: "Email corporativo" },
  { name: "telefone", type: "TEXT", required: false, description: "Telefone de contato" },

  // EQUIPE E PROCESSO
  { name: "sdr", type: "TEXT", required: true, description: "SDR responsável" },
  { name: "closer", type: "TEXT", required: false, description: "Closer responsável" },
  { name: "arrematador", type: "TEXT", required: false, description: "Arrematador responsável" },
  { name: "produto", type: "TEXT", required: false, description: "Produto oferecido" },
  { name: "anuncios", type: "TEXT", required: false, description: "Se faz anúncios (sim/não)" },

  // STATUS E ACOMPANHAMENTO
  { name: "status", type: "TEXT", required: true, description: "Status atual do lead" },
  { name: "observacoes", type: "TEXT", required: false, description: "Observações gerais" },
  { name: "data_ultimo_contato", type: "DATE", required: false, description: "Data do último contato" },
  { name: "motivo_perda_pv", type: "TEXT", required: false, description: "Motivo de perda do lead" },
  { name: "tem_comentario_lbf", type: "BOOLEAN", required: false, description: "Se tem comentário no LeadBroker" },

  // INFORMAÇÕES DA QUALIFICAÇÃO
  { name: "investimento_trafego", type: "TEXT", required: false, description: "Investimento em tráfego" },
  { name: "ticket_medio", type: "TEXT", required: false, description: "Ticket médio da empresa" },
  { name: "qtd_lojas", type: "TEXT", required: false, description: "Quantidade de lojas" },
  { name: "qtd_vendedores", type: "TEXT", required: false, description: "Quantidade de vendedores" },

  // VENDAS E FINANCEIRO
  { name: "conseguiu_contato", type: "BOOLEAN", required: false, description: "Se conseguiu fazer contato" },
  { name: "reuniao_agendada", type: "BOOLEAN", required: false, description: "Se reunião foi agendada" },
  { name: "reuniao_realizada", type: "BOOLEAN", required: false, description: "Se reunião foi realizada" },
  { name: "valor_proposta", type: "DECIMAL(10,2)", required: false, description: "Valor da proposta em R$" },
  { name: "valor_venda", type: "DECIMAL(10,2)", required: false, description: "Valor da venda em R$" },
  { name: "data_venda", type: "DATE", required: false, description: "Data da venda" },
  { name: "data_fechamento", type: "DATE", required: false, description: "Data de fechamento" },
  { name: "fee", type: "DECIMAL(10,2)", required: false, description: "Fee em R$" },
  { name: "escopo_fechado", type: "TEXT", required: false, description: "Escopo do projeto fechado" },
  { name: "fee_total", type: "DECIMAL(10,2)", required: false, description: "Fee total em R$" },
  { name: "venda_via_jasson_co", type: "BOOLEAN", required: false, description: "Se venda foi via Jasson&Co" },

  // COMISSÕES
  { name: "comissao_sdr", type: "DECIMAL(5,2)", required: false, description: "Percentual de comissão do SDR" },
  { name: "comissao_closer", type: "DECIMAL(5,2)", required: false, description: "Percentual de comissão do Closer" },
  { name: "status_comissao", type: "TEXT", required: false, description: "Status da comissão (pago, pendente, etc.)" },

  // METADADOS
  { name: "created_at", type: "TIMESTAMP", required: false, description: "Data de criação (automática)" },
  { name: "updated_at", type: "TIMESTAMP", required: false, description: "Data de atualização (automática)" },
]

console.log("🔢 TOTAL DE COLUNAS:", columns.length)
console.log("\n📊 === DETALHAMENTO POR CATEGORIA ===\n")

// Agrupar por categoria
const categories = {
  "🆔 IDENTIFICAÇÃO": columns.filter((col) => col.name === "id"),
  "🏢 INFORMAÇÕES BÁSICAS": columns.filter((col) =>
    [
      "nome_empresa",
      "produto_marketing",
      "nicho",
      "data_hora_compra",
      "valor_pago_lead",
      "tipo_lead",
      "faturamento",
      "canal",
      "nivel_urgencia",
      "regiao",
      "cidade",
      "cnpj",
    ].includes(col.name),
  ),
  "👤 CONTATO": columns.filter((col) =>
    ["nome_contato", "cargo_contato", "email", "email_corporativo", "telefone"].includes(col.name),
  ),
  "👥 EQUIPE": columns.filter((col) => ["sdr", "closer", "arrematador", "produto", "anuncios"].includes(col.name)),
  "📈 STATUS": columns.filter((col) =>
    ["status", "observacoes", "data_ultimo_contato", "motivo_perda_pv", "tem_comentario_lbf"].includes(col.name),
  ),
  "🎯 QUALIFICAÇÃO": columns.filter((col) =>
    ["investimento_trafego", "ticket_medio", "qtd_lojas", "qtd_vendedores"].includes(col.name),
  ),
  "💰 VENDAS": columns.filter((col) =>
    [
      "conseguiu_contato",
      "reuniao_agendada",
      "reuniao_realizada",
      "valor_proposta",
      "valor_venda",
      "data_venda",
      "data_fechamento",
      "fee",
      "escopo_fechado",
      "fee_total",
      "venda_via_jasson_co",
    ].includes(col.name),
  ),
  "💵 COMISSÕES": columns.filter((col) => ["comissao_sdr", "comissao_closer", "status_comissao"].includes(col.name)),
  "🕒 METADADOS": columns.filter((col) => ["created_at", "updated_at"].includes(col.name)),
}

Object.entries(categories).forEach(([category, cols]) => {
  console.log(`${category} (${cols.length} colunas):`)
  cols.forEach((col) => {
    const required = col.required ? "* OBRIGATÓRIO" : "  opcional"
    console.log(`  • ${col.name} (${col.type}) ${required}`)
    console.log(`    ${col.description}`)
  })
  console.log("")
})

console.log("📋 === CAMPOS OBRIGATÓRIOS ===")
const requiredFields = columns.filter((col) => col.required)
requiredFields.forEach((col) => {
  console.log(`✅ ${col.name} (${col.type}) - ${col.description}`)
})

console.log(`\n🎯 Total de campos obrigatórios: ${requiredFields.length}`)
console.log(`📊 Total de campos opcionais: ${columns.length - requiredFields.length}`)
