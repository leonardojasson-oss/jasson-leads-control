import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variáveis de ambiente do Supabase não encontradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addDataAssinaturaColumn() {
  try {
    console.log("🔄 Adicionando coluna data_assinatura na tabela leads...")

    // Executa o comando SQL para adicionar a coluna
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_assinatura DATE;",
    })

    if (error) {
      console.error("❌ Erro ao adicionar coluna:", error.message)

      // Tenta uma abordagem alternativa usando query direta
      console.log("🔄 Tentando abordagem alternativa...")
      const { error: altError } = await supabase.from("leads").select("data_assinatura").limit(1)

      if (altError && altError.message.includes('column "data_assinatura" does not exist')) {
        console.log("✅ Confirmado: coluna data_assinatura não existe na tabela leads")
        console.log("📝 Você precisa adicionar a coluna manualmente no Supabase:")
        console.log("   ALTER TABLE leads ADD COLUMN data_assinatura DATE;")
      } else {
        console.log("✅ Coluna data_assinatura já existe na tabela leads")
      }
    } else {
      console.log("✅ Coluna data_assinatura adicionada com sucesso!")
    }

    // Verifica se a coluna foi criada
    console.log("🔍 Verificando estrutura da tabela leads...")
    const { data: tableInfo, error: infoError } = await supabase.from("leads").select("*").limit(1)

    if (!infoError) {
      console.log("✅ Tabela leads acessível")
    } else {
      console.log("❌ Erro ao acessar tabela leads:", infoError.message)
    }
  } catch (error) {
    console.error("❌ Erro geral:", error.message)
  }
}

addDataAssinaturaColumn()
