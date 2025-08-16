import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[v0] Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addDataAssinaturaColumn() {
  try {
    console.log("[v0] Tentando adicionar coluna data_assinatura na tabela leads...")

    // Executa o comando SQL para adicionar a coluna
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: "ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_assinatura DATE;",
    })

    if (error) {
      console.error("[v0] Erro ao executar SQL via RPC:", error)

      // Tenta abordagem alternativa usando query direta
      console.log("[v0] Tentando abordagem alternativa...")
      const { error: directError } = await supabase.from("leads").select("data_assinatura").limit(1)

      if (directError && directError.message.includes('column "data_assinatura" does not exist')) {
        console.log("[v0] Confirmado: coluna data_assinatura não existe")
        console.log("[v0] SOLUÇÃO: Execute manualmente no Supabase SQL Editor:")
        console.log("[v0] ALTER TABLE leads ADD COLUMN data_assinatura DATE;")
      }
    } else {
      console.log("[v0] Comando SQL executado com sucesso:", data)

      // Verifica se a coluna foi criada
      const { error: testError } = await supabase.from("leads").select("data_assinatura").limit(1)

      if (testError) {
        console.error("[v0] Coluna ainda não existe após comando SQL:", testError)
      } else {
        console.log("[v0] ✅ Coluna data_assinatura criada com sucesso!")
      }
    }
  } catch (error) {
    console.error("[v0] Erro geral:", error)
  }
}

addDataAssinaturaColumn()
