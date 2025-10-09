"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Scope {
  id: string
  code: string
  description: string
  created_at: string
}

interface RoleScope {
  role_id: string
  scope_id: string
}

interface Role {
  id: string
  name: string
  code: string
}

interface ScopesSectionProps {
  scopes: Scope[]
  setScopes: (scopes: Scope[]) => void
  roleScopes: RoleScope[]
  roles: Role[]
}

export function ScopesSection({ scopes, setScopes, roleScopes, roles }: ScopesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingScope, setEditingScope] = useState<Scope | null>(null)
  const [formData, setFormData] = useState({ code: "", description: "" })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const getRoleCount = (scopeId: string) => {
    return roleScopes.filter((rs) => rs.scope_id === scopeId).length
  }

  const handleOpenDialog = (scope?: Scope) => {
    if (scope) {
      setEditingScope(scope)
      setFormData({ code: scope.code, description: scope.description })
    } else {
      setEditingScope(null)
      setFormData({ code: "", description: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.code || !formData.description) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      if (editingScope) {
        // Update
        const { error } = await supabase.from("scopes").update(formData).eq("id", editingScope.id)

        if (error) throw error

        setScopes(scopes.map((s) => (s.id === editingScope.id ? { ...s, ...formData } : s)))

        // Log audit
        await supabase.rpc("log_permission_action", {
          p_action: "update",
          p_entity_type: "scope",
          p_entity_id: editingScope.id,
          p_details: { old: editingScope, new: formData },
        })

        toast({ title: "Sucesso", description: "Escopo atualizado com sucesso" })
      } else {
        // Create
        const { data, error } = await supabase.from("scopes").insert([formData]).select().single()

        if (error) throw error

        setScopes([...scopes, data])

        // Log audit
        await supabase.rpc("log_permission_action", {
          p_action: "create",
          p_entity_type: "scope",
          p_entity_id: data.id,
          p_details: formData,
        })

        toast({ title: "Sucesso", description: "Escopo criado com sucesso" })
      }

      setIsDialogOpen(false)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (scope: Scope) => {
    if (!confirm(`Tem certeza que deseja excluir o escopo "${scope.code}"?`)) return

    setLoading(true)
    try {
      const { error } = await supabase.from("scopes").delete().eq("id", scope.id)

      if (error) throw error

      setScopes(scopes.filter((s) => s.id !== scope.id))

      // Log audit
      await supabase.rpc("log_permission_action", {
        p_action: "delete",
        p_entity_type: "scope",
        p_entity_id: scope.id,
        p_details: scope,
      })

      toast({ title: "Sucesso", description: "Escopo excluído com sucesso" })
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>🔹 Escopos (Scopes)</CardTitle>
            </div>
            <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Novo Escopo</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Usado por</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopes.map((scope) => (
                <TableRow key={scope.id}>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">{scope.code}</code>
                  </TableCell>
                  <TableCell>{scope.description}</TableCell>
                  <TableCell>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                      {getRoleCount(scope.id)} papéis
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(scope)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(scope)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingScope ? "Editar Escopo" : "Novo Escopo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: leads:read"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Permite visualizar leads"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
