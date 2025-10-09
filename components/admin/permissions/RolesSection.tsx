"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Role {
  id: string
  name: string
  code: string
  created_at: string
}

interface RoleScope {
  role_id: string
  scope_id: string
}

interface Scope {
  id: string
  code: string
  description: string
}

interface RolesSectionProps {
  roles: Role[]
  setRoles: (roles: Role[]) => void
  roleScopes: RoleScope[]
  scopes: Scope[]
}

export function RolesSection({ roles, setRoles, roleScopes, scopes }: RolesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({ name: "", code: "" })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const getScopeCount = (roleId: string) => {
    return roleScopes.filter((rs) => rs.role_id === roleId).length
  }

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({ name: role.name, code: role.code })
    } else {
      setEditingRole(null)
      setFormData({ name: "", code: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      if (editingRole) {
        // Update
        const { error } = await supabase.from("roles").update(formData).eq("id", editingRole.id)

        if (error) throw error

        setRoles(roles.map((r) => (r.id === editingRole.id ? { ...r, ...formData } : r)))

        // Log audit
        await supabase.rpc("log_permission_action", {
          p_action: "update",
          p_entity_type: "role",
          p_entity_id: editingRole.id,
          p_details: { old: editingRole, new: formData },
        })

        toast({ title: "Sucesso", description: "Papel atualizado com sucesso" })
      } else {
        // Create
        const { data, error } = await supabase.from("roles").insert([formData]).select().single()

        if (error) throw error

        setRoles([...roles, data])

        // Log audit
        await supabase.rpc("log_permission_action", {
          p_action: "create",
          p_entity_type: "role",
          p_entity_id: data.id,
          p_details: formData,
        })

        toast({ title: "Sucesso", description: "Papel criado com sucesso" })
      }

      setIsDialogOpen(false)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (role: Role) => {
    if (!confirm(`Tem certeza que deseja excluir o papel "${role.name}"?`)) return

    setLoading(true)
    try {
      const { error } = await supabase.from("roles").delete().eq("id", role.id)

      if (error) throw error

      setRoles(roles.filter((r) => r.id !== role.id))

      // Log audit
      await supabase.rpc("log_permission_action", {
        p_action: "delete",
        p_entity_type: "role",
        p_entity_id: role.id,
        p_details: role,
      })

      toast({ title: "Sucesso", description: "Papel excluído com sucesso" })
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
              <CardTitle>🔹 Papéis (Roles)</CardTitle>
            </div>
            <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Novo Papel</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Escopos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{role.code}</code>
                  </TableCell>
                  <TableCell>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {getScopeCount(role.id)} escopos
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(role)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(role)}>
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
            <DialogTitle>{editingRole ? "Editar Papel" : "Novo Papel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Administrador"
              />
            </div>
            <div>
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: ADMIN"
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
