import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { PermissoesClient } from "@/components/admin/PermissoesClient"

export default async function PermissoesPage() {
  // Require ADMIN role to access this page
  await requireRole("ADMIN")

  const supabase = await createClient()

  // Fetch all data in parallel
  const [rolesResult, scopesResult, roleScopesResult, userScopesResult, profilesResult] = await Promise.all([
    supabase.from("roles").select("*").order("name"),
    supabase.from("scopes").select("*").order("code"),
    supabase.from("role_scopes").select("*"),
    supabase.from("user_scopes").select("*"),
    supabase.from("profiles").select("*").order("name"),
  ])

  return (
    <PermissoesClient
      initialRoles={rolesResult.data || []}
      initialScopes={scopesResult.data || []}
      initialRoleScopes={roleScopesResult.data || []}
      initialUserScopes={userScopesResult.data || []}
      initialProfiles={profilesResult.data || []}
    />
  )
}
