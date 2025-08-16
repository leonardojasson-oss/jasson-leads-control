import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Função para mapear faturamento para tier (mesma lógica do componente)
function mapFaturamentoToTier(faturamento) {
  if (!faturamento) return "-100k"

  // Normalizar texto: remover acentos, converter para minúsculas, normalizar espaços
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/\s+/g, " ") // Normaliza espaços
      .trim()
  }

  const faturamentoNorm = normalizeText(faturamento)
  console.log(`[v0] Processando faturamento: "${faturamento}" -> normalizado: "${faturamentoNorm}"`)

  // Regex patterns para cada tier
  const patterns = [
    { regex: /de\s*5[01]\s*mil.*7[0]\s*mil/i, tier: "-100k" },
    { regex: /de\s*7[01]\s*mil.*10[0]\s*mil/i, tier: "-100k" },
    { regex: /de\s*10[01]\s*mil.*200\s*mil/i, tier: "101 a 200k" },
    { regex: /de\s*20[01]\s*mil.*400\s*mil/i, tier: "201 a 400k" },
    { regex: /de\s*40[01]\s*mil.*1\s*milhao/i, tier: "401 a 1kk" },
    { regex: /de\s*1.*4\s*milhoes/i, tier: "1 a 4kk" },
    { regex: /de\s*4.*16\s*milhoes/i, tier: "4 a 16kk" },
    { regex: /de\s*16.*40\s*milhoes/i, tier: "16 a 40kk" },
    { regex: /mais\s*de\s*40\s*milhoes/i, tier: "+40kk" },
  ]

  for (const pattern of patterns) {
    if (pattern.regex.test(faturamentoNorm)) {
      console.log(`[v0] Match encontrado: ${pattern.tier}`)
      return pattern.tier
    }
  }

  console.log(`[v0] Nenhum match encontrado, retornando: -100k`)
  return "-100k"
}

async function listCurrentLeads() {
  try {
    console.log("[v0] Consultando leads cadastrados...")

    // Buscar todos os leads da tabela 'leads'
    const { data: leads, error } = await supabase
      .from("leads")
      .select("nome_empresa, faturamento, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao consultar leads:", error)
      return
    }

    console.log(`[v0] Encontrados ${leads?.length || 0} leads cadastrados`)
    console.log("\n=== LISTA DE LEADS CADASTRADOS ===\n")

    if (!leads || leads.length === 0) {
      console.log("Nenhum lead encontrado na tabela.")
      return
    }

    leads.forEach((lead, index) => {
      const tier = mapFaturamentoToTier(lead.faturamento)

      console.log(`${index + 1}. LEAD: ${lead.nome_empresa || "Nome não informado"}`)
      console.log(`   Faturamento cadastrado: "${lead.faturamento || "Não informado"}"`)
      console.log(`   Tier atribuído: "${tier}"`)
      console.log(
        `   Data cadastro: ${lead.created_at ? new Date(lead.created_at).toLocaleDateString("pt-BR") : "Não informado"}`,
      )
      console.log("   ---")
    })

    // Resumo por tier
    const tierCount = {}
    leads.forEach((lead) => {
      const tier = mapFaturamentoToTier(lead.faturamento)
      tierCount[tier] = (tierCount[tier] || 0) + 1
    })

    console.log("\n=== RESUMO POR TIER ===")
    Object.entries(tierCount).forEach(([tier, count]) => {
      console.log(`${tier}: ${count} leads`)
    })
  } catch (error) {
    console.error("[v0] Erro geral:", error)
  }
}

// Executar a consulta
listCurrentLeads()
