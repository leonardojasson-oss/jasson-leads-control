// Script para analisar o arquivo CSV e extrair todas as opções dos cabeçalhos

async function analyzeCsvHeaders() {
  try {
    console.log("🔍 Analisando arquivo CSV...")

    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leadbroker%20jasson%20-%20Pa%CC%81gina1-ImqX7957BpVPGXQZnM3XOH2skC3e0u.csv",
    )
    const csvText = await response.text()

    console.log("📄 Arquivo carregado com sucesso!")

    // Dividir em linhas
    const lines = csvText.split("\n").filter((line) => line.trim() !== "")
    console.log(`📊 Total de linhas: ${lines.length}`)

    // Primeira linha são os cabeçalhos
    const headers = lines[0].split(",").map((header) => header.trim().replace(/"/g, ""))
    console.log(`📋 Total de colunas: ${headers.length}`)

    console.log("\n🏷️ === CABEÇALHOS ENCONTRADOS ===")
    headers.forEach((header, index) => {
      console.log(`${index + 1}. ${header}`)
    })

    // Analisar valores únicos para cada coluna
    console.log("\n📊 === ANÁLISE DE VALORES ÚNICOS POR COLUNA ===")

    const data = lines.slice(1).map((line) => {
      // Dividir linha respeitando aspas
      const values = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim()) // Último valor

      return values
    })

    // Analisar cada coluna
    headers.forEach((header, index) => {
      const values = data.map((row) => row[index] || "").filter((val) => val !== "" && val !== "-")
      const uniqueValues = [...new Set(values)].sort()

      if (uniqueValues.length > 0 && uniqueValues.length <= 50) {
        // Só mostrar se tiver até 50 valores únicos
        console.log(`\n📌 ${header}:`)
        uniqueValues.forEach((value) => {
          console.log(`   • ${value}`)
        })
        console.log(`   Total: ${uniqueValues.length} valores únicos`)
      } else if (uniqueValues.length > 50) {
        console.log(`\n📌 ${header}: ${uniqueValues.length} valores únicos (muitos para listar)`)
        console.log(`   Exemplos: ${uniqueValues.slice(0, 5).join(", ")}...`)
      }
    })

    // Análise específica para campos importantes
    console.log("\n🎯 === ANÁLISE DETALHADA DE CAMPOS IMPORTANTES ===")

    const importantFields = [
      "STATUS",
      "ARREMATANTE",
      "SDR",
      "ORIGEM",
      "SEGMENTO",
      "PRODUTO",
      "ANÚNCIOS",
      "CLOSER",
      "URGENCIA",
      "CANAL",
    ]

    importantFields.forEach((fieldName) => {
      const index = headers.findIndex((h) => h.toUpperCase().includes(fieldName))
      if (index !== -1) {
        const values = data.map((row) => row[index] || "").filter((val) => val !== "" && val !== "-")
        const uniqueValues = [...new Set(values)].sort()

        console.log(`\n🔸 ${headers[index]}:`)
        uniqueValues.forEach((value) => {
          const count = values.filter((v) => v === value).length
          console.log(`   • ${value} (${count}x)`)
        })
      }
    })
  } catch (error) {
    console.error("❌ Erro ao analisar CSV:", error)
  }
}

// Executar análise
analyzeCsvHeaders()
