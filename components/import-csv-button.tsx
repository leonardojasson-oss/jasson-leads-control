"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ImportCSVButtonProps {
  onImportComplete?: () => void
}

export function ImportCSVButton({ onImportComplete }: ImportCSVButtonProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [importMessage, setImportMessage] = useState("")

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus("idle")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/import-csv", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setImportStatus("success")
        setImportMessage(`✅ ${result.count} leads importados com sucesso!`)
        onImportComplete?.()
      } else {
        setImportStatus("error")
        setImportMessage(`❌ Erro: ${result.error}`)
      }
    } catch (error) {
      setImportStatus("error")
      setImportMessage(`❌ Erro ao importar: ${error}`)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Leads do CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Selecione um arquivo CSV com os dados dos leads.</p>
            <p className="mt-2">
              <strong>Colunas esperadas:</strong> Nome da Empresa, Nome do Contato, Email, Telefone, Status, SDR, Valor
              Pago, Tipo Lead, Nicho, Cidade, Região, Faturamento, Data Compra, Observações, Observações Closer
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Clique para selecionar um arquivo CSV
              </span>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>

          {isImporting && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Importando...</span>
            </div>
          )}

          {importStatus === "success" && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span>{importMessage}</span>
            </div>
          )}

          {importStatus === "error" && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{importMessage}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
