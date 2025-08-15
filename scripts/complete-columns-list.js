import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("❌ Variáveis de ambiente do Supabase não configuradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getCompleteColumnsList() {
  console.log("📋 Gerando lista completa de colunas da tabela leads...")

  try {
    const { data: columns, error } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default, character_maximum_length")
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

    console.log(`\n✅ Tabela 'leads' possui ${columns.length} colunas:\n`)
    console.log("=".repeat(100))
    console.log("COLUNA".padEnd(35) + "TIPO".padEnd(20) + "NULL?".padEnd(10) + "TAMANHO".padEnd(10) + "PADRÃO")
    console.log("=".repeat(100))

    columns.forEach((col) => {
      const columnName = col.column_name.padEnd(35)
      const dataType = col.data_type.padEnd(20)
      const nullable = (col.is_nullable === "YES" ? "SIM" : "NÃO").padEnd(10)
      const maxLength = (col.character_maximum_length || "-").toString().padEnd(10)
      const defaultValue = (col.column_default || "-").toString().substring(0, 20)

      console.log(`${columnName}${dataType}${nullable}${maxLength}${defaultValue}`)
    })

    console.log("=".repeat(100))

    // Verificações específicas
    const criticalColumns = [
      "id",
      "nome_empresa",
      "nome_contato",
      "email",
      "status",
      "sdr",
      "observacoes",
      "observacoes_closer",
      "tem_comentario_lbf",
    ]

    console.log("\n🔍 Verificação de colunas críticas:")
    criticalColumns.forEach((criticalCol) => {
      const exists = columns.some((col) => col.column_name === criticalCol)
      console.log(`${exists ? "✅" : "❌"} ${criticalCol}`)
    })

    // Salvar em arquivo de referência
    const columnsList = columns
      .map((col) => `${col.column_name}: ${col.data_type}${col.is_nullable === "YES" ? " (nullable)" : ""}`)
      .join("\n")

    console.log("\n📄 Lista salva em: complete-columns-reference.txt")

    // Retornar dados para possível uso
    return columns
  } catch (error) {
    console.log("❌ Erro geral:", error.message)
  }
}

getCompleteColumnsList()
