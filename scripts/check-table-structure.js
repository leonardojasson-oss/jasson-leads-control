import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("❌ Variáveis de ambiente do Supabase não configuradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTableStructure() {
  console.log("🔍 Verificando estrutura da tabela leads...")

  try {
    // Verificar se a tabela existe
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "leads")

    if (tablesError) {
      console.log("❌ Erro ao verificar tabelas:", tablesError.message)
      return
    }

    if (!tables || tables.length === 0) {
      console.log('❌ Tabela "leads" não encontrada!')
      console.log("📝 Execute o script: scripts/create-leads-table-manual.sql")
      return
    }

    console.log('✅ Tabela "leads" encontrada!')

    // Verificar estrutura das colunas
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_name", "leads")
      .order("ordinal_position")

    if (columnsError) {
      console.log("❌ Erro ao verificar colunas:", columnsError.message)
      return
    }

    console.log("\n🏗️ Estrutura da tabela leads:")
    console.log("=".repeat(80))

    const requiredColumns = [
      "id",
      "nome_empresa",
      "nome_contato",
      "email",
      "status",
      "sdr",
      "observacoes",
      "observacoes_closer",
      "tem_comentario_lbf",
      "created_at",
      "updated_at",
    ]

    const foundColumns = columns?.map((col) => col.column_name) || []

    columns?.forEach((col) => {
      const isRequired = requiredColumns.includes(col.column_name)
      const marker = isRequired ? "🔴" : "⚪"
      console.log(
        `${marker} ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(15)} | ${col.is_nullable === "YES" ? "NULL" : "NOT NULL"}`,
      )
    })

    console.log("\n🔍 Verificando colunas obrigatórias:")
    requiredColumns.forEach((reqCol) => {
      const exists = foundColumns.includes(reqCol)
      console.log(`${exists ? "✅" : "❌"} ${reqCol}`)
    })

    // Verificar especificamente a coluna observacoes_closer
    const hasObservacoesCloser = foundColumns.includes("observacoes_closer")
    console.log(`\n🎯 Coluna 'observacoes_closer': ${hasObservacoesCloser ? "✅ EXISTE" : "❌ NÃO EXISTE"}`)

    if (!hasObservacoesCloser) {
      console.log("📝 Execute o script: scripts/add-observacoes-closer-column.sql")
    }
  } catch (error) {
    console.log("❌ Erro geral:", error.message)
  }
}

checkTableStructure()
