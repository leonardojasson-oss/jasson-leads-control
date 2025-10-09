"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Eye } from "lucide-react"

interface Profile {
  id: string
  name: string
  email: string
  role: string
}

interface EffectiveScope {
  scope_code: string
  scope_description: string
  source: string
}

interface EffectiveScopesSectionProps {
  profiles: Profile[]
}

export function EffectiveScopesSection({ profiles }: EffectiveScopesSectionProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [effectiveScopes, setEffectiveScopes] = useState<EffectiveScope[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleViewScopes = async () => {
    if (!selectedUserId) return

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc("get_user_effective_scopes", {
        target_user_id: selectedUserId,
      })

      if (error) throw error

      setEffectiveScopes(data || [])
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const selectedUser = profiles.find((p) => p.id === selectedUserId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔹 Visualizar Escopos Efetivos</CardTitle>
        <CardDescription>Veja todos os escopos resultantes para um usuário específico</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name} ({profile.email}) - {profile.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleViewScopes} disabled={!selectedUserId || loading} className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              {loading ? "Carregando..." : "Visualizar"}
            </Button>
          </div>

          {effectiveScopes.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="mb-3">
                <h3 className="font-medium text-sm">
                  Escopos de {selectedUser?.name} ({effectiveScopes.length} total)
                </h3>
              </div>
              <div className="space-y-2">
                {effectiveScopes.map((scope, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{scope.scope_code}</div>
                      <div className="text-xs text-gray-500">{scope.scope_description}</div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        scope.source === "role" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {scope.source === "role" ? "Papel" : "Exceção"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
