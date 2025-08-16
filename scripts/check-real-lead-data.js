import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkLeadData() {
  console.log("=== VERIFICANDO DADOS REAIS DOS LEADS ===")

  // Buscar leads com os nomes mencionados
  const leadNames = ["Dra. Ivone Silva", "Meu Preparatório", "Ci cabeleireiro ltda", "bodyplastia"]

  for (const name of leadNames) {
    console.log(`\n--- Buscando: ${name} ---`)

    // Buscar na tabela leads
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("nome_empresa, faturamento")
      .ilike("nome_empresa", `%${name}%`)

    if (leadsError) {
      console.error("Erro ao buscar na tabela leads:", leadsError)
    } else if (leadsData && leadsData.length > 0) {
      console.log("Encontrado na tabela LEADS:")
      leadsData.forEach((lead) => {
        console.log(`  Nome: ${lead.nome_empresa}`)
        console.log(`  Faturamento: "${lead.faturamento}"`)
      })
    } else {
      console.log("Não encontrado na tabela leads")
    }

    // Buscar na tabela lead
    const { data: leadData, error: leadError } = await supabase
      .from("lead")
      .select("nome_fantazia, id_faturamento, faturamento(valor)")
      .ilike("nome_fantazia", `%${name}%`)

    if (leadError) {
      console.error("Erro ao buscar na tabela lead:", leadError)
    } else if (leadData && leadData.length > 0) {
      console.log("Encontrado na tabela LEAD:")
      leadData.forEach((lead) => {
        console.log(`  Nome: ${lead.nome_fantazia}`)
        console.log(`  ID Faturamento: ${lead.id_faturamento}`)
        console.log(`  Valor Faturamento: "${lead.faturamento?.valor}"`)
      })
    } else {
      console.log("Não encontrado na tabela lead")
    }
  }

  // Mostrar todos os faturamentos únicos para entender os padrões
  console.log("\n=== TODOS OS FATURAMENTOS ÚNICOS NA TABELA LEADS ===")
  const { data: allFaturamentos, error: faturamentosError } = await supabase
    .from("leads")
    .select("faturamento")
    .not("faturamento", "is", null)

  if (faturamentosError) {
    console.error("Erro ao buscar faturamentos:", faturamentosError)
  } else {
    const uniqueFaturamentos = [...new Set(allFaturamentos.map((item) => item.faturamento))]
    uniqueFaturamentos.forEach((fat) => {
      console.log(`"${fat}"`)
    })
  }
}

checkLeadData()
