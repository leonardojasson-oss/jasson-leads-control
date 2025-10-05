/**
 * Calcula percentuais do funil usando base "step" (etapa por etapa)
 * ao invés de "top" (sobre total de leads)
 */

export interface FunnelCounts {
  leads: number
  contato: number
  agendada: number
  realizada: number
  vendas: number
}

export interface StepPercents {
  leads: number
  contato: number
  agendada: number
  realizada: number
  vendas: number
}

/**
 * Calcula percentuais step (etapa por etapa):
 * - Leads = 100%
 * - Contato = (C / L) * 100
 * - Agendada = (A / C) * 100
 * - Realizada = (R / A) * 100
 * - Vendas = (V / R) * 100
 */
export function computeStepPercents(counts: FunnelCounts): StepPercents {
  const L = counts.leads || 0
  const C = counts.contato || 0
  const A = counts.agendada || 0
  const R = counts.realizada || 0
  const V = counts.vendas || 0

  const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0)

  return {
    leads: 100,
    contato: pct(C, L),
    agendada: pct(A, C),
    realizada: pct(R, A),
    vendas: pct(V, R),
  }
}

/**
 * Formata percentual com 1 casa decimal
 */
export const fmtPct = (n: number) => `${n.toFixed(1)}%`
