"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RolesSection } from "./permissions/RolesSection"
import { ScopesSection } from "./permissions/ScopesSection"
import { RoleScopeMatrixSection } from "./permissions/RoleScopeMatrixSection"
import { UserExceptionsSection } from "./permissions/UserExceptionsSection"
import { EffectiveScopesSection } from "./permissions/EffectiveScopesSection"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface Role {
  id: string
  name: string
  code: string
  created_at: string
}

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

interface UserScope {
  user_id: string
  scope_id: string
  allow: boolean
}

interface Profile {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  created_at: string
}

interface PermissoesClientProps {
  initialRoles: Role[]
  initialScopes: Scope[]
  initialRoleScopes: RoleScope[]
  initialUserScopes: UserScope[]
  initialProfiles: Profile[]
}

export function PermissoesClient({
  initialRoles,
  initialScopes,
  initialRoleScopes,
  initialUserScopes,
  initialProfiles,
}: PermissoesClientProps) {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [scopes, setScopes] = useState<Scope[]>(initialScopes)
  const [roleScopes, setRoleScopes] = useState<RoleScope[]>(initialRoleScopes)
  const [userScopes, setUserScopes] = useState<UserScope[]>(initialUserScopes)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">⚙️ Gestão de Permissões</h1>
            <p className="text-gray-600 mt-1">Controle as permissões de papéis e usuários do sistema.</p>
          </div>
        </div>

        {/* Seção 1 - Papéis */}
        <RolesSection roles={roles} setRoles={setRoles} roleScopes={roleScopes} scopes={scopes} />

        {/* Seção 2 - Escopos */}
        <ScopesSection scopes={scopes} setScopes={setScopes} roleScopes={roleScopes} roles={roles} />

        {/* Seção 3 - Matriz Role x Scope */}
        <RoleScopeMatrixSection roles={roles} scopes={scopes} roleScopes={roleScopes} setRoleScopes={setRoleScopes} />

        {/* Seção 4 - Exceções por Usuário */}
        <UserExceptionsSection
          profiles={initialProfiles}
          scopes={scopes}
          userScopes={userScopes}
          setUserScopes={setUserScopes}
          roleScopes={roleScopes}
          roles={roles}
        />

        {/* Seção 5 - Visualizar Escopos Efetivos */}
        <EffectiveScopesSection profiles={initialProfiles} />
      </div>
    </div>
  )
}
