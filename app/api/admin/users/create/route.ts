import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { email, password, name, phone, role } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { ok: false, message: "Campos obrigatórios ausentes: email, password, name, role" },
        { status: 400 },
      )
    }

    // Validate role
    const validRoles = ["ADMIN", "GESTOR", "SDR", "CLOSER"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { ok: false, message: "Papel inválido. Use: ADMIN, GESTOR, SDR ou CLOSER" },
        { status: 400 },
      )
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create user in Supabase Auth with email already confirmed
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone: phone || null,
      },
    })

    if (authError) {
      console.error("Error creating user in auth:", authError)
      return NextResponse.json({ ok: false, message: `Erro ao criar usuário: ${authError.message}` }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ ok: false, message: "Usuário não foi criado" }, { status: 500 })
    }

    // Create or update profile in public.profiles
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: authData.user.id,
        email,
        name,
        phone: phone || null,
        role,
      },
      {
        onConflict: "id",
      },
    )

    if (profileError) {
      console.error("Error creating profile:", profileError)
      // Try to delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ ok: false, message: `Erro ao criar perfil: ${profileError.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: authData.user.id }, { status: 200 })
  } catch (error) {
    console.error("Unexpected error in create user API:", error)
    return NextResponse.json({ ok: false, message: "Erro inesperado ao criar usuário" }, { status: 500 })
  }
}
