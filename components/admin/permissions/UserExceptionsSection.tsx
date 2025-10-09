"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  name: string
  email: string
  role: string
}

interface Scope {
  id: string
  code: string
  description: string
}

interface UserScope {
  user_id: string
  scope_id: string
  allow: boolean
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

interface UserExceptionsSectionProps {
  profiles: Profile[]
  scopes: Scope[]
  userScopes: UserScope[]
  setUserScopes: (userScopes: UserScope[]) => void
  roleScopes: RoleScope[]
  roles: Role[]
}

export function UserExceptionsSection({
  profiles,
  scopes,
  userScopes,
  setUserScopes,
  roleScopes,
  roles,
}: UserExceptionsSectionProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const selectedUser = profiles.find((p) => p.id === selectedUserId)

  const getUserScopeStatus = (scopeId: string): "inherited" | "granted" | "revoked" | null => {
    const userScope = userScopes.find((us) => us.user_id === selectedUserId && us.scope_id === scopeId)

    if (userScope) {
      return userScope.allow ? "granted" : "revoked"
    }

    // Check if inherited from role
    if (selectedUser) {
      const userRole = roles.find((r) => r.code === selectedUser.role)
      if (userRole) {
        const hasRoleScope = roleScopes.some((rs) => rs.role_id === userRole.id && rs.scope_id === scopeId)
        if (hasRoleScope) {
          return "inherited"
        }
      }
    }

    return null
  }

  const handleToggle = async (scopeId: string) => {
    if (!selectedUserId) return

    const key = `${selectedUserId}-${scopeId}`
    setLoading(key)

    try {
      const currentStatus = getUserScopeStatus(scopeId)
      const existingUserScope = userScopes.find((us) => us.user_id === selectedUserId && us.scope_id === scopeId)

      if (currentStatus === "inherited") {
        // Revoke inherited scope
        const { error } = await supabase
          .from("user_scopes")
          .insert([{ user_id: selectedUserId, scope_id: scopeId, allow: false }])

        if (error) throw error

        setUserScopes([...userScopes, { user_id: selectedUserId, scope_id: scopeId, allow: false }])

        await supabase.rpc("log_permission_action", {
          p_action: "revoke",
          p_entity_type: "user_scope",
          p_entity_id: null,
          p_details: { user_id: selectedUserId, scope_id: scopeId },
        })
      } else if (currentStatus === "revoked") {
        // Remove revocation (back to inherited or null)
        const { error } = await supabase
          .from("user_scopes")
          .delete()
          .eq("user_id", selectedUserId)
          .eq("scope_id", scopeId)

        if (error) throw error

        setUserScopes(userScopes.filter((us) => !(us.user_id === selectedUserId && us.scope_id === scopeId)))

        await supabase.rpc("log_permission_action", {
          p_action: "update",
          p_entity_type: "user_scope",
          p_entity_id: null,
          p_details: { user_id: selectedUserId, scope_id: scopeId, action: "remove_revocation" },
        })
      } else if (currentStatus === "granted") {
        // Remove grant
        const { error } = await supabase
          .from("user_scopes")
          .delete()
          .eq("user_id", selectedUserId)
          .eq("scope_id", scopeId)

        if (error) throw error

        setUserScopes(userScopes.filter((us) => !(us.user_id === selectedUserId && us.scope_id === scopeId)))

        await supabase.rpc("log_permission_action", {
          p_action: "update",
          p_entity_type: "user_scope",
          p_entity_id: null,
          p_details: { user_id: selectedUserId, scope_id: scopeId, action: "remove_grant" },
        })
      } else {
        // Grant new scope
        const { error } = await supabase
          .from("user_scopes")
          .insert([{ user_id: selectedUserId, scope_id: scopeId, allow: true }])

        if (error) throw error

        setUserScopes([...userScopes, { user_id: selectedUserId, scope_id: scopeId, allow: true }])

        await supabase.rpc("log_permission_action", {
          p_action: "grant",
          p_entity_type: "user_scope",
          p_entity_id: null,
          p_details: { user_id: selectedUserId, scope_id: scopeId },
        })
      }

      toast({ title: "Sucesso", description: "Exceção atualizada" })
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔹 Exceções por Usuário</CardTitle>
        <CardDescription>Conceda ou revogue escopos específicos para usuários individuais</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Selecionar Usuário</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um usuário" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name} ({profile.email}) - {profile.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUserId && (
            <div className="border rounded-lg p-4 space-y-3">
              {scopes.map((scope) => {
                const status = getUserScopeStatus(scope.id)
                const key = `${selectedUserId}-${scope.id}`
                const isLoading = loading === key

                let bgColor = "bg-gray-50"
                let textColor = "text-gray-700"
                let statusLabel = "Sem acesso"

                if (status === "inherited") {
                  bgColor = "bg-gray-100"
                  textColor = "text-gray-600"
                  statusLabel = "Herdado"
                } else if (status === "granted") {
                  bgColor = "bg-green-50"
                  textColor = "text-green-700"
                  statusLabel = "Garantido"
                } else if (status === "revoked") {
                  bgColor = "bg-red-50"
                  textColor = "text-red-700"
                  statusLabel = "Revogado"
                }

                return (
                  <div key={scope.id} className={`flex items-center justify-between p-3 rounded ${bgColor}`}>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{scope.code}</div>
                      <div className="text-xs text-gray-500">{scope.description}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-medium ${textColor}`}>{statusLabel}</span>
                      <Switch
                        checked={status === "inherited" || status === "granted"}
                        onCheckedChange={() => handleToggle(scope.id)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
