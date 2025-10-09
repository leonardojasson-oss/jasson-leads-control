"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/types/auth"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log("[v0] AuthGuard: Verificando autenticação...")

        // Check if user is authenticated
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        console.log("[v0] AuthGuard: Usuário:", { user: user?.id, error: userError })

        if (userError || !user) {
          console.log("[v0] AuthGuard: Usuário não autenticado, redirecionando...")
          router.push("/auth/sign-in")
          return
        }

        // If no role required, user is authorized
        if (!requiredRole) {
          console.log("[v0] AuthGuard: Nenhum role requerido, autorizando...")
          setIsAuthorized(true)
          setIsLoading(false)
          return
        }

        // Check user's role
        console.log("[v0] AuthGuard: Verificando role do usuário...")
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        console.log("[v0] AuthGuard: Perfil:", { profile, error: profileError })

        if (profileError || !profile) {
          console.log("[v0] AuthGuard: Perfil não encontrado, redirecionando...")
          router.push("/auth/sign-in")
          return
        }

        // Check if user has required role
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
        const hasRequiredRole = roles.includes(profile.role as UserRole)

        console.log("[v0] AuthGuard: Verificação de role:", {
          userRole: profile.role,
          requiredRoles: roles,
          hasAccess: hasRequiredRole,
        })

        if (!hasRequiredRole) {
          console.log("[v0] AuthGuard: Role insuficiente, redirecionando...")
          router.push("/") // Redirect to home if unauthorized
          return
        }

        console.log("[v0] AuthGuard: Autorizado!")
        setIsAuthorized(true)
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        router.push("/auth/sign-in")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole, supabase])

  if (isLoading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      )
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
