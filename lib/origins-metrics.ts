/**
 * Utilitários para cálculo de métricas por origem (Inbound)
 * Calcula conversões step-by-step: Leads → RM → RR → Vendas
 */

import type { Lead } from "@/lib/supabase-operations"

export type OriginKey = "Blackbox" | "Leadbroker" | "Inside Box"

export interface OriginCounts {
  leads: number
  rm: number // Reunião Marcada
  rr: number // Reunião Realizada
  vendas: number
  receita: number
  custo: number | null
}

export interface OriginStepPercents {
  leads: number // sempre 100%
  rm_over_leads: number // RM / Leads
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
    rm_over_leads: pct(c.rm, c.leads),
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
  // Filtrar leads da origem
  const originLeads = leads.filter((lead) => {
    const origemLead = (lead.tipo_lead || lead.origem_lead || lead.origemLead || "").toLowerCase()

    // Normalizar nome da origem
    const normalizedOrigin = origin.toLowerCase().replace(/\s+/g, "")

    // Casos especiais
    if (normalizedOrigin === "leadbroker") {
      return origemLead === "leadbroker" || origemLead === "lead broker"
    }

    if (normalizedOrigin === "insidebox") {
      return origemLead === "inside box" || origemLead === "insidebox"
    }

    return origemLead === normalizedOrigin
  })

  // Contar leads em cada etapa
  const totalLeads = originLeads.length
  const rm = originLeads.filter(isRM).length
  const rr = originLeads.filter(isRR).length
  const vendas = originLeads.filter(isVenda).length

  // Calcular receita (apenas leads com data_assinatura)
  const leadsComAssinatura = originLeads.filter((lead) => lead.data_assinatura)
  const receita = leadsComAssinatura.reduce((sum, lead) => {
    const feeMRR = Number.parseFloat(String(lead.fee_mrr || "0")) || 0
    const feeOneTime = Number.parseFloat(String(lead.escopo_fechado || "0")) || 0
    return sum + feeMRR + feeOneTime
  }, 0)

  // Calcular custo (se existir coluna custo_lead)
  const custo = originLeads.reduce((sum, lead) => {
    const custoLead = Number.parseFloat(String(lead.valor_pago_lead || "0")) || 0
    return sum + custoLead
  }, 0)

  return {
    leads: totalLeads,
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
