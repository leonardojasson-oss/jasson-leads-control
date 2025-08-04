// Script para verificar a estrutura da tabela leads_jasson

import { createClient } from "@supabase/supabase-js"

async function checkTableStructure() {
  console.log("🔍 === VERIFICANDO ESTRUTURA DA TABELA ===")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Supabase não configurado")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Verificar se a tabela existe e buscar alguns registros
    console.log("📋 Buscando registros da tabela leads_jasson...")

    const { data: sampleData, error: sampleError } = await supabase.from("leads_jasson").select("*").limit(3)

    if (sampleError) {
      console.error("❌ Erro ao buscar dados:", sampleError)
      return
    }

    console.log(`✅ Encontrados registros na tabela: ${sampleData?.length || 0}`)

    if (sampleData && sampleData.length > 0) {
      console.log("\n📊 === ESTRUTURA DOS DADOS ===")

      const firstRecord = sampleData[0]
      const columns = Object.keys(firstRecord)

      console.log(`📋 Colunas encontradas (${columns.length}):`)
      columns.forEach((col, index) => {
        const value = firstRecord[col]
        const type = typeof value
        const preview = value ? String(value).substring(0, 50) : "null"
        console.log(`${index + 1}. ${col} (${type}): ${preview}`)
      })

      console.log("\n🔍 === MAPEAMENTO NECESSÁRIO ===")

      // Verificar campos importantes
      const importantFields = [
        "id",
        "nome_empresa",
        "lead",
        "email",
        "produto",
        "segmento",
        "nicho",
        "sdr",
        "closer",
        "arrematante",
        "status",
        "valor",
        "created_at",
      ]

      importantFields.forEach((field) => {
        const exists = columns.includes(field)
        const similar = columns.find((col) => col.toLowerCase().includes(field.toLowerCase()))

        if (exists) {
          console.log(`✅ ${field}: existe`)
        } else if (similar) {
          console.log(`⚠️ ${field}: não existe, mas encontrado '${similar}'`)
        } else {
          console.log(`❌ ${field}: não encontrado`)
        }
      })

      console.log("\n📝 === EXEMPLO DE REGISTRO ===")
      console.log(JSON.stringify(firstRecord, null, 2))
    }

    // 2. Contar total de registros
    const { count, error: countError } = await supabase.from("leads_jasson").select("*", { count: "exact", head: true })

    if (!countError) {
      console.log(`\n📊 Total de registros na tabela: ${count}`)
    }
  } catch (error) {
    console.error("❌ Erro geral:", error)
  }
}

// Executar verificação
checkTableStructure()
