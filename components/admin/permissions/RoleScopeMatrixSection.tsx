"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Role {
  id: string
  name: string
  code: string
}

interface Scope {
  id: string
  code: string
  description: string
}

interface RoleScope {
  role_id: string
  scope_id: string
}

interface RoleScopeMatrixSectionProps {
  roles: Role[]
  scopes: Scope[]
  roleScopes: RoleScope[]
  setRoleScopes: (roleScopes: RoleScope[]) => void
}

export function RoleScopeMatrixSection({ roles, scopes, roleScopes, setRoleScopes }: RoleScopeMatrixSectionProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const hasScope = (roleId: string, scopeId: string) => {
    return roleScopes.some((rs) => rs.role_id === roleId && rs.scope_id === scopeId)
  }

  const handleToggle = async (roleId: string, scopeId: string, currentValue: boolean) => {
    const key = `${roleId}-${scopeId}`
    setLoading(key)

    try {
      if (currentValue) {
        // Remove scope from role
        const { error } = await supabase.from("role_scopes").delete().eq("role_id", roleId).eq("scope_id", scopeId)

        if (error) throw error

        setRoleScopes(roleScopes.filter((rs) => !(rs.role_id === roleId && rs.scope_id === scopeId)))

        // Log audit
        await supabase.rpc("log_permission_action", {
          p_action: "revoke",
          p_entity_type: "role_scope",
          p_entity_id: null,
          p_details: { role_id: roleId, scope_id: scopeId },
        })
      } else {
        // Add scope to role
        const { error } = await supabase.from("role_scopes").insert([{ role_id: roleId, scope_id: scopeId }])

        if (error) throw error

        setRoleScopes([...roleScopes, { role_id: roleId, scope_id: scopeId }])

        // Log audit
        await supabase.rpc("log_permission_action", {
          p_action: "grant",
          p_entity_type: "role_scope",
          p_entity_id: null,
          p_details: { role_id: roleId, scope_id: scopeId },
        })
      }

      toast({ title: "Sucesso", description: "Permissão atualizada" })
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔹 Matriz Role x Scope</CardTitle>
        <CardDescription>Clique nos toggles para atribuir ou remover escopos dos papéis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 p-3 text-left font-medium">Papel / Escopo</th>
                {scopes.map((scope) => (
                  <th key={scope.id} className="border border-gray-300 bg-gray-100 p-3 text-center min-w-[120px]">
                    <div className="text-xs font-medium">{scope.code}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="border border-gray-300 bg-gray-50 p-3 font-medium">{role.name}</td>
                  {scopes.map((scope) => {
                    const checked = hasScope(role.id, scope.id)
                    const key = `${role.id}-${scope.id}`
                    const isLoading = loading === key

                    return (
                      <td key={scope.id} className="border border-gray-300 p-3 text-center">
                        <Switch
                          checked={checked}
                          onCheckedChange={() => handleToggle(role.id, scope.id, checked)}
                          disabled={isLoading}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
