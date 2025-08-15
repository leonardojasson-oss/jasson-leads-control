import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("❌ Variáveis de ambiente do Supabase não configuradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkObservacoesCloserColumn() {
  console.log("🔍 Verificando se a coluna observacoes_closer existe...")

  try {
    // Tentar fazer uma query que usa a coluna observacoes_closer
    const { data, error } = await supabase.from("leads").select("id, observacoes_closer").limit(1)

    if (error) {
      if (error.message.includes("observacoes_closer")) {
        console.log("❌ A coluna observacoes_closer NÃO existe na tabela leads")
        console.log("📝 Você precisa executar o script: scripts/add-observacoes-closer-column.sql")
        return false
      } else {
        console.log("❌ Erro inesperado:", error.message)
        return false
      }
    }

    console.log("✅ A coluna observacoes_closer JÁ EXISTE na tabela leads")
    console.log("🎉 Tudo funcionando corretamente!")
    return true
  } catch (error) {
    console.log("❌ Erro ao verificar coluna:", error.message)
    return false
  }
}

checkObservacoesCloserColumn()
