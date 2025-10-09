import { requireAuth, hasAnyAdmin, getUserProfile } from "@/lib/auth"
import { FirstAdminSetupClient } from "@/components/setup/FirstAdminSetupClient"
import { redirect } from "next/navigation"

export default async function FirstAdminSetupPage() {
  // Require authentication
  const user = await requireAuth()

  // Check if any admin already exists
  const adminExists = await hasAnyAdmin()

  // If admin already exists, redirect to home
  if (adminExists) {
    redirect("/")
  }

  // Get current user profile
  const profile = await getUserProfile()

  return <FirstAdminSetupClient user={user} profile={profile} />
}
