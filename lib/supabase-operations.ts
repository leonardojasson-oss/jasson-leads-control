import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão disponíveis
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("🔍 Verificando configuração Supabase:")
console.log("URL:", supabaseUrl ? "✅ Configurada" : "❌ Não encontrada")
console.log("Key:", supabaseAnonKey ? "✅ Configurada" : "❌ Não encontrada")

// Criar cliente Supabase apenas se as variáveis estiverem disponíveis
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export type Lead = {
  id: string
  nome_empresa: string
  produto_marketing?: string
  nicho: string
  data_hora_compra?: string
  valor_pago_lead?: number
  tipo_lead?: string
  faturamento?: string
  canal?: string
  nivel_urgencia?: string
  regiao?: string
  cidade?: string
  cnpj?: string
  nome_contato: string
  cargo_contato?: string
  email: string
  email_corporativo?: string
  telefone?: string
  sdr: string
  closer?: string
  arrematador?: string
  produto?: string
  anuncios?: string
  status: string
  observacoes?: string
  observacoes_closer?: string
  data_ultimo_contato?: string
  motivo_perda_pv?: string
  tem_comentario_lbf?: boolean
  investimento_trafego?: string
  ticket_medio?: string
  qtd_lojas?: string
  qtd_vendedores?: string
  conseguiu_contato?: boolean
  reuniao_agendada?: boolean
  reuniao_realizada?: boolean
  valor_proposta?: number
  valor_venda?: number
  data_venda?: string
  data_fechamento?: string
  data_assinatura?: string
  fee?: number
  escopo_fechado?: string
  fee_total?: number
  venda_via_jasson_co?: boolean
  comissao_sdr?: number
  comissao_closer?: number
  status_comissao?: string
  created_at?: string
  updated_at?: string
  row_version?: number
}

// Operações localStorage como fallback
const LOCAL_STORAGE_KEY = "jasson-leads-data-v2"

const localStorageOperations = {
  getAll(): Lead[] {
    if (typeof window === "undefined") return []
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  save(leads: Lead[]) {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads))
      // Backup adicional
      if (typeof window !== "undefined") {
        ;(window as any).jassonLeadsBackup = leads
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  },

  create(lead: Omit<Lead, "id" | "created_at" | "updated_at">): Lead {
    const newLead: Lead = {
      ...lead,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      row_version: 0,
    }

    const leads = this.getAll()
    leads.unshift(newLead)
    this.save(leads)
    return newLead
  },

  update(id: string, leadUpdate: Partial<Lead>): Lead | null {
    const leads = this.getAll()
    const index = leads.findIndex((lead) => lead.id === id)

    if (index === -1) return null

    leads[index] = {
      ...leads[index],
      ...leadUpdate,
      updated_at: new Date().toISOString(),
      row_version: (leads[index].row_version || 0) + 1,
    }

    this.save(leads)
    return leads[index]
  },

  delete(id: string): boolean {
    const leads = this.getAll()
    const filteredLeads = leads.filter((lead) => lead.id !== id)

    if (filteredLeads.length === leads.length) return false

    this.save(filteredLeads)
    return true
  },
}

// Função para limpar dados para Supabase
const cleanDataForSupabase = (data: any): any => {
  const cleaned: any = {}

  Object.keys(data).forEach((key) => {
    const value = data[key]

    // Converter strings vazias para null
    if (value === "" || value === undefined) {
      cleaned[key] = null
    }
    // Converter valores numéricos
    else if (key.includes("valor") || key.includes("fee") || key.includes("comissao")) {
      const numValue = Number.parseFloat(value)
      cleaned[key] = isNaN(numValue) ? null : numValue
    }
    // Manter outros valores
    else {
      cleaned[key] = value
    }
  })

  return cleaned
}

export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) {
    console.log("🔍 Supabase não configurado")
    return false
  }

  try {
    console.log("🔍 Testando conexão real com Supabase...")
    const { data, error } = await supabase.from("leads").select("id").limit(1)

    if (error) {
      console.error("❌ Erro na conexão Supabase:", error)
      return false
    }

    console.log("✅ Conexão Supabase funcionando!")
    return true
  } catch (error) {
    console.error("❌ Exceção ao testar Supabase:", error)
    return false
  }
}

// Operações principais
export const leadOperations = {
  async getAll(): Promise<Lead[]> {
    console.log("🔄 === CARREGANDO LEADS ===")

    if (!isSupabaseConfigured || !supabase) {
      console.log("📱 Usando localStorage (Supabase não configurado)")
      return localStorageOperations.getAll()
    }

    try {
      console.log("🌐 Tentando carregar do Supabase...")

      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erro Supabase:", error)
        console.log("📱 Fallback para localStorage")
        return localStorageOperations.getAll()
      }

      console.log("✅ Dados carregados do Supabase:", data?.length || 0, "leads")

      if (!data || data.length === 0) {
        const localData = localStorageOperations.getAll()
        if (localData.length > 0) {
          console.log("🔄 Encontrados", localData.length, "leads no localStorage, migrando para Supabase...")

          // Migrar dados do localStorage para Supabase
          for (const lead of localData) {
            try {
              const cleanedLead = cleanDataForSupabase(lead)
              await supabase.from("leads").insert([cleanedLead])
              console.log("✅ Lead migrado:", lead.nome_empresa)
            } catch (migrateError) {
              console.error("❌ Erro ao migrar lead:", lead.nome_empresa, migrateError)
            }
          }

          // Recarregar dados após migração
          const { data: migratedData } = await supabase
            .from("leads")
            .select("*")
            .order("created_at", { ascending: false })
          console.log("✅ Migração concluída, dados recarregados:", migratedData?.length || 0, "leads")
          return migratedData || []
        }
      }

      return data || []
    } catch (error) {
      console.error("❌ Falha no Supabase, usando localStorage:", error)
      return localStorageOperations.getAll()
    }
  },

  async create(lead: Omit<Lead, "id" | "created_at" | "updated_at">): Promise<Lead> {
    console.log("🔄 === CRIANDO LEAD ===")
    console.log("📝 Dados recebidos:", lead)

    // Sempre salvar no localStorage primeiro (garantia)
    const localResult = localStorageOperations.create(lead)
    console.log("✅ Lead salvo no localStorage:", localResult.id)

    // Tentar salvar no Supabase se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        console.log("🌐 Tentando salvar no Supabase...")

        // Limpar dados para Supabase
        const cleanedLead = cleanDataForSupabase(lead)
        console.log("🧹 Dados limpos para Supabase:", cleanedLead)

        const { data, error } = await supabase.from("leads").insert([cleanedLead]).select().single()

        if (error) {
          console.error("❌ Erro ao salvar no Supabase:", error)
          console.log("📱 Mas localStorage funcionou, continuando...")
        } else {
          console.log("✅ Lead também salvo no Supabase:", data.id)
          // Retornar dados do Supabase se deu certo
          return data
        }
      } catch (supabaseError) {
        console.error("❌ Exceção no Supabase:", supabaseError)
        console.log("📱 Mas localStorage funcionou, continuando...")
      }
    }

    return localResult
  },

  async update(id: string, lead: Partial<Lead>): Promise<Lead | null> {
    console.log("[v0] === ATUALIZANDO LEAD ===")
    console.log("[v0] ID:", id)
    console.log("[v0] Dados recebidos:", lead)

    const { row_version, ...leadUpdate } = lead
    const currentRowVersion = row_version || 0

    // Sempre atualizar localStorage primeiro
    const localResult = localStorageOperations.update(id, leadUpdate)
    console.log("[v0] Lead atualizado no localStorage")

    // Tentar atualizar no Supabase se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        console.log("[v0] Tentando atualizar no Supabase com controle de concorrência...")
        console.log("[v0] Row version atual:", currentRowVersion)

        const cleanedLead = {
          ...cleanDataForSupabase(leadUpdate),
          updated_at: new Date().toISOString(),
        }
        console.log("[v0] Dados limpos para Supabase:", cleanedLead)

        const { data, error, count } = await supabase
          .from("leads")
          .update(cleanedLead)
          .eq("id", id)
          .eq("row_version", currentRowVersion)
          .select()
          .single()

        if (error || !data) {
          console.log("[v0] ❌ Conflito de concorrência detectado ou erro:", error?.message)

          // Check if it's a concurrency conflict (no rows updated)
          if (count === 0 || error?.message?.includes("row_version")) {
            console.log("[v0] 🔄 Conflito de concorrência - lead foi modificado por outro usuário")
            throw new Error("Conflicting update - lead was modified by another user")
          }

          console.log("[v0] ❌ Erro na atualização:", error)
          return localResult
        }

        console.log("[v0] ✅ Lead atualizado no Supabase com controle de concorrência")
        return data
      } catch (supabaseError) {
        console.error("[v0] ❌ Exceção ao atualizar no Supabase:", supabaseError)

        // Re-throw concurrency errors to be handled by the UI
        if (supabaseError.message?.includes("Conflicting update")) {
          throw supabaseError
        }

        return localResult
      }
    } else {
      console.log("[v0] Supabase não configurado, usando apenas localStorage")
    }

    return localResult
  },

  async delete(id: string): Promise<boolean> {
    console.log("🔄 === DELETANDO LEAD ===")
    console.log("🆔 ID:", id)

    // Sempre deletar do localStorage primeiro
    const localResult = localStorageOperations.delete(id)
    console.log("✅ Lead deletado do localStorage")

    // Tentar deletar do Supabase se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        console.log("🌐 Tentando deletar do Supabase...")

        const { error } = await supabase.from("leads").delete().eq("id", id)

        if (error) {
          console.error("❌ Erro ao deletar do Supabase:", error)
        } else {
          console.log("✅ Lead também deletado do Supabase")
        }
      } catch (supabaseError) {
        console.error("❌ Exceção ao deletar do Supabase:", supabaseError)
      }
    }

    return localResult
  },
}
