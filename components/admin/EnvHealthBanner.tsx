"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EnvHealthBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [envStatus, setEnvStatus] = useState<{
    allPresent: boolean
    missingVars: string[]
  }>({ allPresent: true, missingVars: [] })

  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const checkVisibility = async () => {
      // Never show in production
      if (process.env.NODE_ENV === "production") {
        setIsVisible(false)
        return
      }

      // In dev/preview, only show if ?debug=env=1 is present
      const debugEnv = searchParams.get("debug")
      if (debugEnv !== "env=1") {
        setIsVisible(false)
        return
      }

      // Check if banner was closed in this session
      const wasClosed = sessionStorage.getItem("envHealthBannerClosed")
      if (wasClosed === "true") {
        setIsVisible(false)
        return
      }

      // Check if user is ADMIN
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsVisible(false)
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (profile?.role !== "ADMIN") {
        setIsVisible(false)
        return
      }

      setIsAdmin(true)

      // Check environment variables
      const envVars = {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }

      const missingVars = Object.entries(envVars)
        .filter(([_, present]) => !present)
        .map(([name]) => name)

      setEnvStatus({
        allPresent: missingVars.length === 0,
        missingVars,
      })

      setIsVisible(true)
    }

    checkVisibility()
  }, [searchParams, supabase])

  const handleClose = () => {
    sessionStorage.setItem("envHealthBannerClosed", "true")
    setIsVisible(false)
  }

  if (!isVisible || !isAdmin) return null

  return (
    <Alert
      variant={envStatus.allPresent ? "default" : "destructive"}
      className={`border-l-4 ${envStatus.allPresent ? "border-l-green-500 bg-green-50 text-green-900" : "border-l-red-500"} relative`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {envStatus.allPresent ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className="text-sm font-medium">
            {envStatus.allPresent ? (
              "Variáveis de ambiente: OK"
            ) : (
              <>
                Variáveis de ambiente faltando: <span className="font-bold">{envStatus.missingVars.join(", ")}</span>
              </>
            )}
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-6 w-6 p-0 hover:bg-transparent"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}
