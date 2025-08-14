// Lista COMPLETA de todas as 45 colunas da tabela leads

console.log("📋 === LISTA COMPLETA DAS 45 COLUNAS DA TABELA LEADS ===\n")

const allColumns = [
  // 1. IDENTIFICAÇÃO
  "id",

  // 2-13. INFORMAÇÕES BÁSICAS DA EMPRESA
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

  // 14-18. INFORMAÇÕES DE CONTATO
  "nome_contato",
  "cargo_contato",
  "email",
  "email_corporativo",
  "telefone",

  // 19-23. EQUIPE E PROCESSO
  "sdr",
  "closer",
  "arrematador",
  "produto",
  "anuncios",

  // 24-28. STATUS E ACOMPANHAMENTO
  "status",
  "observacoes",
  "data_ultimo_contato",
  "motivo_perda_pv",
  "tem_comentario_lbf",

  // 29-32. INFORMAÇÕES DA QUALIFICAÇÃO
  "investimento_trafego",
  "ticket_medio",
  "qtd_lojas",
  "qtd_vendedores",

  // 33-43. VENDAS E FINANCEIRO
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

  // 44-46. COMISSÕES
  "comissao_sdr",
  "comissao_closer",
  "status_comissao",

  // 47-48. METADADOS
  "created_at",
  "updated_at",
]

console.log("🔢 TOTAL DE COLUNAS:", allColumns.length)
console.log("\n📝 === LISTA NUMERADA ===\n")

allColumns.forEach((column, index) => {
  console.log(`${(index + 1).toString().padStart(2, "0")}. ${column}`)
})

console.log("\n📋 === LISTA PARA COPY/PASTE ===\n")

// Lista simples separada por vírgulas
console.log("COLUNAS SEPARADAS POR VÍRGULA:")
console.log(allColumns.join(", "))

console.log("\n📄 === LISTA PARA SQL SELECT ===\n")

// Para usar em SELECT
console.log("SELECT")
allColumns.forEach((column, index) => {
  const comma = index < allColumns.length - 1 ? "," : ""
  console.log(`  ${column}${comma}`)
})
console.log("FROM leads;")

console.log("\n🏷️ === LISTA COM TIPOS ===\n")

const columnsWithTypes = [
  { name: "id", type: "UUID PRIMARY KEY" },
  { name: "nome_empresa", type: "TEXT NOT NULL" },
  { name: "produto_marketing", type: "TEXT" },
  { name: "nicho", type: "TEXT NOT NULL" },
  { name: "data_hora_compra", type: "TIMESTAMP" },
  { name: "valor_pago_lead", type: "DECIMAL(10,2)" },
  { name: "tipo_lead", type: "TEXT" },
  { name: "faturamento", type: "TEXT" },
  { name: "canal", type: "TEXT" },
  { name: "nivel_urgencia", type: "TEXT" },
  { name: "regiao", type: "TEXT" },
  { name: "cidade", type: "TEXT" },
  { name: "cnpj", type: "TEXT" },
  { name: "nome_contato", type: "TEXT NOT NULL" },
  { name: "cargo_contato", type: "TEXT" },
  { name: "email", type: "TEXT NOT NULL" },
  { name: "email_corporativo", type: "TEXT" },
  { name: "telefone", type: "TEXT" },
  { name: "sdr", type: "TEXT NOT NULL" },
  { name: "closer", type: "TEXT" },
  { name: "arrematador", type: "TEXT" },
  { name: "produto", type: "TEXT" },
  { name: "anuncios", type: "TEXT" },
  { name: "status", type: "TEXT NOT NULL" },
  { name: "observacoes", type: "TEXT" },
  { name: "data_ultimo_contato", type: "DATE" },
  { name: "motivo_perda_pv", type: "TEXT" },
  { name: "tem_comentario_lbf", type: "BOOLEAN DEFAULT FALSE" },
  { name: "investimento_trafego", type: "TEXT" },
  { name: "ticket_medio", type: "TEXT" },
  { name: "qtd_lojas", type: "TEXT" },
  { name: "qtd_vendedores", type: "TEXT" },
  { name: "conseguiu_contato", type: "BOOLEAN DEFAULT FALSE" },
  { name: "reuniao_agendada", type: "BOOLEAN DEFAULT FALSE" },
  { name: "reuniao_realizada", type: "BOOLEAN DEFAULT FALSE" },
  { name: "valor_proposta", type: "DECIMAL(10,2)" },
  { name: "valor_venda", type: "DECIMAL(10,2)" },
  { name: "data_venda", type: "DATE" },
  { name: "data_fechamento", type: "DATE" },
  { name: "fee", type: "DECIMAL(10,2)" },
  { name: "escopo_fechado", type: "TEXT" },
  { name: "fee_total", type: "DECIMAL(10,2)" },
  { name: "venda_via_jasson_co", type: "BOOLEAN DEFAULT FALSE" },
  { name: "comissao_sdr", type: "DECIMAL(5,2)" },
  { name: "comissao_closer", type: "DECIMAL(5,2)" },
  { name: "status_comissao", type: "TEXT" },
  { name: "created_at", type: "TIMESTAMP DEFAULT NOW()" },
  { name: "updated_at", type: "TIMESTAMP DEFAULT NOW()" },
]

columnsWithTypes.forEach((col, index) => {
  console.log(`${(index + 1).toString().padStart(2, "0")}. ${col.name.padEnd(25)} ${col.type}`)
})

console.log("\n✅ === CAMPOS OBRIGATÓRIOS (7) ===\n")

const requiredColumns = ["id", "nome_empresa", "nicho", "nome_contato", "email", "sdr", "status"]

requiredColumns.forEach((col, index) => {
  console.log(`${index + 1}. ${col}`)
})

console.log("\n📊 === ESTATÍSTICAS ===")
console.log(`Total de colunas: ${allColumns.length}`)
console.log(`Campos obrigatórios: ${requiredColumns.length}`)
console.log(`Campos opcionais: ${allColumns.length - requiredColumns.length}`)
console.log(`Campos de texto: ${columnsWithTypes.filter((c) => c.type.includes("TEXT")).length}`)
console.log(`Campos numéricos: ${columnsWithTypes.filter((c) => c.type.includes("DECIMAL")).length}`)
console.log(`Campos booleanos: ${columnsWithTypes.filter((c) => c.type.includes("BOOLEAN")).length}`)
console.log(
  `Campos de data: ${columnsWithTypes.filter((c) => c.type.includes("DATE") || c.type.includes("TIMESTAMP")).length}`,
)
