/**
 * Utilitários para cálculo de métricas por origem (Inbound)
 * Calcula conversões step-by-step: Leads → MQL → RM → RR → Vendas
 */

import type { Lead } from "@/lib/supabase-operations"

export type OriginKey = "Blackbox" | "Leadbroker" | "Inside Box"

export interface OriginCounts {
  leads: number
  mql: number // Adicionando MQL (Marketing Qualified Lead)
  rm: number // Reunião Marcada
  rr: number // Reunião Realizada
  vendas: number
  receita: number
  custo: number | null
}

export interface OriginMetrics extends OriginCounts {
  cpl: number | null // Custo por Lead
  cprr: number | null // Custo por Reunião Realizada
  cac: number | null // Custo de Aquisição de Cliente
  ticketMedio: number | null // Receita / Vendas
  roas: number | null // Return on Ad Spend
}

export interface OriginStepPercents {
  leads: number // sempre 100%
  mql_over_leads: number // MQL / Leads
  rm_over_mql: number // RM / MQL (antes era RM / Leads)
  rr_over_rm: number // RR / RM
  vendas_over_rr: number // Vendas / RR
  hit_rate: number // Vendas / Leads (funil completo)
}

/**
 * Calcula percentuais step-by-step (etapa por etapa)
 */
export function toStepPercents(c: OriginCounts): OriginStepPercents {
  const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0)

  return {
    leads: 100,
    mql_over_leads: pct(c.mql, c.leads), // Adicionando conversão Leads → MQL
    rm_over_mql: pct(c.rm, c.mql), // Mudando base de Leads para MQL
    rr_over_rm: pct(c.rr, c.rm),
    vendas_over_rr: pct(c.vendas, c.rr),
    hit_rate: pct(c.vendas, c.leads),
  }
}

/**
 * Formata percentual com 1 casa decimal
 */
export const fmtPct = (n: number) => `${n.toFixed(1)}%`

/**
 * Formata valor em BRL
 */
export const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

/**
 * Verifica se um lead é MQL (Marketing Qualified Lead)
 * MQL = Lead inbound que NÃO está com status NON-SAL
 */
function isMQL(lead: Lead): boolean {
  const status = (lead.status || "").toUpperCase().trim()

  const normalizedStatus = status.replace(/\s+/g, "").replace(/-/g, "")

  if (normalizedStatus === "NONSAL") return false

  return true
}

/**
 * Verifica se um lead é RM (Reunião Marcada)
 */
function isRM(lead: Lead): boolean {
  if (lead.reuniao_agendada === true) return true

  const status = (lead.status || "").toUpperCase()
  return status.includes("REUNIÃO AGENDADA") || status.includes("QUALI AGENDADA") || status.includes("REUNIÃO MARCADA")
}

/**
 * Verifica se um lead é RR (Reunião Realizada)
 */
function isRR(lead: Lead): boolean {
  if (lead.reuniao_realizada === true) return true

  const status = (lead.status || "").toUpperCase()
  return status.includes("REUNIÃO REALIZADA")
}

/**
 * Verifica se um lead é Venda
 */
function isVenda(lead: Lead): boolean {
  return lead.status === "GANHO" && !!lead.data_assinatura
}

/**
 * Calcula métricas para uma origem específica
 */
export function calculateOriginMetrics(leads: Lead[], origin: OriginKey): OriginCounts {
  const originLeads = leads.filter((lead) => {
    const origemLead = (lead.tipo_lead || lead.origem_lead || lead.origemLead || "").toLowerCase()

    const normalizedOrigin = origin.toLowerCase().replace(/\s+/g, "")

    if (normalizedOrigin === "leadbroker") {
      return origemLead === "leadbroker" || origemLead === "lead broker"
    }

    if (normalizedOrigin === "insidebox") {
      return origemLead === "inside box" || origemLead === "insidebox"
    }

    return origemLead === normalizedOrigin
  })

  const totalLeads = originLeads.length
  const mql = originLeads.filter(isMQL).length
  const rm = originLeads.filter(isRM).length
  const rr = originLeads.filter(isRR).length
  const vendas = originLeads.filter(isVenda).length

  const leadsComAssinatura = originLeads.filter((lead) => lead.data_assinatura)
  const receita = leadsComAssinatura.reduce((sum, lead) => {
    const feeMRR = Number.parseFloat(String(lead.fee_mrr || "0")) || 0
    const feeOneTime = Number.parseFloat(String(lead.escopo_fechado || "0")) || 0
    return sum + feeMRR + feeOneTime
  }, 0)

  const custo = originLeads.reduce((sum, lead) => {
    const custoLead = Number.parseFloat(String(lead.valor_pago_lead || "0")) || 0
    return sum + custoLead
  }, 0)

  return {
    leads: totalLeads,
    mql,
    rm,
    rr,
    vendas,
    receita,
    custo: custo > 0 ? custo : null,
  }
}

/**
 * Calcula ROAS (Return on Ad Spend)
 */
export function calculateROAS(receita: number, custo: number | null): number | null {
  if (!custo || custo === 0) return null
  return receita / custo
}

/**
 * Calcula CPL (Custo por Lead)
 */
export function calculateCPL(custo: number | null, leads: number): number | null {
  if (!custo || custo === 0 || leads === 0) return null
  return custo / leads
}

/**
 * Calcula CPRR (Custo por Reunião Realizada)
 */
export function calculateCPRR(custo: number | null, rr: number): number | null {
  if (!custo || custo === 0 || rr === 0) return null
  return custo / rr
}

/**
 * Calcula CAC (Custo de Aquisição de Cliente)
 */
export function calculateCAC(custo: number | null, vendas: number): number | null {
  if (!custo || custo === 0 || vendas === 0) return null
  return custo / vendas
}

/**
 * Calcula Ticket Médio
 */
export function calculateTicketMedio(receita: number, vendas: number): number | null {
  if (vendas === 0) return null
  return receita / vendas
}

/**
 * Calcula todas as métricas para uma origem (incluindo CPRR e CAC)
 */
export function calculateCompleteOriginMetrics(leads: Lead[], origin: OriginKey): OriginMetrics {
  const counts = calculateOriginMetrics(leads, origin)

  return {
    ...counts,
    cpl: calculateCPL(counts.custo, counts.leads),
    cprr: calculateCPRR(counts.custo, counts.rr),
    cac: calculateCAC(counts.custo, counts.vendas),
    ticketMedio: calculateTicketMedio(counts.receita, counts.vendas),
    roas: calculateROAS(counts.receita, counts.custo),
  }
}
