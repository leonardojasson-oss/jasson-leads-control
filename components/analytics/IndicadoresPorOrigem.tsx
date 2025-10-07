"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Lead } from "@/lib/supabase-operations"
import { calculateCompleteOriginMetrics, fmtBRL, fmtPct, toStepPercents, type OriginKey } from "@/lib/origins-metrics"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface IndicadoresPorOrigemProps {
  leads: Lead[]
}

const ORIGINS: OriginKey[] = ["Blackbox", "Leadbroker", "Inside Box"]

const ORIGIN_COLORS = {
  Blackbox: "from-blue-500 to-cyan-600",
  Leadbroker: "from-purple-500 to-indigo-600",
  "Inside Box": "from-orange-500 to-red-600",
}

export function IndicadoresPorOrigem({ leads }: IndicadoresPorOrigemProps) {
  const allMetrics = ORIGINS.map((origin) => ({
    origin,
    metrics: calculateCompleteOriginMetrics(leads, origin),
  }))

  return (
    <div id="indicadores-por-origem" className="space-y-6 mb-8">
      {/* Título da Seção */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xl">📊</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Indicadores por Origem (Inbound)</h2>
          <p className="text-sm text-gray-600">Conversão step-by-step: Leads → RM → RR → Vendas</p>
        </div>
      </div>

      {/* Grid de Cards por Origem */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ORIGINS.map((origin) => {
          const originData = allMetrics.find((m) => m.origin === origin)
          if (!originData) return null

          const metrics = originData.metrics
          const stepPercents = toStepPercents(metrics)

          // Calcular largura das barras (normalizar pelo total de leads)
          const maxValue = metrics.leads
          const getBarWidth = (value: number) => {
            if (maxValue === 0) return "0%"
            return `${(value / maxValue) * 100}%`
          }

          return (
            <Card key={origin} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className={`bg-gradient-to-r ${ORIGIN_COLORS[origin]} text-white rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold uppercase">{origin}</CardTitle>
                  <div className="text-right">
                    {metrics.roas !== null ? (
                      <div>
                        <div className="text-xs opacity-90">ROAS</div>
                        <div className="text-xl font-bold">{metrics.roas.toFixed(2)}x</div>
                      </div>
                    ) : (
                      <div className="text-xs opacity-75" title="Sem dados de custo">
                        ROAS —
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Barra: Leads */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Leads</span>
                    <span className="font-bold text-gray-900">{fmtPct(stepPercents.leads)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: getBarWidth(metrics.leads) }}
                    >
                      {metrics.leads}
                    </div>
                  </div>
                </div>

                {/* Barra: RM (Reunião Marcada) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">RM (Reunião Marcada)</span>
                    <span className="font-bold text-green-600">{fmtPct(stepPercents.rm_over_leads)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: getBarWidth(metrics.rm) }}
                    >
                      {metrics.rm}
                    </div>
                  </div>
                </div>

                {/* Barra: RR (Reunião Realizada) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">RR (Reunião Realizada)</span>
                    <span className="font-bold text-orange-600">{fmtPct(stepPercents.rr_over_rm)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: getBarWidth(metrics.rr) }}
                    >
                      {metrics.rr}
                    </div>
                  </div>
                </div>

                {/* Barra: Vendas */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Vendas</span>
                    <span className="font-bold text-purple-600">{fmtPct(stepPercents.vendas_over_rr)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-400 to-purple-500 h-full rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: getBarWidth(metrics.vendas) }}
                    >
                      {metrics.vendas}
                    </div>
                  </div>
                </div>

                <TooltipProvider>
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    {/* 1. Funnel Hit Rate */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Funnel Hit Rate:</span>
                      <span className="text-lg font-bold text-blue-600">{fmtPct(stepPercents.hit_rate)}</span>
                    </div>

                    {/* 2. Receita Total */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Receita Total:</span>
                      <span className="text-lg font-bold text-green-600">{fmtBRL(metrics.receita)}</span>
                    </div>

                    {/* 3. Custo Total */}
                    {metrics.custo !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Custo Total:</span>
                        <span className="text-sm font-medium text-gray-700">{fmtBRL(metrics.custo)}</span>
                      </div>
                    )}

                    {/* 4. CPRR (Custo por Reunião Realizada) */}
                    <div className="flex items-center justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-medium text-gray-600 cursor-help">CPRR:</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Custo por Reunião Realizada = Custo Total / RR</p>
                        </TooltipContent>
                      </Tooltip>
                      {metrics.cprr !== null ? (
                        <span className="text-sm font-medium text-gray-700">{fmtBRL(metrics.cprr)}</span>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium text-gray-400 cursor-help">—</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Indisponível (sem reuniões realizadas)</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* 5. CAC (Custo de Aquisição de Cliente) */}
                    <div className="flex items-center justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-medium text-gray-600 cursor-help">CAC:</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Custo de Aquisição de Cliente = Custo Total / Vendas</p>
                        </TooltipContent>
                      </Tooltip>
                      {metrics.cac !== null ? (
                        <span className="text-sm font-medium text-gray-700">{fmtBRL(metrics.cac)}</span>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium text-gray-400 cursor-help">—</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Indisponível (sem vendas)</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
