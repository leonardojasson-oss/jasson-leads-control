export type UserRole = "ADMIN" | "GESTOR" | "SDR" | "CLOSER"

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  phone: string | null
  created_at: string
}

export interface Lead {
  id: string
  created_by?: string
  assigned_to?: string
  // ... other lead fields
}
