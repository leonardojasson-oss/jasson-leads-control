"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

interface ImportCsvButtonProps {
  onImportComplete: () => void
}

export function ImportCsvButton({ onImportComplete }: ImportCsvButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: number
    errors: number
    total: number
  } | null>(null)

  const handleImport = async () => {
    setImporting(true)
    setImportResult(null)

    try {
      console.log("🔄 Iniciando importação do CSV...")

      // Buscar arquivo CSV
      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leadbroker%20jasson%20-%20Pa%CC%81gina1-ImqX7957BpVPGXQZnM3XOH2skC3e0u.csv",
      )
      const csvText = await response.text()

      // Processar CSV
      const lines = csvText.split("\n").filter((line) => line.trim() !== "")
      const headers = lines[0].split(",").map((header) => header.trim().replace(/"/g, ""))

      const leads = []
      let successCount = 0
      let errorCount = 0

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCsvLine(lines[i])
          const leadData = mapCsvToLead(headers, values)

          if (leadData) {
            leads.push(leadData)
            successCount++
          }
        } catch (error) {
          console.error(`Erro na linha ${i + 1}:`, error.message)
          errorCount++
        }
      }

      // Salvar no localStorage
      const existingLeads = JSON.parse(localStorage.getItem("jasson-leads-data-v2") || "[]")
      const allLeads = [...leads, ...existingLeads]
      localStorage.setItem("jasson-leads-data-v2", JSON.stringify(allLeads))

      setImportResult({
        success: successCount,
        errors: errorCount,
        total: successCount + errorCount,
      })

      console.log(`✅ Importação concluída: ${successCount} sucessos, ${errorCount} erros`)

      // Notificar componente pai
      setTimeout(() => {
        onImportComplete()
      }, 2000)
    } catch (error) {
      console.error("❌ Erro na importação:", error)
      setImportResult({
        success: 0,
        errors: 1,
        total: 1,
      })
    } finally {
      setImporting(false)
    }
  }

  // Função auxiliar para processar linha CSV
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

  // Função para mapear CSV para formato do sistema
  const mapCsvToLead = (headers: string[], values: string[]) => {
    const getField = (fieldName: string) => {
      const index = headers.findIndex((h) => h.toUpperCase().includes(fieldName.toUpperCase()))
      return index !== -1 ? values[index] || "" : ""
    }

    const getValue = (fieldName: string) => {
      const value = getField(fieldName)
      return value === "-" || value === "" ? null : value
    }

    // Extrair nome da empresa
    const leadField = getValue("LEAD")
    const nomeEmpresa = leadField ? leadField.split(" ")[0] || leadField : "Empresa Importada"

    // Validação básica
    if (!nomeEmpresa || nomeEmpresa.length < 2) {
      throw new Error("Nome da empresa inválido")
    }

    const email = getValue("EMAIL")
    if (!email || !email.includes("@")) {
      throw new Error("Email inválido")
    }

    // Mapear campos (versão simplificada)
    return {
      id: `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nome_empresa: nomeEmpresa,
      produto_marketing: getValue("PRODUTO") || "Produto Importado",
      nicho: getValue("SEGMENTO") || "Outro",
      valor_pago_lead: 100, // Valor padrão
      tipo_lead: "leadbroker",
      nome_contato: leadField || "Contato Importado",
      email: email,
      telefone: "Não informado",
      sdr: getValue("SDR")?.toLowerCase() || "antonio",
      arrematador: getValue("ARREMATANTE")?.toLowerCase() || "alan",
      status: getValue("STATUS") || "BACKLOG",
      observacoes: getValue("OBSERVAÇÕES"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
      >
        <Upload className="w-4 h-4" />
        <span>Importar CSV</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>Importar Leads do CSV</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!importing && !importResult && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Importar dados do LeadBroker</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Isso vai importar todos os leads do arquivo CSV para o sistema.
                  </p>
                </div>
                <Button onClick={handleImport} className="w-full bg-blue-600 hover:bg-blue-700">
                  Iniciar Importação
                </Button>
              </div>
            )}

            {importing && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Importando leads...</h3>
                  <p className="text-sm text-gray-500">Processando arquivo CSV, aguarde...</p>
                </div>
              </div>
            )}

            {importResult && (
              <div className="text-center space-y-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                    importResult.success > 0 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {importResult.success > 0 ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Importação Concluída!</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>✅ {importResult.success} leads importados com sucesso</p>
                    {importResult.errors > 0 && <p>❌ {importResult.errors} leads com erro</p>}
                    <p className="font-medium">Total processado: {importResult.total}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setIsOpen(false)
                    setImportResult(null)
                  }}
                  className="w-full"
                >
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
