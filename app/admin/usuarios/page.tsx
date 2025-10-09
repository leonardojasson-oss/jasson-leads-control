import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { UserManagementClient } from "@/components/admin/UserManagementClient"

export default async function UsersPage() {
  // Require ADMIN role to access this page
  await requireRole("ADMIN")

  // Fetch all users
  const supabase = await createClient()
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching profiles:", error)
  }

  return <UserManagementClient initialProfiles={profiles || []} />
}
