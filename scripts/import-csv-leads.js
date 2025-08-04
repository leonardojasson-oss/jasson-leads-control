// Script para importar leads do CSV para o sistema

async function importCsvLeads() {
  console.log("🔄 === INICIANDO IMPORTAÇÃO DE LEADS DO CSV ===")

  try {
    // 1. Buscar o arquivo CSV
    console.log("📥 Baixando arquivo CSV...")
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leadbroker%20jasson%20-%20Pa%CC%81gina1-ImqX7957BpVPGXQZnM3XOH2skC3e0u.csv",
    )
    const csvText = await response.text()
    console.log("✅ Arquivo baixado com sucesso!")

    // 2. Processar CSV
    const lines = csvText.split("\n").filter((line) => line.trim() !== "")
    const headers = lines[0].split(",").map((header) => header.trim().replace(/"/g, ""))

    console.log(`📊 Encontradas ${lines.length - 1} linhas de dados`)
    console.log(`📋 Cabeçalhos: ${headers.length} colunas`)

    // 3. Mapear dados
    const leads = []
    let successCount = 0
    let errorCount = 0

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCsvLine(lines[i])
        const leadData = mapCsvToLead(headers, values)

        if (leadData) {
          leads.push(leadData)
          successCount++
        }
      } catch (error) {
        console.error(`❌ Erro na linha ${i + 1}:`, error.message)
        errorCount++
      }
    }

    console.log(`✅ ${successCount} leads processados com sucesso`)
    console.log(`❌ ${errorCount} leads com erro`)

    // 4. Salvar no localStorage (simulando o sistema)
    if (typeof window !== "undefined") {
      const existingLeads = JSON.parse(localStorage.getItem("jasson-leads-data-v2") || "[]")
      const allLeads = [...leads, ...existingLeads]
      localStorage.setItem("jasson-leads-data-v2", JSON.stringify(allLeads))
      console.log(`💾 ${leads.length} leads salvos no localStorage`)
    }

    // 5. Mostrar resumo
    console.log("\n📈 === RESUMO DA IMPORTAÇÃO ===")
    console.log(`Total processado: ${successCount}`)
    console.log(`Com erro: ${errorCount}`)
    console.log(`Taxa de sucesso: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`)

    // 6. Mostrar alguns exemplos
    console.log("\n📋 === EXEMPLOS DE LEADS IMPORTADOS ===")
    leads.slice(0, 3).forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.nome_empresa}`)
      console.log(`   Status: ${lead.status}`)
      console.log(`   SDR: ${lead.sdr}`)
      console.log(`   Valor: R$ ${lead.valor_pago_lead}`)
      console.log(`   Email: ${lead.email}`)
    })

    return leads
  } catch (error) {
    console.error("❌ Erro geral na importação:", error)
    return []
  }
}

// Função para processar linha CSV respeitando aspas
function parseCsvLine(line) {
  const values = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      values.push(current.trim().replace(/"/g, ""))
      current = ""
    } else {
      current += char
    }
  }
  values.push(current.trim().replace(/"/g, ""))
  return values
}

// Função para mapear CSV para formato do sistema
function mapCsvToLead(headers, values) {
  const getField = (fieldName) => {
    const index = headers.findIndex((h) => h.toUpperCase().includes(fieldName.toUpperCase()))
    return index !== -1 ? values[index] || "" : ""
  }

  const getValue = (fieldName) => {
    const value = getField(fieldName)
    return value === "-" || value === "" ? null : value
  }

  // Extrair nome da empresa do campo LEAD
  const leadField = getValue("LEAD")
  const nomeEmpresa = leadField ? leadField.split(" ")[0] || leadField : "Empresa Importada"

  // Mapear status
  const statusMap = {
    DESQUALIFICADO: "DROPADO",
    "CONTRATO ASSINADO": "GANHO",
    "TENTANDO CONTATO": "TENTANDO CONTATO",
    QUALIFICANDO: "QUALIFICANDO",
    "REUNIÃO AGENDADA": "REUNIÃO AGENDADA",
    "REUNIÃO REALIZADA": "REUNIÃO REALIZADA",
    DROPADO: "DROPADO",
    "FOLLOW UP": "FOLLOW UP",
    "NO-SHOW": "NO-SHOW",
    BACKLOG: "BACKLOG",
  }

  const originalStatus = getValue("STATUS")
  const status = statusMap[originalStatus] || originalStatus || "BACKLOG"

  // Mapear SDR
  const sdrMap = {
    ANTÔNIO: "antonio",
    ANTONIO: "antonio",
    GABRIELLI: "gabrielli",
    VANESSA: "vanessa",
  }

  const originalSdr = getValue("SDR")
  const sdr = sdrMap[originalSdr?.toUpperCase()] || originalSdr?.toLowerCase() || "antonio"

  // Mapear Closer
  const closerMap = {
    LEONARDO: "leonardo",
    JASSON: "jasson",
    ANTÔNIO: "antonio",
    ANTONIO: "antonio",
    GABRIELLI: "gabrielli",
    VANESSA: "vanessa",
  }

  const originalCloser = getValue("CLOSER")
  const closer = originalCloser ? closerMap[originalCloser.toUpperCase()] || originalCloser.toLowerCase() : null

  // Mapear Arrematador
  const arrematadorMap = {
    ALAN: "alan",
    ANTÔNIO: "antonio",
    ANTONIO: "antonio",
    GABRIELLI: "gabrielli",
    JASSON: "jasson",
    VANESSA: "vanessa",
    WILLIAM: "william",
  }

  const originalArrematador = getValue("ARREMATANTE")
  const arrematador = arrematadorMap[originalArrematador?.toUpperCase()] || originalArrematador?.toLowerCase() || "alan"

  // Mapear segmento para nicho
  const segmentoMap = {
    INDÚSTRIA: "Indústria",
    INDUSTRIA: "Indústria",
    VAREJO: "Varejo",
    SERVIÇO: "Serviço",
    SERVICO: "Serviço",
    ASSESSORIA: "Assessoria",
    TURISMO: "Turismo",
    "E-COMMERCE": "E-commerce",
    ECOMMERCE: "E-commerce",
  }

  const originalSegmento = getValue("SEGMENTO")
  const nicho = segmentoMap[originalSegmento?.toUpperCase()] || originalSegmento || "Outro"

  // Processar valor
  const valorStr = getValue("VALOR")
  let valorPagoLead = 0
  if (valorStr) {
    const cleanValue = valorStr.replace(/[R$\s.]/g, "").replace(",", ".")
    valorPagoLead = Number.parseFloat(cleanValue) || 0
  }

  // Processar datas
  const processDate = (dateStr) => {
    if (!dateStr || dateStr === "-") return null
    try {
      // Formato DD/MM/YYYY para YYYY-MM-DD
      const [day, month, year] = dateStr.split("/")
      if (day && month && year) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      }
    } catch (error) {
      console.warn("Erro ao processar data:", dateStr)
    }
    return null
  }

  const dataCompra = processDate(getValue("DATA DA COMPRA"))
  const dataUltimoContato = processDate(getValue("DATA ÚLTIMO CONTATO"))

  // Processar horário
  const horarioCompra = getValue("HORÁRIO DE COMPRA")
  const dataHoraCompra = dataCompra && horarioCompra ? `${dataCompra}T${horarioCompra}` : dataCompra

  // Validação básica
  if (!nomeEmpresa || nomeEmpresa.length < 2) {
    throw new Error("Nome da empresa inválido")
  }

  const email = getValue("EMAIL")
  if (!email || !email.includes("@")) {
    throw new Error("Email inválido")
  }

  // Criar objeto lead
  const lead = {
    id: `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nome_empresa: nomeEmpresa,
    produto_marketing: getValue("PRODUTO") || "Produto Importado",
    nicho: nicho,
    data_hora_compra: dataHoraCompra,
    valor_pago_lead: valorPagoLead,
    tipo_lead: "leadbroker",
    faturamento: getValue("FATURAMENTO"),
    canal: getValue("CANAL"),
    nivel_urgencia: getValue("URGENCIA") === "-" ? null : getValue("URGENCIA"),
    regiao: getValue("REGIÃO"),
    cidade: getValue("CIDADE"),
    cnpj: null,
    nome_contato: leadField || "Contato Importado",
    cargo_contato: getValue("CARGO"),
    email: email,
    email_corporativo: getValue("EMAIL CORPORATIVO") === "SIM" ? email : null,
    telefone: "Não informado",
    sdr: sdr,
    closer: closer,
    arrematador: arrematador,
    produto: getValue("PRODUTO"),
    anuncios: getValue("ANÚNCIOS") === "SIM" ? "sim" : "nao",
    status: status,
    observacoes: getValue("OBSERVAÇÕES"),
    data_ultimo_contato: dataUltimoContato,
    motivo_perda_pv: getValue("MOTIVO DE PERDA PV"),
    tem_comentario_lbf: getValue("TEM COMENTÁRIO NO LB?") ? true : false,
    investimento_trafego: null,
    ticket_medio: null,
    qtd_lojas: null,
    qtd_vendedores: null,
    conseguiu_contato: getValue("CS") === "TRUE",
    reuniao_agendada: getValue("RM") === "TRUE",
    reuniao_realizada: getValue("RR") === "TRUE",
    valor_proposta: null,
    valor_venda: null,
    data_venda: null,
    data_fechamento: processDate(getValue("DATA DE ASSINATURA")),
    fee: null,
    escopo_fechado: getValue("ESCOPO FECHADO"),
    fee_total: null,
    venda_via_jasson_co: getValue("VENDA V4 JASSON&CO.") === "Sim",
    comissao_sdr: null,
    comissao_closer: null,
    status_comissao: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return lead
}

// Executar importação
console.log("🚀 Iniciando importação...")
importCsvLeads().then((leads) => {
  console.log(`\n🎉 Importação concluída! ${leads.length} leads processados.`)
  console.log("💡 Recarregue a página para ver os leads importados no sistema.")
})
