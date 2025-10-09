import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Desculpe, algo deu errado</CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Erro: {params.error}</p>
                  {params.error_description && (
                    <p className="text-sm text-muted-foreground">{params.error_description}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ocorreu um erro não especificado.</p>
              )}
              <Button asChild className="w-full mt-4">
                <Link href="/auth/sign-in">Voltar para login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
