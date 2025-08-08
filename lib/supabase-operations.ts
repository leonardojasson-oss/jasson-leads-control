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

// --- Tipo Lead para a UI (Flattened) ---
export type Lead = {
  id: number | string
  nome_empresa: string
  nome_fantazia?: string
  produto_marketing?: string
  nicho: string
  data_compra?: string
  horario_compra?: string
  valor_venda?: number
  venda?: boolean
  tipo_lead?: string
  faturamento?: string
  canal?: string
  nivel_urgencia?: string
  regiao?: string
  cidade?: string
  nome_contato: string
  cargo_contato?: string
  email: string
  email_corporativo?: boolean
  sdr?: string
  closer?: string
  arrematador?: string
  anuncios?: boolean
  status: string
  observacoes?: string
  data_ultimo_contato?: string
  cs?: boolean
  rm?: boolean
  rr?: boolean
  ns?: boolean
  data_marcacao?: string
  data_reuniao?: string
  data_assinatura?: string
  fee?: number
  escopo_fechado_valor?: number
  fee_total?: number
  created_at?: string
  updated_at?: string
}

// --- Cache para tabelas de lookup (ID <-> Nome) ---
type LookupMap = { [key: number]: string }
type ReverseLookupMap = { [key: string]: number }

interface LookupCache {
  status: { map: LookupMap; reverse: ReverseLookupMap }
  segmento: { map: LookupMap; reverse: ReverseLookupMap }
  origem: { map: LookupMap; reverse: ReverseLookupMap }
  canal: { map: LookupMap; reverse: ReverseLookupMap }
  urgencia: { map: LookupMap; reverse: ReverseLookupMap }
  faturamento: { map: LookupMap; reverse: ReverseLookupMap }
  cargo_contato: { map: LookupMap; reverse: ReverseLookupMap }
  produto: { map: LookupMap; reverse: ReverseLookupMap }
  anuncios_lookup: { map: LookupMap; reverse: ReverseLookupMap }
  regiao: { map: LookupMap; reverse: ReverseLookupMap }
  cidade: { map: LookupMap; reverse: ReverseLookupMap }
  vendedor: { map: LookupMap; reverse: ReverseLookupMap }
  papel: { map: LookupMap; reverse: ReverseLookupMap }
}

let _lookupCache: LookupCache | null = null

export async function fetchLookups() {
  if (_lookupCache) return _lookupCache
  if (!supabase) {
    throw new Error("Supabase client not initialized for lookups.")
  }

  const tables = [
    "status",
    "segmento",
    "origem",
    "canal",
    "urgencia",
    "faturamento",
    "cargo_contato",
    "produto",
    "regiao",
    "cidade",
    "vendedor",
    "papel",
  ] as const

  const cache: any = {}

  for (const table of tables) {
    const selectColumns = table === "faturamento" ? "id, valor" : "id, nome"
    const { data, error } = await supabase.from(table).select(selectColumns)
    if (error) {
      console.error(`Error fetching ${table} lookup:`, error)
      continue
    }
    const map: LookupMap = {}
    const reverse: ReverseLookupMap = {}

    data.forEach((item: any) => {
      const name = table === "faturamento" ? item.valor : item.nome
      if (name) {
        map[item.id] = name
        reverse[name] = item.id
      }
    })

    cache[table] = { map, reverse }
  }

  // Campo booleano, mantemos placeholder
  cache.anuncios_lookup = { map: {}, reverse: {} }

  _lookupCache = cache as LookupCache
  return _lookupCache
}

// Local storage operations (fallback)
const LOCAL_STORAGE_KEY = "jasson-leads-data-v3"

function isLocalId(id: string | number) {
  return typeof id === "string" && id.startsWith("local_")
}

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
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

// Helpers de lookup
async function getIdFromName(tableName: keyof LookupCache, name: string) {
  if (!name) return null
  const cache = await fetchLookups()
  const id = cache[tableName]?.reverse[name]
  if (id === undefined) {
    console.warn(`ID for '${name}' not found in '${tableName}' lookup.`)
    return null
  }
  return id
}

async function getNameFromId(tableName: keyof LookupCache, id: number | null) {
  if (id === null || id === undefined) return undefined
  const cache = await fetchLookups()
  return cache[tableName]?.map[id]
}

// Main operations
export const leadOperations = {
  async getAll() {
    console.log("🔄 === CARREGANDO LEADS (NOVA ESTRUTURA) ===")

    if (!isSupabaseConfigured || !supabase) {
      console.log("📱 Usando localStorage (Supabase não configurado)")
      return localStorageOperations.getAll()
    }

    try {
      console.log("🌐 Tentando carregar do Supabase...")
      const cache = await fetchLookups()

      // Fetch main lead data
      const { data: leadsData, error: leadError } = await supabase
        .from("lead")
        .select("*")
        .order("created_at", { ascending: false })

      if (leadError) throw leadError

      // Fetch related data
      const { data: contatosData, error: contatosError } = await supabase.from("contato").select("*")
      if (contatosError) throw contatosError

      const { data: comentariosData, error: comentariosError } = await supabase.from("comentario").select("*")
      if (comentariosError) throw comentariosError

      const { data: vendedorLeadData, error: vendedorLeadError } = await supabase.from("vendedor_lead").select("*")
      if (vendedorLeadError) throw vendedorLeadError

      const { data: leadProdutoData, error: leadProdutoError } = await supabase.from("lead_produto").select("*")
      if (leadProdutoError) throw leadProdutoError

      // Maps simples (objetos) para acesso O(1)
      const contatosMap: { [key: number]: any } = {}
      ;(contatosData || []).forEach((c: any) => (contatosMap[c.id] = c))

      const comentariosMap: { [key: string]: any } = {}
      ;(comentariosData || []).forEach((c: any) => (comentariosMap[c.id_cliente] = c))

      const vendedorLeadMap: { [key: string]: Array<{ vendedor_id: number; papel_id: number }> } = {}
      ;(vendedorLeadData || []).forEach((vl: any) => {
        const key = String(vl.id_lead)
        if (!vendedorLeadMap[key]) vendedorLeadMap[key] = []
        vendedorLeadMap[key].push({ vendedor_id: vl.id_vendedor, papel_id: vl.id_papel })
      })

      const leadProdutoMap: { [key: string]: number[] } = {}
      ;(leadProdutoData || []).forEach((lp: any) => {
        const key = String(lp.id_lead)
        if (!leadProdutoMap[key]) leadProdutoMap[key] = []
        leadProdutoMap[key].push(lp.id_produto)
      })

      const transformedLeads: Lead[] = []

      for (const l of leadsData || []) {
        const contato = contatosMap[l.id_contato]
        const comentario = comentariosMap[l.id]
        const vendedores = vendedorLeadMap[String(l.id)] || []
        const produtos = leadProdutoMap[String(l.id)] || []

        const sdr = vendedores.find((v) => (cache.papel.map[v.papel_id] || "").toLowerCase() === "sdr")
        const closer = vendedores.find((v) => (cache.papel.map[v.papel_id] || "").toLowerCase() === "closer")
        const arrematador = vendedores.find((v) => (cache.papel.map[v.papel_id] || "").toLowerCase() === "arrematador")
        const produtoMarketingId = produtos.length > 0 ? produtos[0] : null

        transformedLeads.push({
          id: l.id,
          nome_empresa: l.razao_social || l.nome_fantazia || "Empresa Desconhecida",
          nome_fantazia: l.nome_fantazia,
          produto_marketing: await getNameFromId("produto", produtoMarketingId),
          nicho: await getNameFromId("segmento", l.id_segmento),
          data_compra: l.data_compra,
          horario_compra: l.horario_compra,
          valor_venda: l.valor,
          venda: l.venda,
          tipo_lead: await getNameFromId("origem", l.id_origem),
          faturamento: await getNameFromId("faturamento", l.id_faturamento),
          canal: await getNameFromId("canal", l.id_canal),
          nivel_urgencia: await getNameFromId("urgencia", l.id_urgencia),
          cidade: await getNameFromId("cidade", l.id_cidade),
          // Se precisar da região, podemos ampliar o cache de cidade para incluir id_regiao.
          regiao: undefined,
          nome_contato: contato?.nome || "Contato Desconhecido",
          cargo_contato: await getNameFromId("cargo_contato", contato?.id_cargo_contato || null),
          email: contato?.email || "email@desconhecido.com",
          email_corporativo: contato?.email_comporativo,
          sdr: sdr ? await getNameFromId("vendedor", sdr.vendedor_id) : undefined,
          closer: closer ? await getNameFromId("vendedor", closer.vendedor_id) : undefined,
          arrematador: arrematador ? await getNameFromId("vendedor", arrematador.vendedor_id) : undefined,
          anuncios: l.is_anuncio,
          status: (await getNameFromId("status", l.id_status)) || "BACKLOG",
          observacoes: comentario?.comentario,
          data_ultimo_contato: l.data_ultimo_contato,
          cs: l.cs,
          rm: l.rm,
          rr: l.rr,
          ns: l.ns,
          data_marcacao: l.data_marcacao,
          data_reuniao: l.data_reuniao,
          data_assinatura: l.data_assinatura,
          fee: l.fee,
          escopo_fechado_valor: l.escopo_fechado,
          fee_total: l.fee_total,
          created_at: l.created_at,
          updated_at: l.updated_at,
        })
      }

      console.log("✅ Dados carregados do Supabase:", transformedLeads.length, "leads")
      return transformedLeads
    } catch (error) {
      console.error("❌ Falha no Supabase, usando localStorage:", error)
      return localStorageOperations.getAll()
    }
  },

  async create(lead: Omit<Lead, "id" | "created_at" | "updated_at">) {
    console.log("🔄 === CRIANDO LEAD (NOVA ESTRUTURA) ===")
    console.log("📝 Dados recebidos:", lead)

    // Sempre salvar no localStorage
    const localResult = localStorageOperations.create(lead)
    console.log("✅ Lead salvo no localStorage:", localResult.id)

    if (!isSupabaseConfigured || !supabase) {
      return localResult
    }

    try {
      console.log("🌐 Tentando salvar no Supabase...")
      await fetchLookups()

      // 1. contato
      const { data: newContato, error: contatoError } = await supabase
        .from("contato")
        .insert({
          nome: lead.nome_contato,
          email: lead.email,
          id_cargo_contato: await getIdFromName("cargo_contato", lead.cargo_contato || ""),
          email_comporativo: lead.email_corporativo,
        })
        .select("id")
        .single()

      if (contatoError) throw contatoError
      const id_contato = newContato.id
      console.log("✅ Contato criado:", id_contato)

      // 2. lead
      const { data: newLead, error: leadInsertError } = await supabase
        .from("lead")
        .insert({
          razao_social: lead.nome_empresa,
          nome_fantazia: lead.nome_fantazia,
          id_contato: id_contato,
          id_segmento: await getIdFromName("segmento", lead.nicho),
          data_compra: lead.data_compra,
          horario_compra: lead.horario_compra,
          valor: lead.valor_venda,
          venda: lead.venda,
          id_origem: await getIdFromName("origem", lead.tipo_lead || ""),
          id_faturamento: await getIdFromName("faturamento", lead.faturamento || ""),
          id_canal: await getIdFromName("canal", lead.canal || ""),
          id_urgencia: await getIdFromName("urgencia", lead.nivel_urgencia || ""),
          id_cidade: await getIdFromName("cidade", lead.cidade || ""),
          is_anuncio: lead.anuncios,
          id_status: await getIdFromName("status", lead.status),
          data_ultimo_contato: lead.data_ultimo_contato,
          cs: lead.cs,
          rm: lead.rm,
          rr: lead.rr,
          ns: lead.ns,
          data_marcacao: lead.data_marcacao,
          data_reuniao: lead.data_reuniao,
          data_assinatura: lead.data_assinatura,
          fee: lead.fee,
          escopo_fechado: lead.escopo_fechado_valor,
          fee_total: lead.fee_total,
        })
        .select("id")
        .single()

      if (leadInsertError) throw leadInsertError
      const lead_id = newLead.id
      console.log("✅ Lead principal criado:", lead_id)

      // 3. comentário
      if (lead.observacoes) {
        const { error: comentarioError } = await supabase
          .from("comentario")
          .insert({ comentario: lead.observacoes, id_cliente: lead_id })
        if (comentarioError) console.error("Error inserting comentario:", comentarioError)
        else console.log("✅ Comentário salvo.")
      }

      // 4. vendedor_lead
      const insertsVL: any[] = []
      const sdrId = await getIdFromName("vendedor", lead.sdr || "")
      const closerId = await getIdFromName("vendedor", lead.closer || "")
      const arrematadorId = await getIdFromName("vendedor", lead.arrematador || "")

      const papelSdrId = await getIdFromName("papel", "SDR")
      const papelCloserId = await getIdFromName("papel", "Closer")
      const papelArrematadorId = await getIdFromName("papel", "Arrematador")

      if (sdrId && papelSdrId) insertsVL.push({ id_lead: lead_id, id_vendedor: sdrId, id_papel: papelSdrId })
      if (closerId && papelCloserId) insertsVL.push({ id_lead: lead_id, id_vendedor: closerId, id_papel: papelCloserId })
      if (arrematadorId && papelArrematadorId)
        insertsVL.push({ id_lead: lead_id, id_vendedor: arrematadorId, id_papel: papelArrematadorId })

      if (insertsVL.length > 0) {
        const { error: vlError } = await supabase.from("vendedor_lead").insert(insertsVL)
        if (vlError) console.error("Error re-inserting vendedor_lead:", vlError)
        else console.log("✅ Vínculos de vendedor salvos.")
      }

      // 5. lead_produto
      const produtoId = await getIdFromName("produto", lead.produto_marketing || "")
      if (produtoId) {
        const { error: lpError } = await supabase.from("lead_produto").insert({ id_lead: lead_id, id_produto: produtoId })
        if (lpError) console.error("Error inserting lead_produto:", lpError)
        else console.log("✅ Lead_produto salvo.")
      }

      return localResult
    } catch (supabaseError: any) {
      console.error("❌ Erro ao salvar no Supabase (nova estrutura):", supabaseError.message)
      console.log("📱 Mas localStorage funcionou, continuando...")
      return localResult
    }
  },

  async update(id: number | string, lead: any) {
    console.log("🔄 === ATUALIZANDO LEAD (NOVA ESTRUTURA) ===")
    console.log("🆔 ID:", id)
    console.log("📝 Dados:", lead)

    const localResult = localStorageOperations.update(String(id), lead)
    console.log("✅ Lead atualizado no localStorage")

    if (!isSupabaseConfigured || !supabase || isLocalId(id)) {
      return localResult
    }

    try {
      console.log("🌐 Tentando atualizar no Supabase...")

      const { data: existingLead, error: fetchExistingError } = await supabase
        .from("lead")
        .select("id_contato")
        .eq("id", id)
        .single()

      if (fetchExistingError) throw fetchExistingError
      const id_contato = existingLead?.id_contato

      // 1) contato
      if (id_contato && (lead.nome_contato || lead.email || lead.cargo_contato || lead.email_corporativo !== undefined)) {
        const { error: contatoUpdateError } = await supabase
          .from("contato")
          .update({
            nome: lead.nome_contato,
            email: lead.email,
            id_cargo_contato: lead.cargo_contato ? await getIdFromName("cargo_contato", lead.cargo_contato) : undefined,
            email_comporativo: lead.email_corporativo,
          })
          .eq("id", id_contato)
        if (contatoUpdateError) console.error("Error updating contato:", contatoUpdateError)
        else console.log("✅ Contato atualizado.")
      }

      // 2) lead
      const { error: leadUpdateError } = await supabase
        .from("lead")
        .update({
          razao_social: lead.nome_empresa,
          nome_fantazia: lead.nome_fantazia,
          id_segmento: lead.nicho ? await getIdFromName("segmento", lead.nicho) : undefined,
          data_compra: lead.data_compra,
          horario_compra: lead.horario_compra,
          valor: lead.valor_venda,
          venda: lead.venda,
          id_origem: lead.tipo_lead ? await getIdFromName("origem", lead.tipo_lead) : undefined,
          id_faturamento: lead.faturamento ? await getIdFromName("faturamento", lead.faturamento) : undefined,
          id_canal: lead.canal ? await getIdFromName("canal", lead.canal) : undefined,
          id_urgencia: lead.nivel_urgencia ? await getIdFromName("urgencia", lead.nivel_urgencia) : undefined,
          id_cidade: lead.cidade ? await getIdFromName("cidade", lead.cidade) : undefined,
          is_anuncio: lead.anuncios,
          id_status: lead.status ? await getIdFromName("status", lead.status) : undefined,
          data_ultimo_contato: lead.data_ultimo_contato,
          cs: lead.cs,
          rm: lead.rm,
          rr: lead.rr,
          ns: lead.ns,
          data_marcacao: lead.data_marcacao,
          data_reuniao: lead.data_reuniao,
          data_assinatura: lead.data_assinatura,
          fee: lead.fee,
          escopo_fechado: lead.escopo_fechado_valor,
          fee_total: lead.fee_total,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (leadUpdateError) throw leadUpdateError
      console.log("✅ Lead principal atualizado.")

      // 3) comentário
      if (lead.observacoes !== undefined) {
        const { data: existingComentario, error: fetchComentarioError } = await supabase
          .from("comentario")
          .select("id")
          .eq("id_cliente", id)
          .maybeSingle()

        if (fetchComentarioError && (fetchComentarioError as any).code !== "PGRST116") {
          console.error("Error fetching existing comentario:", fetchComentarioError)
        }

        if (existingComentario) {
          if (lead.observacoes) {
            const { error: updateComentarioError } = await supabase
              .from("comentario")
              .update({ comentario: lead.observacoes })
              .eq("id", existingComentario.id)
            if (updateComentarioError) console.error("Error updating comentario:", updateComentarioError)
            else console.log("✅ Comentário atualizado.")
          } else {
            const { error: deleteComentarioError } = await supabase
              .from("comentario")
              .delete()
              .eq("id", existingComentario.id)
            if (deleteComentarioError) console.error("Error deleting comentario:", deleteComentarioError)
            else console.log("✅ Comentário removido.")
          }
        } else if (lead.observacoes) {
          const { error: insertComentarioError } = await supabase
            .from("comentario")
            .insert({ comentario: lead.observacoes, id_cliente: id })
          if (insertComentarioError) console.error("Error inserting new comentario:", insertComentarioError)
          else console.log("✅ Novo comentário inserido.")
        }
      }

      // 4) vendedor_lead (reset simples)
      await supabase.from("vendedor_lead").delete().eq("id_lead", id)
      const insertsVL: any[] = []
      const sdrId = await getIdFromName("vendedor", lead.sdr || "")
      const closerId = await getIdFromName("vendedor", lead.closer || "")
      const arrematadorId = await getIdFromName("vendedor", lead.arrematador || "")

      const papelSdrId = await getIdFromName("papel", "SDR")
      const papelCloserId = await getIdFromName("papel", "Closer")
      const papelArrematadorId = await getIdFromName("papel", "Arrematador")

      if (sdrId && papelSdrId) insertsVL.push({ id_lead: id, id_vendedor: sdrId, id_papel: papelSdrId })
      if (closerId && papelCloserId) insertsVL.push({ id_lead: id, id_vendedor: closerId, id_papel: papelCloserId })
      if (arrematadorId && papelArrematadorId) insertsVL.push({ id_lead: id, id_vendedor: arrematadorId, id_papel: papelArrematadorId })

      if (insertsVL.length > 0) {
        const { error: vlError } = await supabase.from("vendedor_lead").insert(insertsVL)
        if (vlError) console.error("Error re-inserting vendedor_lead:", vlError)
        else console.log("✅ Vendedor_lead(s) atualizado(s).")
      }

      // 5) lead_produto (reset simples)
      const { data: existingLeadProducts, error: fetchLeadProductsError } = await supabase
        .from("lead_produto")
        .select("id")
        .eq("id_lead", id)

      if (fetchLeadProductsError) {
        console.error("Error fetching existing lead_produto:", fetchLeadProductsError)
      } else if (existingLeadProducts && existingLeadProducts.length > 0) {
        const { error: deleteLeadProductsError } = await supabase
          .from("lead_produto")
          .delete()
          .eq("id_lead", id)
        if (deleteLeadProductsError) console.error("Error deleting old lead_produto:", deleteLeadProductsError)
      }

      const produtoId = lead.produto_marketing ? await getIdFromName("produto", lead.produto_marketing) : null
      if (produtoId) {
        const { error: lpError } = await supabase.from("lead_produto").insert({ id_lead: id, id_produto: produtoId })
        if (lpError) console.error("Error re-inserting lead_produto:", lpError)
        else console.log("✅ Lead_produto atualizado.")
      }

      return localResult
    } catch (supabaseError: any) {
      console.error("❌ Erro ao atualizar no Supabase (nova estrutura):", supabaseError.message)
      console.log("📱 Mas localStorage funcionou, continuando...")
      return localResult
    }
  },

  async delete(id: number | string) {
    console.log("🔄 === DELETANDO LEAD (NOVA ESTRUTURA) ===")
    console.log("🆔 ID:", id)

    const localResult = localStorageOperations.delete(String(id))
    console.log("✅ Lead deletado do localStorage")

    if (!isSupabaseConfigured || !supabase || isLocalId(id)) {
      return localResult
    }

    try {
      console.log("🌐 Tentando deletar do Supabase...")

      const { data: existingLead, error: fetchExistingError } = await supabase
        .from("lead")
        .select("id_contato")
        .eq("id", id)
        .maybeSingle()

      if (fetchExistingError) throw fetchExistingError
      const id_contato = existingLead?.id_contato

      // Dependências
      await supabase.from("vendedor_lead").delete().eq("id_lead", id)
      await supabase.from("lead_produto").delete().eq("id_lead", id)
      await supabase.from("comentario").delete().eq("id_cliente", id)
      console.log("✅ Registros relacionados deletados.")

      // Lead principal
      const { error: leadDeleteError } = await supabase.from("lead").delete().eq("id", id)
      if (leadDeleteError) throw leadDeleteError
      console.log("✅ Lead principal deletado.")

      // Contato órfão
      if (id_contato) {
        const { data: stillLinked, error: stillLinkedError } = await supabase
          .from("lead")
          .select("id")
          .eq("id_contato", id_contato)
          .limit(1)

        if (!stillLinkedError && (stillLinked?.length || 0) === 0) {
          await supabase.from("contato").delete().eq("id", id_contato)
          console.log("✅ Contato deletado.")
        }
      }

      return true
    } catch (supabaseError: any) {
      console.error("❌ Erro ao deletar do Supabase (nova estrutura):", supabaseError.message)
      console.log("📱 Mas localStorage já foi atualizado, continuando...")
      return localResult
    }
  },
}
