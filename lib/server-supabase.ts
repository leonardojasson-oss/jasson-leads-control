import { createClient } from "@supabase/supabase-js"

// Use as variáveis de ambiente do servidor para a chave de serviço
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL // A URL pública ainda é usada
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Chave de serviço

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Variáveis de ambiente Supabase (URL ou Service Role Key) não configuradas para o servidor.")
  // Em um ambiente de produção, você pode querer lançar um erro ou ter um fallback mais robusto.
  // Para desenvolvimento, vamos permitir que continue, mas as operações de DB falharão.
}

// Crie o cliente Supabase para o lado do servidor
export const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false, // Não persistir sessão no servidor
      },
    })
  : null

export const isServerSupabaseConfigured = !!(supabaseUrl && supabaseServiceRoleKey)
