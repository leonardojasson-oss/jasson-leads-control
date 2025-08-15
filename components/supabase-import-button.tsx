"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Database, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SupabaseImportButtonProps {
  onImportComplete?: () => void
}

export function SupabaseImportButton({ onImportComplete }: SupabaseImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [importMessage, setImportMessage] = useState("")

  const handleImportFromSupabase = async () => {
    setIsImporting(true)
    setImportStatus("idle")

    try {
      const response = await fetch("/api/sync-supabase", {
        method: "POST",
      })

      const result = await response.json()

      if (response.ok) {
        setImportStatus("success")
        setImportMessage(`✅ ${result.count} leads sincronizados do Supabase!`)
        onImportComplete?.()
      } else {
        setImportStatus("error")
        setImportMessage(`❌ Erro: ${result.error}`)
      }
    } catch (error) {
      setImportStatus("error")
      setImportMessage(`❌ Erro ao sincronizar: ${error}`)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="w-4 h-4 mr-2" />
          Sincronizar Supabase
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sincronizar com Supabase</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Esta ação irá sincronizar todos os leads do banco de dados Supabase com o sistema local.</p>
            <p className="mt-2 text-amber-600">
              <strong>Atenção:</strong> Isso pode sobrescrever dados locais não salvos.
            </p>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleImportFromSupabase} disabled={isImporting} className="w-full">
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Sincronizar Agora
                </>
              )}
            </Button>
          </div>

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
