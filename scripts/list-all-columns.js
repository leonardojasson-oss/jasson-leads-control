import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("❌ Variáveis de ambiente do Supabase não configuradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listAllColumns() {
  console.log("📋 Listando todas as colunas da tabela leads...")

  try {
    const { data: columns, error } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_name", "leads")
      .order("ordinal_position")

    if (error) {
      console.log("❌ Erro ao listar colunas:", error.message)
      return
    }

    if (!columns || columns.length === 0) {
      console.log('❌ Nenhuma coluna encontrada para a tabela "leads"')
      return
    }

    console.log(`\n✅ Encontradas ${columns.length} colunas:\n`)

    columns.forEach((col, index) => {
      console.log(
        `${(index + 1).toString().padStart(2, "0")}. ${col.column_name.padEnd(30)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === "YES" ? "NULL" : "NOT NULL"}`,
      )
    })

    // Verificar se observacoes_closer existe
    const hasObservacoesCloser = columns.some((col) => col.column_name === "observacoes_closer")
    console.log(`\n🎯 Coluna 'observacoes_closer': ${hasObservacoesCloser ? "✅ EXISTE" : "❌ NÃO EXISTE"}`)

    // Listar colunas relacionadas a observações
    console.log("\n📝 Colunas de observações encontradas:")
    const observacoesCols = columns.filter((col) => col.column_name.includes("observac"))
    observacoesCols.forEach((col) => {
      console.log(`- ${col.column_name} (${col.data_type})`)
    })
  } catch (error) {
    console.log("❌ Erro geral:", error.message)
  }
}

listAllColumns()
