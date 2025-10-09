import { createClient } from "@/lib/supabase/server"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export async function EnvHealthBanner() {
  // Check environment variables presence
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const missingVars = Object.entries(envVars)
    .filter(([_, present]) => !present)
    .map(([name]) => name)

  const allPresent = missingVars.length === 0

  // Check if user is ADMIN
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "ADMIN") return null

  // Render banner only for ADMIN
  return (
    <Alert
      variant={allPresent ? "default" : "destructive"}
      className={`border-l-4 ${allPresent ? "border-l-green-500 bg-green-50 text-green-900" : "border-l-red-500"}`}
    >
      <div className="flex items-center gap-2">
        {allPresent ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
        <AlertDescription className="text-sm font-medium">
          {allPresent ? (
            "Variáveis de ambiente: OK"
          ) : (
            <>
              Variáveis de ambiente faltando: <span className="font-bold">{missingVars.join(", ")}</span>
            </>
          )}
        </AlertDescription>
      </div>
    </Alert>
  )
}
