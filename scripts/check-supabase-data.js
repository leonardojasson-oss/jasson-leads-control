// Script para verificar dados no Supabase e importar CSV se necessário

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("❌ Variáveis de ambiente do Supabase não configuradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAndImportSupabaseData() {
  console.log("🔍 === VERIFICANDO DADOS NO SUPABASE ===")

  console.log("🔍 Verificando dados no Supabase...")

  try {
    // Verificar se a tabela leads existe e contar registros
    const { data, error, count } = await supabase.from("leads").select("*", { count: "exact", head: true })

    if (error) {
      console.log("❌ Erro ao acessar tabela leads:", error.message)
      return
    }

    console.log(`✅ Tabela 'leads' encontrada com ${count} registros`)

    // Buscar alguns registros de exemplo
    const { data: sampleData, error: sampleError } = await supabase
      .from("leads")
      .select("id, nome_empresa, status, sdr, observacoes_closer")
      .limit(5)

    if (sampleError) {
      console.log("❌ Erro ao buscar dados de exemplo:", sampleError.message)
      return
    }

    console.log("\n📋 Primeiros 5 registros:")
    sampleData?.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.nome_empresa} - Status: ${lead.status} - SDR: ${lead.sdr}`)
      if (lead.observacoes_closer) {
        console.log(`   Observações Closer: ${lead.observacoes_closer}`)
      }
    })

    // Verificar estrutura da tabela
    const { data: columns } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "leads")
      .order("ordinal_position")

    console.log("\n🏗️ Estrutura da tabela leads:")
    columns?.forEach((col) => {
      console.log(`- ${col.column_name}: ${col.data_type}`)
    })

    // 1. Verificar quantos leads existem no Supabase
    console.log("\n📊 Verificando leads existentes...")
    const { data: existingLeads, error: fetchError } = await supabase
      .from("leads")
      .select("id, nome_empresa, created_at")
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("❌ Erro ao buscar leads:", fetchError)
      return
    }

    console.log(`📋 Leads encontrados no Supabase: ${existingLeads?.length || 0}`)

    if (existingLeads && existingLeads.length > 0) {
      console.log("\n📝 Últimos 5 leads no Supabase:")
      existingLeads.slice(0, 5).forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.nome_empresa} (${new Date(lead.created_at).toLocaleDateString("pt-BR")})`)
      })
    }

    // 2. Buscar dados do CSV
    console.log("\n📥 Buscando dados do CSV...")
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leadbroker%20jasson%20-%20Pa%CC%81gina1-ImqX7957BpVPGXQZnM3XOH2skC3e0u.csv",
    )
    const csvText = await response.text()

    const lines = csvText.split("\n").filter((line) => line.trim() !== "")
    const csvLeadsCount = lines.length - 1 // -1 para header

    console.log(`📊 Leads no CSV: ${csvLeadsCount}`)

    // 3. Comparar e decidir se precisa importar
    const needsImport = !existingLeads || existingLeads.length === 0 || existingLeads.length < csvLeadsCount / 2

    if (needsImport) {
      console.log("\n🔄 === INICIANDO IMPORTAÇÃO PARA SUPABASE ===")
      await importCsvToSupabase(supabase, csvText)
    } else {
      console.log("\n✅ Dados já estão no Supabase - não é necessário importar")
    }
  } catch (error) {
    console.error("❌ Erro geral:", error.message)
  }
}

async function importCsvToSupabase(supabase, csvText) {
  try {
    const lines = csvText.split("\n").filter((line) => line.trim() !== "")
    const headers = lines[0].split(",").map((header) => header.trim().replace(/"/g, ""))

    console.log(`📋 Processando ${lines.length - 1} linhas...`)

    const leadsToInsert = []
    let successCount = 0
    let errorCount = 0

    // Processar cada linha
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCsvLine(lines[i])
        const leadData = mapCsvToSupabaseLead(headers, values)

        if (leadData && leadData.nome_empresa && leadData.email) {
          leadsToInsert.push(leadData)
          successCount++
        } else {
          console.warn(`⚠️ Linha ${i + 1}: dados insuficientes`)
          errorCount++
        }
      } catch (error) {
        console.error(`❌ Erro na linha ${i + 1}:`, error.message)
        errorCount++
      }
    }

    console.log(`✅ ${successCount} leads preparados para inserção`)
    console.log(`❌ ${errorCount} leads com erro`)

    // Inserir em lotes de 50
    const batchSize = 50
    let totalInserted = 0

    for (let i = 0; i < leadsToInsert.length; i += batchSize) {
      const batch = leadsToInsert.slice(i, i + batchSize)

      console.log(
        `📤 Inserindo lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(leadsToInsert.length / batchSize)}...`,
      )

      const { data, error } = await supabase.from("leads").insert(batch).select("id")

      if (error) {
        console.error("❌ Erro ao inserir lote:", error)
        // Tentar inserir um por um se o lote falhar
        for (const lead of batch) {
          try {
            const { error: singleError } = await supabase.from("leads").insert([lead])
            if (!singleError) {
              totalInserted++
            } else {
              console.error(`❌ Erro ao inserir ${lead.nome_empresa}:`, singleError.message)
            }
          } catch (singleErr) {
            console.error(`❌ Erro individual:`, singleErr)
          }
        }
      } else {
        totalInserted += data?.length || 0
        console.log(`✅ Lote inserido: ${data?.length || 0} leads`)
      }

      // Pequena pausa entre lotes
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log(`\n🎉 === IMPORTAÇÃO CONCLUÍDA ===`)
    console.log(`✅ Total inserido no Supabase: ${totalInserted}`)
    console.log(`❌ Total com erro: ${errorCount}`)
    console.log(`📊 Taxa de sucesso: ${((totalInserted / (totalInserted + errorCount)) * 100).toFixed(1)}%`)

    // Verificar resultado final
    const { data: finalCount } = await supabase.from("leads").select("id", { count: "exact", head: true })
    console.log(`📋 Total de leads no Supabase agora: ${finalCount?.length || "N/A"}`)
  } catch (error) {
    console.error("❌ Erro na importação:", error)
  }
}

// Função para processar linha CSV
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

// Função para mapear CSV para Supabase
function mapCsvToSupabaseLead(headers, values) {
  const getField = (fieldName) => {
    const index = headers.findIndex((h) => h.toUpperCase().includes(fieldName.toUpperCase()))
    return index !== -1 ? values[index] || "" : ""
  }

  const getValue = (fieldName) => {
    const value = getField(fieldName)
    return value === "-" || value === "" ? null : value
  }

  // Extrair dados básicos
  const leadField = getValue("LEAD") || ""
  const nomeEmpresa = leadField.split(" ")[0] || leadField || `Empresa_${Date.now()}`

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

  // Mapear equipe
  const sdrMap = {
    ANTÔNIO: "antonio",
    ANTONIO: "antonio",
    GABRIELLI: "gabrielli",
    VANESSA: "vanessa",
  }

  const closerMap = {
    LEONARDO: "leonardo",
    JASSON: "jasson",
    ANTÔNIO: "antonio",
    ANTONIO: "antonio",
    GABRIELLI: "gabrielli",
    VANESSA: "vanessa",
  }

  const arrematadorMap = {
    ALAN: "alan",
    ANTÔNIO: "antonio",
    ANTONIO: "antonio",
    GABRIELLI: "gabrielli",
    JASSON: "jasson",
    VANESSA: "vanessa",
    WILLIAM: "william",
  }

  const sdr = sdrMap[getValue("SDR")?.toUpperCase()] || getValue("SDR")?.toLowerCase() || "antonio"
  const closer = getValue("CLOSER")
    ? closerMap[getValue("CLOSER")?.toUpperCase()] || getValue("CLOSER")?.toLowerCase()
    : null
  const arrematador =
    arrematadorMap[getValue("ARREMATANTE")?.toUpperCase()] || getValue("ARREMATANTE")?.toLowerCase() || "alan"

  // Mapear segmento
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

  const nicho = segmentoMap[getValue("SEGMENTO")?.toUpperCase()] || getValue("SEGMENTO") || "Outro"

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
      const [day, month, year] = dateStr.split("/")
      if (day && month && year && year.length === 4) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      }
    } catch (error) {
      // Ignorar erro de data
    }
    return null
  }

  const dataCompra = processDate(getValue("DATA DA COMPRA"))
  const horarioCompra = getValue("HORÁRIO DE COMPRA")
  const dataHoraCompra = dataCompra && horarioCompra ? `${dataCompra}T${horarioCompra}:00` : null

  // Email
  const email = getValue("EMAIL")
  if (!email || !email.includes("@")) {
    return null // Pular se não tem email válido
  }

  // Criar objeto para Supabase
  return {
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
    data_ultimo_contato: processDate(getValue("DATA ÚLTIMO CONTATO")),
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
  }
}

// Executar verificação
checkAndImportSupabaseData()
