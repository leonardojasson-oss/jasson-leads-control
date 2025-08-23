import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Variáveis de ambiente do Supabase não encontradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function consultarLeadsAgosto() {
  try {
    console.log("🔍 Consultando leads comprados em agosto de 2025...")

    const { data: leads, error } = await supabase
      .from("leads")
      .select("nome_empresa, data_hora_compra, arrematador, valor_pago_lead")
      .gte("data_hora_compra", "2025-08-01T00:00:00")
      .lt("data_hora_compra", "2025-09-01T00:00:00")
      .order("data_hora_compra", { ascending: true })

    if (error) {
      console.error("❌ Erro ao consultar leads:", error)
      return
    }

    if (!leads || leads.length === 0) {
      console.log("📋 Nenhum lead encontrado para agosto de 2025")
      return
    }

    console.log(`\n📋 LEADS COMPRADOS EM AGOSTO DE 2025 (${leads.length} leads):\n`)

    leads.forEach((lead, index) => {
      const data = new Date(lead.data_hora_compra).toLocaleDateString("pt-BR")
      const valor = lead.valor_pago_lead ? `R$ ${lead.valor_pago_lead.toFixed(2)}` : "N/A"
      console.log(`${index + 1}. ${lead.nome_empresa} - ${data} - ${lead.arrematador} - ${valor}`)
    })

    // Resumo por arrematador
    const resumoPorArrematador = leads.reduce((acc, lead) => {
      const arrematador = lead.arrematador || "Não informado"
      if (!acc[arrematador]) {
        acc[arrematador] = { count: 0, total: 0 }
      }
      acc[arrematador].count++
      acc[arrematador].total += lead.valor_pago_lead || 0
      return acc
    }, {})

    console.log("\n📊 RESUMO POR ARREMATADOR:")
    Object.entries(resumoPorArrematador).forEach(([arrematador, dados]) => {
      console.log(`${arrematador}: ${dados.count} leads - R$ ${dados.total.toFixed(2)}`)
    })
  } catch (error) {
    console.error("❌ Erro inesperado:", error)
  }
}

consultarLeadsAgosto()
