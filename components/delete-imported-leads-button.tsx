"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Loader2, Trash2 } from 'lucide-react'
import { useActionState } from "react"
import { deleteImportedLeads } from "@/app/actions" // Importe a Server Action
import { useTransition } from "react"

interface DeleteImportedLeadsButtonProps {
  onDeletionComplete: () => void
}

export function DeleteImportedLeadsButton({ onDeletionComplete }: DeleteImportedLeadsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(deleteImportedLeads, null)
  const [isTransitioning, startTransition] = useTransition()

  const handleConfirmDelete = async () => {
    startTransition(async () => {
      await formAction()
    })
    // O modal permanecerá aberto para mostrar o resultado
  }

  const handleClose = () => {
    setIsOpen(false)
    // Se a exclusão foi bem-sucedida, notifique o componente pai para recarregar os leads
    if (state?.success) {
      onDeletionComplete()
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
      >
        <Trash2 className="w-4 h-4" />
        <span>Excluir Leads Importados</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>Excluir Leads Importados</span>
            </DialogTitle>
            <DialogDescription>
              Esta ação irá **excluir permanentemente** todos os leads que foram importados via CSV (origem "LeadBroker")
              e seus dados relacionados do banco de dados.
              <br />
              <br />
              **Esta ação é irreversível.**
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isPending && (
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-600" />
                <p className="text-sm text-gray-600">Excluindo leads importados...</p>
              </div>
            )}

            {state && !isPending && (
              <div className="text-center space-y-4">
                {state.success ? (
                  <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 mx-auto text-red-600" />
                )}
                <h3 className="font-semibold text-gray-900">
                  {state.success ? "Exclusão Concluída!" : "Erro na Exclusão"}
                </h3>
                <p className="text-sm text-gray-600">{state.message}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end space-x-3 pt-4">
            {!state ? ( // Mostrar botões de ação se ainda não houver resultado
              <>
                <Button variant="outline" onClick={handleClose} disabled={isPending || isTransitioning}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700" disabled={isPending || isTransitioning}>
                  {isPending || isTransitioning ? "Excluindo..." : "Confirmar Exclusão"}
                </Button>
              </>
            ) : (
              // Mostrar apenas o botão de fechar após a conclusão
              <Button onClick={handleClose} className="bg-gray-600 hover:bg-gray-700">
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
