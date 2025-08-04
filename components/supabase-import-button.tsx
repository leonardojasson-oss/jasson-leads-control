"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Database, RefreshCw, CheckCircle, Upload } from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase-operations"

interface SupabaseImportButtonProps {
  onImportComplete: () => void
}

export function SupabaseImportButton({ onImportComplete }: SupabaseImportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    existing: number
    csvCount: number
    imported: number
    errors: number
    needsImport: boolean
  } | null>(null)

  const handleCheck = async () => {
    if (!isSupabaseConfigured || !supabase) {
      alert("❌ Supabase não está configurado")
      return
    }

    setChecking(true)
    setResult(null)

    try {
      // 1. Verificar leads existentes no Supabase
      console.log("🔍 Verificando Supabase...")
      const { data: existingLeads, error: fetchError } = await supabase
        .from("leads")
        .select("id, nome_empresa")
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw new Error(`Erro ao buscar leads: ${fetchError.message}`)
      }

      const existingCount = existingLeads?.length || 0
      console.log(`📋 Leads no Supabase: ${existingCount}`)

      // 2. Verificar leads no CSV
      console.log("📥 Verificando CSV...")
      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leadbroker%20jasson%20-%20Pa%CC%81gina1-ImqX7957BpVPGXQZnM3XOH2skC3e0u.csv",
      )
      const csvText = await response.text()
      const lines = csvText.split("\n").filter((line) => line.trim() !== "")
      const csvCount = lines.length - 1 // -1 para header

      console.log(`📊 Leads no CSV: ${csvCount}`)

      // 3. Determinar se precisa importar
      const needsImport = existingCount === 0 || existingCount < csvCount / 2

      setResult({
        existing: existingCount,
        csvCount: csvCount,
        imported: 0,
        errors: 0,
        needsImport: needsImport,
      })

      console.log(`🎯 Precisa importar: ${needsImport ? "SIM" : "NÃO"}`)
    } catch (error) {
      console.error("❌ Erro na verificação:", error)
      alert(`❌ Erro: ${error.message}`)
    } finally {
      setChecking(false)
    }
  }

  const handleImport = async () => {
    if (!result?.needsImport) return

    setImporting(true)

    try {
      console.log("🔄 Iniciando importação para Supabase...")

      // Buscar CSV
      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leadbroker%20jasson%20-%20Pa%CC%81gina1-ImqX7957BpVPGXQZnM3XOH2skC3e0u.csv",
      )
      const csvText = await response.text()

      const lines = csvText.split("\n").filter((line) => line.trim() !== "")
      const headers = lines[0].split(",").map((header) => header.trim().replace(/"/g, ""))

      const leadsToInsert = []
      let errorCount = 0

      // Processar linhas
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCsvLine(lines[i])
          const leadData = mapCsvToSupabaseLead(headers, values)

          if (leadData && leadData.nome_empresa && leadData.email) {
            leadsToInsert.push(leadData)
          } else {
            errorCount++
          }
        } catch (error) {
          console.error(`Erro linha ${i + 1}:`, error.message)
          errorCount++
        }
      }

      console.log(`📤 Inserindo ${leadsToInsert.length} leads...`)

      // Inserir em lotes
      const batchSize = 50
      let totalInserted = 0

      for (let i = 0; i < leadsToInsert.length; i += batchSize) {
        const batch = leadsToInsert.slice(i, i + batchSize)

        const { data, error } = await supabase.from("leads").insert(batch).select("id")

        if (error) {
          console.error("❌ Erro no lote:", error)
          errorCount += batch.length
        } else {
          totalInserted += data?.length || 0
          console.log(`✅ Lote inserido: ${data?.length || 0}`)
        }

        // Pausa entre lotes
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setResult((prev) => ({
        ...prev!,
        imported: totalInserted,
        errors: errorCount,
        needsImport: false,
      }))

      console.log(`🎉 Importação concluída: ${totalInserted} inseridos, ${errorCount} erros`)

      // Notificar conclusão
      setTimeout(() => {
        onImportComplete()
      }, 2000)
    } catch (error) {
      console.error("❌ Erro na importação:", error)
      alert(`❌ Erro na importação: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  // Funções auxiliares (simplificadas)
  const parseCsvLine = (line: string) => {
    const values = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current.trim().replace(/"/g, ""))
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.trim().replace(/"/g, ""))
    return values
  }

  const mapCsvToSupabaseLead = (headers: string[], values: string[]) => {
    const getField = (fieldName: string) => {
      const index = headers.findIndex((h) => h.toUpperCase().includes(fieldName.toUpperCase()))
      return index !== -1 ? values[index] || "" : ""
    }

    const leadField = getField("LEAD")
    const nomeEmpresa = leadField.split(" ")[0] || leadField || `Empresa_${Date.now()}`
    const email = getField("EMAIL")

    if (!email || !email.includes("@")) return null

    return {
      nome_empresa: nomeEmpresa,
      produto_marketing: getField("PRODUTO") || "Produto Importado",
      nicho: getField("SEGMENTO") || "Outro",
      valor_pago_lead: 100,
      tipo_lead: "leadbroker",
      nome_contato: leadField || "Contato Importado",
      email: email,
      telefone: "Não informado",
      sdr: getField("SDR")?.toLowerCase() || "antonio",
      arrematador: getField("ARREMATANTE")?.toLowerCase() || "alan",
      status: getField("STATUS") || "BACKLOG",
      observacoes: getField("OBSERVAÇÕES"),
    }
  }

  if (!isSupabaseConfigured) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setIsOpen(true)
          handleCheck()
        }}
        className="flex items-center space-x-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
      >
        <Database className="w-4 h-4" />
        <span>Verificar Supabase</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <span>Dados no Supabase</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {checking && (
              <div className="text-center space-y-4">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-green-600" />
                <p className="text-sm text-gray-600">Verificando dados no Supabase...</p>
              </div>
            )}

            {result && !importing && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Leads no Supabase:</span>
                    <span className="font-medium">{result.existing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Leads no CSV:</span>
                    <span className="font-medium">{result.csvCount}</span>
                  </div>
                  {result.imported > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Importados:</span>
                      <span className="font-medium text-green-600">{result.imported}</span>
                    </div>
                  )}
                </div>

                {result.needsImport && !result.imported ? (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Importação Necessária</h3>
                      <p className="text-sm text-gray-600">Os dados do CSV não estão no Supabase. Deseja importar?</p>
                    </div>
                    <Button onClick={handleImport} className="w-full bg-green-600 hover:bg-green-700">
                      Importar para Supabase
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Dados Sincronizados</h3>
                      <p className="text-sm text-gray-600">
                        {result.imported > 0
                          ? `${result.imported} leads importados com sucesso!`
                          : "Os dados já estão no Supabase"}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setIsOpen(false)
                        setResult(null)
                      }}
                      className="w-full"
                    >
                      Fechar
                    </Button>
                  </div>
                )}
              </div>
            )}

            {importing && (
              <div className="text-center space-y-4">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-green-600" />
                <div>
                  <h3 className="font-semibold">Importando para Supabase...</h3>
                  <p className="text-sm text-gray-600">Processando dados do CSV...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
