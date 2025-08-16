import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variáveis de ambiente do Supabase não encontradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  try {
    console.log("🔍 Verificando estrutura da tabela leads...")

    // Tentar fazer uma query simples para ver as colunas
    const { data, error } = await supabase.from("leads").select("*").limit(1)

    if (error) {
      console.error("❌ Erro ao consultar tabela leads:", error.message)
      return
    }

    if (data && data.length > 0) {
      console.log("✅ Tabela leads encontrada!")
      console.log("📋 Colunas disponíveis:")
      const columns = Object.keys(data[0])
      columns.forEach((column, index) => {
        console.log(`${index + 1}. ${column}`)
      })

      // Verificar especificamente se data_assinatura existe
      if (columns.includes("data_assinatura")) {
        console.log("✅ Coluna data_assinatura ENCONTRADA!")
      } else {
        console.log("❌ Coluna data_assinatura NÃO ENCONTRADA!")
        console.log("💡 Será necessário criar a coluna data_assinatura")
      }
    } else {
      console.log("⚠️ Tabela leads está vazia, mas existe")
    }
  } catch (error) {
    console.error("❌ Erro geral:", error.message)
  }
}

checkTableStructure()
