import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient() // Adicionado await para createClient() pois é uma função async
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, message: "Não autenticado" }, { status: 401 })
    }

    // Check if user is ADMIN
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, message: "Acesso negado. Apenas ADMIN pode excluir usuários." },
        { status: 403 },
      )
    }

    // Get user ID to delete from request body
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ ok: false, message: "ID do usuário não fornecido" }, { status: 400 })
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({ ok: false, message: "Você não pode excluir a si mesmo" }, { status: 400 })
    }

    // Create admin client with service role key
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Delete from profiles table
    const { error: profileDeleteError } = await supabaseAdmin.from("profiles").delete().eq("id", userId)

    if (profileDeleteError) {
      console.error("Error deleting profile:", profileDeleteError)
      return NextResponse.json({ ok: false, message: "Erro ao excluir perfil do usuário" }, { status: 500 })
    }

    // Delete from auth.users table
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError)
      return NextResponse.json({ ok: false, message: "Erro ao excluir usuário da autenticação" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: "Usuário excluído com sucesso" })
  } catch (error) {
    console.error("Error in delete user API:", error)
    return NextResponse.json({ ok: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
