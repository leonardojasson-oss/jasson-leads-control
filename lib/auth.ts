import { createClient as createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type UserRole = "ADMIN" | "GESTOR" | "SDR" | "CLOSER"

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  phone: string | null
  created_at: string
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get the current user's profile with role information
 * Returns null if not authenticated or profile not found
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getUser()
  if (!user) return null

  const supabase = await createServerClient()
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error || !profile) {
    return null
  }

  return profile as UserProfile
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole | UserRole[]): Promise<boolean> {
  const profile = await getUserProfile()
  if (!profile) return false

  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(profile.role)
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect("/auth/sign-in")
  }
  return user
}

/**
 * Require a specific role - redirects to login or home if not authorized
 */
export async function requireRole(role: UserRole | UserRole[]) {
  await requireAuth()

  const hasRequiredRole = await hasRole(role)
  if (!hasRequiredRole) {
    redirect("/") // Redirect to home if user doesn't have required role
  }

  return await getUserProfile()
}

/**
 * Check if any admin exists in the system
 */
export async function hasAnyAdmin(): Promise<boolean> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from("profiles").select("id").eq("role", "ADMIN").limit(1)

  if (error) return true // Assume admin exists on error to prevent unauthorized access

  return (data?.length ?? 0) > 0
}

/**
 * Make the current user an admin (only works if no admin exists)
 */
export async function makeFirstAdmin(userId: string): Promise<{ success: boolean; message: string }> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.rpc("make_first_admin", {
    user_id: userId,
  })

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  return data as { success: boolean; message: string }
}
