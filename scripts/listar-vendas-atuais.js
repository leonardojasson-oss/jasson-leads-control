const { createClient } = require("@supabase/supabase-js")

async function listarVendasAtuais() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    console.log("[v0] Consultando leads que são contabilizados como vendas...")

    const { data: vendas, error } = await supabase
      .from("leads")
      .select("lead, data_fechamento, data_assinatura, status, sdr")
      .or("data_fechamento.not.is.null,data_assinatura.not.is.null")
      .order("data_fechamento", { ascending: false, nullsFirst: false })

    if (error) {
      throw error
    }

    console.log(`[v0] Total de vendas encontradas: ${vendas.length}`)
    console.log("[v0] ===== LEADS CONTABILIZADOS COMO VENDAS =====")

    vendas.forEach((venda, index) => {
      console.log(`[v0] ${index + 1}. ${venda.lead}`)
      console.log(`[v0]    Status: ${venda.status}`)
      console.log(`[v0]    SDR: ${venda.sdr}`)
      if (venda.data_fechamento) {
        console.log(`[v0]    Data Fechamento: ${venda.data_fechamento}`)
      }
      if (venda.data_assinatura) {
        console.log(`[v0]    Data Assinatura: ${venda.data_assinatura}`)
      }
      console.log("[v0]    ---")
    })
  } catch (error) {
    console.error("[v0] Erro ao consultar vendas:", error)
  }
}

listarVendasAtuais()
