"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InviteUserDialog } from "@/components/admin/InviteUserDialog"
import { CreateUserDialog } from "@/components/admin/CreateUserDialog"
import type { UserProfile, UserRole } from "@/types/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserManagementClientProps {
  initialProfiles: UserProfile[]
}

export function UserManagementClient({ initialProfiles }: UserManagementClientProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [supabase])

  const roleLabels: Record<UserRole, string> = {
    ADMIN: "Administrador",
    GESTOR: "Gestor",
    SDR: "SDR",
    CLOSER: "Closer",
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setIsLoading(true)

      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

      if (error) throw error

      setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)))
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Erro ao atualizar papel do usuário")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (profile: UserProfile) => {
    setUserToDelete(profile)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)

      const response = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      })

      const data = await response.json()

      if (data.ok) {
        setProfiles((prev) => prev.filter((p) => p.id !== userToDelete.id))
        toast({
          title: "Sucesso",
          description: "Usuário excluído com sucesso",
        })
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao excluir usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleInviteSuccess = async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setProfiles(data as UserProfile[])
    }
  }

  const handleCreateSuccess = async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setProfiles(data as UserProfile[])
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
            <p className="text-gray-600 mt-1">Convide e gerencie usuários do sistema</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              ➕ Criar Usuário Manualmente
            </Button>
            <Button onClick={() => setIsInviteDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
              Convidar Usuário
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários ({profiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Select
                        value={profile.role}
                        onValueChange={(value) => handleRoleChange(profile.id, value as UserRole)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                          <SelectItem value="GESTOR">Gestor</SelectItem>
                          <SelectItem value="SDR">SDR</SelectItem>
                          <SelectItem value="CLOSER">Closer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{profile.phone || "—"}</TableCell>
                    <TableCell>{formatDate(profile.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(profile)}
                        disabled={profile.id === currentUserId}
                        className="border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <InviteUserDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        onSuccess={handleInviteSuccess}
      />

      <CreateUserDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir usuário?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong> (
              <strong>{userToDelete?.email}</strong>)? Essa ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
