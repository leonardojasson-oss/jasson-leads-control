"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "@/types/auth"

interface FirstAdminSetupClientProps {
  user: User
  profile: UserProfile | null
}

export function FirstAdminSetupClient({ user, profile }: FirstAdminSetupClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleMakeAdmin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the RPC function to make first admin
      const { data, error: rpcError } = await supabase.rpc("make_first_admin", {
        user_id: user.id,
      })

      if (rpcError) throw rpcError

      if (data && !data.success) {
        throw new Error(data.message || "Falha ao tornar-se administrador")
      }

      setSuccess(true)

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
            <CardDescription>Torne-se o primeiro administrador do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Você é o primeiro usuário do sistema. Clique no botão abaixo para se tornar administrador e ter acesso
                completo a todas as funcionalidades.
              </p>
            </div>

            {profile && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Nome:</span>
                  <span className="ml-2 text-gray-900">{profile.name}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">E-mail:</span>
                  <span className="ml-2 text-gray-900">{profile.email}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Papel atual:</span>
                  <span className="ml-2 text-gray-900">{profile.role}</span>
                </div>
              </div>
            )}

            {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}

            {success && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                Você agora é um administrador! Redirecionando...
              </div>
            )}

            <Button
              onClick={handleMakeAdmin}
              disabled={isLoading || success}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Processando..." : success ? "Sucesso!" : "Tornar-me Administrador"}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Esta opção só está disponível para o primeiro usuário. Depois que um administrador for criado, esta página
              não estará mais acessível.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
