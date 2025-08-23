import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Variáveis de ambiente do Supabase não encontradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listarLeadsAgosto() {
  try {
    console.log("🔍 Consultando leads comprados em agosto de 2025...\n")

    // Consultar leads comprados em agosto de 2025
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

    console.log(`📊 LEADS COMPRADOS EM AGOSTO DE 2025 (${leads.length} leads)`)
    console.log("=".repeat(60))

    leads.forEach((lead, index) => {
      const dataCompra = new Date(lead.data_hora_compra).toLocaleDateString("pt-BR")
      const valor = lead.valor_pago_lead ? `R$ ${Number(lead.valor_pago_lead).toFixed(2)}` : "N/A"

      console.log(`${index + 1}. ${lead.nome_empresa}`)
      console.log(`   Data: ${dataCompra}`)
      console.log(`   Arrematador: ${lead.arrematador || "N/A"}`)
      console.log(`   Valor: ${valor}`)
      console.log("")
    })

    // Resumo por arrematador
    const resumoPorArrematador = leads.reduce((acc, lead) => {
      const arrematador = lead.arrematador || "Não informado"
      if (!acc[arrematador]) {
        acc[arrematador] = { count: 0, total: 0 }
      }
      acc[arrematador].count++
      acc[arrematador].total += Number(lead.valor_pago_lead || 0)
      return acc
    }, {})

    console.log("📈 RESUMO POR ARREMATADOR:")
    console.log("=".repeat(40))
    Object.entries(resumoPorArrematador).forEach(([arrematador, dados]) => {
      console.log(`${arrematador}: ${dados.count} leads - R$ ${dados.total.toFixed(2)}`)
    })
  } catch (error) {
    console.error("❌ Erro inesperado:", error)
  }
}

listarLeadsAgosto()
