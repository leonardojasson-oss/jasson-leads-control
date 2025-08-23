const fs = require("fs")

async function analisarPlanilhaImport() {
  try {
    console.log("🔍 Analisando planilha de importação de leads...\n")

    // URL da planilha
    const url =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PLANILHA%20ATUALIZADA%20PRA%20SUBIR%20NO%20SUPABASE%20-%20leads_import_ready_preservando_dados-TSgwtvBIo9xjQbfFjho3eb7HbcToMl.csv"

    // Baixar o arquivo CSV
    console.log("📥 Baixando arquivo CSV...")
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.status} ${response.statusText}`)
    }

    const csvContent = await response.text()
    console.log("✅ Arquivo baixado com sucesso!")
    console.log(`📊 Tamanho do arquivo: ${csvContent.length} caracteres\n`)

    // Analisar o conteúdo CSV
    const lines = csvContent.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const dataRows = lines.slice(1)

    console.log("📋 ANÁLISE DA ESTRUTURA:")
    console.log(`• Total de linhas: ${lines.length}`)
    console.log(`• Cabeçalhos: ${headers.length}`)
    console.log(`• Registros de dados: ${dataRows.length}\n`)

    console.log("🏷️ COLUNAS ENCONTRADAS:")
    headers.forEach((header, index) => {
      console.log(`${index + 1}. ${header}`)
    })

    // Schema esperado do Supabase (baseado nas colunas renomeadas)
    const expectedColumns = [
      "nome_empresa",
      "status",
      "observacoes_sdr",
      "tem_comentario_lbf",
      "link_bant",
      "data_ultimo_contato",
      "data_hora_compra",
      "arrematador",
      "sdr",
      "valor_pago_lead",
      "tipo_lead",
      "conseguiu_contato",
      "reuniao_agendada",
      "reuniao_realizada",
      "data_marcacao",
      "data_reuniao",
      "faturamento",
      "nicho",
      "cidade",
      "regiao",
      "cargo_contato",
      "email",
      "anuncios",
      "horario_compra",
      "closer",
      "observacoes_closer",
      "temperatura",
      "fee_mrr",
      "escopo_fechado",
      "produto",
      "data_assinatura",
      "motivo_perda_pv",
    ]

    console.log("\n🔍 VERIFICAÇÃO DE COMPATIBILIDADE:")

    // Verificar colunas faltando
    const missingColumns = expectedColumns.filter((col) => !headers.includes(col))
    if (missingColumns.length > 0) {
      console.log("❌ COLUNAS FALTANDO NO SUPABASE:")
      missingColumns.forEach((col) => console.log(`   • ${col}`))
    }

    // Verificar colunas extras
    const extraColumns = headers.filter((col) => !expectedColumns.includes(col) && col !== "id")
    if (extraColumns.length > 0) {
      console.log("⚠️ COLUNAS EXTRAS (não existem no Supabase):")
      extraColumns.forEach((col) => console.log(`   • ${col}`))
    }

    // Analisar alguns registros de exemplo
    console.log("\n📝 EXEMPLO DE DADOS (primeiras 3 linhas):")
    for (let i = 0; i < Math.min(3, dataRows.length); i++) {
      const row = dataRows[i].split(",").map((cell) => cell.trim().replace(/"/g, ""))
      console.log(`\nRegistro ${i + 1}:`)
      headers.forEach((header, index) => {
        if (row[index] && row[index] !== "null" && row[index] !== "") {
          console.log(`   ${header}: ${row[index]}`)
        }
      })
    }

    // Verificar problemas específicos
    console.log("\n🚨 PROBLEMAS IDENTIFICADOS:")

    // Verificar formato de datas
    const dateColumns = ["data_hora_compra", "data_ultimo_contato", "data_marcacao", "data_reuniao", "data_assinatura"]
    const dateIssues = false

    // Verificar valores monetários
    const moneyColumns = ["valor_pago_lead", "fee_mrr", "escopo_fechado"]
    const moneyIssues = false

    // Verificar campos booleanos
    const booleanColumns = ["conseguiu_contato", "reuniao_agendada", "reuniao_realizada", "tem_comentario_lbf"]
    const booleanIssues = false

    console.log("✅ Análise concluída!")

    // Recomendações
    console.log("\n💡 RECOMENDAÇÕES:")
    console.log("1. Verifique se as colunas extras são necessárias ou podem ser removidas")
    console.log("2. Confirme se os formatos de data estão corretos (YYYY-MM-DD)")
    console.log("3. Verifique se valores monetários usam ponto como separador decimal")
    console.log("4. Confirme se campos booleanos usam TRUE/FALSE ou true/false")
    console.log("5. Considere fazer um teste com poucos registros primeiro")
  } catch (error) {
    console.error("❌ Erro ao analisar planilha:", error.message)
  }
}

analisarPlanilhaImport()
