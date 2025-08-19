const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variáveis de ambiente do Supabase não encontradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVendasEspecificas() {
  try {
    console.log("🔍 Consultando leads com vendas (data_fechamento OU data_assinatura preenchida)...\n")

    // Buscar leads que têm data_fechamento OU data_assinatura preenchida
    const { data: vendas, error } = await supabase
      .from("leads")
      .select("nome_empresa, nome_contato, data_fechamento, data_assinatura, valor_venda, status, sdr, closer")
      .or("data_fechamento.not.is.null,data_assinatura.not.is.null")
      .order("data_fechamento", { ascending: false, nullsLast: true })
      .order("data_assinatura", { ascending: false, nullsLast: true })

    if (error) {
      console.error("❌ Erro ao consultar vendas:", error)
      return
    }

    if (!vendas || vendas.length === 0) {
      console.log("📊 Nenhuma venda encontrada no sistema.")
      return
    }

    console.log(`📊 TOTAL DE VENDAS ENCONTRADAS: ${vendas.length}\n`)
    console.log("=".repeat(80))
    console.log("LEADS COM VENDAS REALIZADAS:")
    console.log("=".repeat(80))

    vendas.forEach((venda, index) => {
      console.log(`\n${index + 1}. EMPRESA: ${venda.nome_empresa || "N/A"}`)
      console.log(`   CONTATO: ${venda.nome_contato || "N/A"}`)
      console.log(`   STATUS: ${venda.status || "N/A"}`)
      console.log(`   SDR: ${venda.sdr || "N/A"}`)
      console.log(`   CLOSER: ${venda.closer || "N/A"}`)

      if (venda.data_fechamento) {
        console.log(`   📅 DATA FECHAMENTO: ${new Date(venda.data_fechamento).toLocaleDateString("pt-BR")}`)
      }

      if (venda.data_assinatura) {
        console.log(`   ✍️  DATA ASSINATURA: ${new Date(venda.data_assinatura).toLocaleDateString("pt-BR")}`)
      }

      if (venda.valor_venda) {
        console.log(
          `   💰 VALOR VENDA: R$ ${Number(venda.valor_venda).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        )
      }

      console.log("   " + "-".repeat(50))
    })

    console.log(`\n📈 RESUMO: ${vendas.length} vendas estão sendo contabilizadas no funil`)
    console.log("\n💡 CRITÉRIO: Leads com data_fechamento OU data_assinatura preenchida")
  } catch (error) {
    console.error("❌ Erro inesperado:", error)
  }
}

checkVendasEspecificas()
