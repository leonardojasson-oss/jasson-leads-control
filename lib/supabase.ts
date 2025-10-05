import { createClient } from "@supabase/supabase-js"

// Check if Supabase environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create Supabase client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export type Lead = {
  id: string
  nome_empresa: string
  produto_marketing?: string
  nicho: string
  data_hora_compra?: string
  horario_compra?: string
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
  tipo_oferta?: string
  produto?: string
  anuncios?: string
  status: string
  observacoes?: string
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
  data_assinatura?: string // Added data_assinatura field to support automatic sale marking
  fee?: number
  escopo_fechado?: string
  fee_total?: number
  venda_via_jasson_co?: boolean
  comissao_sdr?: number
  comissao_closer?: number
  status_comissao?: string
  created_at?: string
  updated_at?: string
}

// Simple and safe data cleaning
const cleanValue = (value: any): any => {
  if (value === "" || value === "undefined" || value === "null") {
    return null
  }
  return value
}

// Local storage operations
const LOCAL_STORAGE_KEY = "jasson-leads-data"

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

// Lead operations
export const leadOperations = {
  async getAll(): Promise<Lead[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageOperations.getAll()
    }

    try {
      const [inboundResult, prospeccaoResult] = await Promise.all([
        supabase.from("leads_inbound").select("*").order("created_at", { ascending: false }),
        supabase.from("leads_prospeccao_ativa").select("*").order("created_at", { ascending: false }),
      ])

      if (inboundResult.error) throw inboundResult.error
      if (prospeccaoResult.error) throw prospeccaoResult.error

      const allLeads = [...(inboundResult.data || []), ...(prospeccaoResult.data || [])]
      return allLeads.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
    } catch (error) {
      console.error("Supabase error, using localStorage:", error)
      return localStorageOperations.getAll()
    }
  },

  async create(lead: Omit<Lead, "id" | "created_at" | "updated_at">): Promise<Lead> {
    // Always try localStorage first to ensure it works
    try {
      const localResult = localStorageOperations.create(lead)
      console.log("✅ Lead saved to localStorage:", localResult.id)

      // Try Supabase in background if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const origem = (lead as any).tipo_lead || (lead as any).origem || ""
          const isProspeccaoAtiva = ["Outbound", "Indicação", "Recomendação", "Evento", "Networking"].includes(origem)
          const tableName = isProspeccaoAtiva ? "leads_prospeccao_ativa" : "leads_inbound"

          // Clean data for Supabase - convert empty strings to null for date fields
          const cleanedLead: any = {}
          const dateFields = [
            "data_hora_compra",
            "data_ultimo_contato",
            "data_venda",
            "data_fechamento",
            "data_assinatura",
          ]

          Object.keys(lead).forEach((key) => {
            const value = (lead as any)[key]

            // Convert empty strings to null for date fields
            if (dateFields.includes(key) && (value === "" || value === undefined)) {
              cleanedLead[key] = null
            } else if (value === "" || value === undefined) {
              cleanedLead[key] = null
            } else {
              cleanedLead[key] = value
            }
          })

          console.log("🧹 Cleaned data for Supabase:", cleanedLead)
          console.log(`📊 Salvando em: ${tableName}`)

          const { data, error } = await supabase.from(tableName).insert([cleanedLead]).select().single()

          if (error) {
            console.error("Supabase error (but localStorage worked):", error)
          } else {
            console.log(`✅ Lead also saved to Supabase (${tableName}):`, data.id)
          }
        } catch (supabaseError) {
          console.error("Supabase failed (but localStorage worked):", supabaseError)
        }
      }

      return localResult
    } catch (error) {
      console.error("Error saving lead:", error)
      throw new Error(`Failed to save lead: ${error.message}`)
    }
  },

  async update(id: string, lead: Partial<Lead>): Promise<Lead | null> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageOperations.update(id, lead)
    }

    try {
      const cleanedLead: any = {
        updated_at: new Date().toISOString(),
      }

      Object.keys(lead).forEach((key) => {
        cleanedLead[key] = cleanValue((lead as any)[key])
      })

      const [inboundResult, prospeccaoResult] = await Promise.all([
        supabase.from("leads_inbound").update(cleanedLead).eq("id", id).select().single(),
        supabase.from("leads_prospeccao_ativa").update(cleanedLead).eq("id", id).select().single(),
      ])

      // Retornar o resultado que teve sucesso
      if (inboundResult.data) return inboundResult.data
      if (prospeccaoResult.data) return prospeccaoResult.data

      // Se ambos falharam, lançar erro
      throw inboundResult.error || prospeccaoResult.error
    } catch (error) {
      console.error("Supabase error, using localStorage:", error)
      return localStorageOperations.update(id, lead)
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageOperations.delete(id)
    }

    try {
      const [inboundResult, prospeccaoResult] = await Promise.all([
        supabase.from("leads_inbound").delete().eq("id", id),
        supabase.from("leads_prospeccao_ativa").delete().eq("id", id),
      ])

      // Se pelo menos uma operação teve sucesso, retornar true
      if (!inboundResult.error || !prospeccaoResult.error) return true

      throw inboundResult.error || prospeccaoResult.error
    } catch (error) {
      console.error("Supabase error, using localStorage:", error)
      return localStorageOperations.delete(id)
    }
  },

  async getByStatus(status: string): Promise<Lead[]> {
    const allLeads = await this.getAll()
    return allLeads.filter((lead) => lead.status === status)
  },

  async getBySdr(sdr: string): Promise<Lead[]> {
    const allLeads = await this.getAll()
    return allLeads.filter((lead) => lead.sdr === sdr)
  },
}
