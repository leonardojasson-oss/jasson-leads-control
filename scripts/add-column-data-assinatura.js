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
      console.error("❌ Erro ao adicionar coluna:", error)

      // Tenta abordagem alternativa usando query direta
      console.log("🔄 Tentando abordagem alternativa...")
      const { error: error2 } = await supabase.from("leads").select("data_assinatura").limit(1)

      if (error2 && error2.message.includes('column "data_assinatura" does not exist')) {
        console.log("✅ Confirmado: coluna data_assinatura não existe")
        console.log("📝 Execute manualmente no Supabase SQL Editor:")
        console.log("ALTER TABLE leads ADD COLUMN data_assinatura DATE;")
      } else {
        console.log("✅ Coluna data_assinatura já existe!")
      }
    } else {
      console.log("✅ Coluna data_assinatura adicionada com sucesso!")
    }

    // Verifica se a coluna foi criada
    console.log("🔍 Verificando se a coluna foi criada...")
    const { data: testData, error: testError } = await supabase.from("leads").select("data_assinatura").limit(1)

    if (testError) {
      console.error("❌ Coluna ainda não existe:", testError.message)
    } else {
      console.log("✅ Coluna data_assinatura verificada com sucesso!")
    }
  } catch (err) {
    console.error("❌ Erro geral:", err)
  }
}

addDataAssinaturaColumn()
