import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const mapFaturamentoToTier = (faturamento) => {
  const safeString = (value) => {
    if (value === null || value === undefined) return ""
    return String(value)
  }

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/\s+/g, " ") // Normaliza espaços
      .trim()
  }

  const faturamentoOriginal = safeString(faturamento)
  const faturamentoNorm = normalizeText(faturamentoOriginal)

  console.log(`[DEBUG] Faturamento: "${faturamentoOriginal}" -> Normalizado: "${faturamentoNorm}"`)

  if (
    !faturamentoNorm ||
    faturamentoNorm === "" ||
    faturamentoNorm === "-" ||
    faturamentoNorm === "null" ||
    faturamentoNorm === "undefined"
  ) {
    return "-100k"
  }

  if (
    /de\s*5[01]\s*mil\s*(a|à)\s*7[0]\s*mil/i.test(faturamentoNorm) ||
    /de\s*7[01]\s*mil\s*(a|à)\s*100\s*mil/i.test(faturamentoNorm)
  ) {
    return "-100k"
  }

  if (/de\s*10[01]\s*mil\s*(a|à)\s*200\s*mil/i.test(faturamentoNorm)) {
    return "101 a 200k"
  }

  if (/de\s*20[01]\s*mil\s*(a|à)\s*400\s*mil/i.test(faturamentoNorm)) {
    return "201 a 400k"
  }

  if (/de\s*40[01]\s*mil\s*(a|à)\s*1\s*(milhao|milhoes)/i.test(faturamentoNorm)) {
    return "401 a 1kk"
  }

  if (/de\s*1\s*(a|à)\s*4\s*(milhao|milhoes)/i.test(faturamentoNorm)) {
    return "1 a 4kk"
  }

  if (/de\s*4\s*(a|à)\s*16\s*(milhao|milhoes)/i.test(faturamentoNorm)) {
    return "4 a 16kk"
  }

  if (/de\s*16\s*(a|à)\s*40\s*(milhao|milhoes)/i.test(faturamentoNorm)) {
    return "16 a 40kk"
  }

  if (/(mais\s*de\s*40|acima\s*de\s*40|\+\s*40).*(milhao|milhoes)/i.test(faturamentoNorm)) {
    return "+40kk"
  }

  return "-100k"
}

const getFilteredLeads = (leads, period = "mes") => {
  if (!leads || leads.length === 0) return []

  const now = new Date()
  let filteredLeads = leads

  switch (period) {
    case "hoje":
      filteredLeads = leads.filter((lead) => {
        if (!lead.data_hora_compra) return false
        const leadDate = new Date(lead.data_hora_compra)
        return leadDate.toDateString() === now.toDateString()
      })
      break
    case "semana":
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filteredLeads = leads.filter((lead) => {
        if (!lead.data_hora_compra) return false
        const leadDate = new Date(lead.data_hora_compra)
        return leadDate >= weekAgo
      })
      break
    case "mes":
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
      filteredLeads = leads.filter((lead) => {
        if (!lead.data_hora_compra) return false
        const leadDate = new Date(lead.data_hora_compra)
        return leadDate >= monthAgo
      })
      break
    default:
      filteredLeads = leads
  }

  return filteredLeads
}

async function debugLeadsDiscrepancy() {
  try {
    console.log("🔍 INVESTIGANDO DISCREPÂNCIA ENTRE LISTA DE LEADS E CONTROLE DE METAS")
    console.log("=" * 80)

    const { data: allLeads, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erro ao buscar leads:", error)
      return
    }

    console.log(`📊 TOTAL DE LEADS NA TABELA: ${allLeads.length}`)
    console.log("")

    console.log("📋 ANÁLISE DETALHADA DE CADA LEAD:")
    console.log("-".repeat(80))

    allLeads.forEach((lead, index) => {
      const tier = mapFaturamentoToTier(lead.faturamento)
      console.log(`${index + 1}. ${lead.empresa || "Sem nome"}`)
      console.log(`   Faturamento: "${lead.faturamento || "Não informado"}"`)
      console.log(`   Tier mapeado: ${tier}`)
      console.log(`   Data/Hora Compra: ${lead.data_hora_compra || "Não informado"}`)
      console.log(`   Created At: ${lead.created_at || "Não informado"}`)
      console.log("")
    })

    console.log("🗓️ ANÁLISE POR PERÍODO:")
    console.log("-".repeat(80))

    const periods = ["todos", "mes", "semana", "hoje"]

    periods.forEach((period) => {
      const filtered = getFilteredLeads(allLeads, period)
      console.log(`${period.toUpperCase()}: ${filtered.length} leads`)

      if (filtered.length !== allLeads.length) {
        console.log("   Leads excluídos do filtro:")
        allLeads.forEach((lead) => {
          if (!filtered.includes(lead)) {
            console.log(`   - ${lead.empresa}: data_hora_compra = ${lead.data_hora_compra}`)
          }
        })
      }
      console.log("")
    })

    console.log("🎯 CONTAGEM POR TIER (FILTRO MENSAL - PADRÃO DO CONTROLE DE METAS):")
    console.log("-".repeat(80))

    const monthlyLeads = getFilteredLeads(allLeads, "mes")
    const tierCounts = {}

    monthlyLeads.forEach((lead) => {
      const tier = mapFaturamentoToTier(lead.faturamento)
      tierCounts[tier] = (tierCounts[tier] || 0) + 1
    })

    Object.entries(tierCounts).forEach(([tier, count]) => {
      console.log(`${tier}: ${count} leads`)
    })

    const totalInMetas = Object.values(tierCounts).reduce((sum, count) => sum + count, 0)
    console.log("")
    console.log(`📊 TOTAL NO CONTROLE DE METAS (filtro mensal): ${totalInMetas}`)
    console.log(`📊 TOTAL NA LISTA DE LEADS: ${allLeads.length}`)
    console.log(`❗ DIFERENÇA: ${allLeads.length - totalInMetas}`)

    if (totalInMetas !== allLeads.length) {
      console.log("")
      console.log("🚨 LEADS QUE NÃO APARECEM NO CONTROLE DE METAS:")
      console.log("-".repeat(80))

      allLeads.forEach((lead) => {
        if (!monthlyLeads.includes(lead)) {
          console.log(`- ${lead.empresa}`)
          console.log(`  Motivo: data_hora_compra = ${lead.data_hora_compra}`)
          console.log(`  Created: ${lead.created_at}`)
          console.log("")
        }
      })
    }
  } catch (error) {
    console.error("❌ Erro na análise:", error)
  }
}

debugLeadsDiscrepancy()
