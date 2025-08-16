"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Lead } from "@/app/page"

interface DashboardAnalyticsProps {
  leads: Lead[]
}

export function DashboardAnalytics({ leads }: DashboardAnalyticsProps) {
  // Função para calcular funil de conversão
  const calculateFunnel = (leadsData: Lead[]) => {
    const totalLeads = leadsData.length
    const contato = leadsData.filter((lead) => lead.conseguiu_contato).length
    const agendada = leadsData.filter((lead) => lead.reuniao_agendada).length
    const realizada = leadsData.filter((lead) => lead.reuniao_realizada).length
    const vendas = leadsData.filter((lead) => lead.data_fechamento || lead.data_assinatura).length

    // Calcular FEE MRR e FEE ONE TIME
    const feeMrr = leadsData.reduce((sum, lead) => {
      const fee = Number.parseFloat(String(lead.fee_total || "0"))
      return sum + (isNaN(fee) ? 0 : fee)
    }, 0)

    const feeOneTime = leadsData.reduce((sum, lead) => {
      const escopo = Number.parseFloat(String(lead.escopo_fechado || "0"))
      return sum + (isNaN(escopo) ? 0 : escopo)
    }, 0)

    return {
      leads: { count: totalLeads, percentage: 100 },
      contato: {
        count: contato,
        percentage: totalLeads > 0 ? (contato / totalLeads) * 100 : 0,
      },
      agendada: {
        count: agendada,
        percentage: totalLeads > 0 ? (agendada / totalLeads) * 100 : 0,
      },
      realizada: {
        count: realizada,
        percentage: totalLeads > 0 ? (realizada / totalLeads) * 100 : 0,
      },
      vendas: {
        count: vendas,
        percentage: totalLeads > 0 ? (vendas / totalLeads) * 100 : 0,
      },
      feeMrr,
      feeOneTime,
      conversions: {
        leadToContato: totalLeads > 0 ? (contato / totalLeads) * 100 : 0,
        contatoToAgendada: contato > 0 ? (agendada / contato) * 100 : 0,
        agendadaToRealizada: agendada > 0 ? (realizada / agendada) * 100 : 0,
        realizadaToVenda: realizada > 0 ? (vendas / realizada) * 100 : 0,
      },
    }
  }

  // Funil geral
  const generalFunnel = calculateFunnel(leads)

  // Funis por closer - agora inclui todos os closers encontrados nos dados
  const closerStats = leads.reduce(
    (acc, lead) => {
      const closer = lead.closer?.toLowerCase()?.trim()
      if (closer && closer !== "") {
        if (!acc[closer]) {
          acc[closer] = []
        }
        acc[closer].push(lead)
      }
      return acc
    },
    {} as Record<string, Lead[]>,
  )

  const closerFunnels = Object.entries(closerStats).map(([closer, closerLeads]) => ({
    name: closer.charAt(0).toUpperCase() + closer.slice(1),
    funnel: calculateFunnel(closerLeads),
  }))

  // Funis por SDR com a mesma lógica dos closers
  const sdrStats = leads.reduce(
    (acc, lead) => {
      const sdr = lead.sdr?.toLowerCase()?.trim()
      if (sdr && sdr !== "") {
        if (!acc[sdr]) {
          acc[sdr] = []
        }
        acc[sdr].push(lead)
      }
      return acc
    },
    {} as Record<string, Lead[]>,
  )

  const sdrFunnels = Object.entries(sdrStats).map(([sdr, sdrLeads]) => ({
    name: sdr.charAt(0).toUpperCase() + sdr.slice(1),
    funnel: calculateFunnel(sdrLeads),
  }))

  // Componente de funil visual
  const VisualFunnel = ({
    title,
    funnel,
    totalLeads,
    color,
  }: {
    title: string
    funnel: any
    totalLeads: number
    color: string
  }) => {
    const stages = [
      { name: "Leads", count: funnel.leads.count, percentage: funnel.leads.percentage, color: "#22d3ee" },
      { name: "Contato", count: funnel.contato.count, percentage: funnel.contato.percentage, color: "#4ade80" },
      { name: "Agendada", count: funnel.agendada.count, percentage: funnel.agendada.percentage, color: "#a3e635" },
      { name: "Realizada", count: funnel.realizada.count, percentage: funnel.realizada.percentage, color: "#fb923c" },
      { name: "Vendas", count: funnel.vendas.count, percentage: funnel.vendas.percentage, color: "#ef4444" },
    ]

    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-center" style={{ color }}>
            {title}
          </CardTitle>
          <p className="text-xs text-gray-500 text-center">{totalLeads} leads • Funil de Conversão</p>
        </CardHeader>
        <CardContent className="space-y-1 p-4">
          <div className="relative flex flex-col items-center space-y-1">
            {stages.map((stage, index) => {
              const maxWidth = 100
              const minWidth = 20
              const widthRange = maxWidth - minWidth
              const stageWidth = maxWidth - index * (widthRange / (stages.length - 1))
              const width = Math.max(minWidth, stageWidth)

              return (
                <div key={stage.name} className="relative w-full flex justify-center">
                  <div
                    className="relative flex items-center justify-center text-white font-bold text-xs shadow-lg transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: stage.color,
                      width: `${width}%`,
                      height: "35px",
                      clipPath:
                        index === 0
                          ? "polygon(0 0, 100% 0, 95% 100%, 5% 100%)"
                          : index === stages.length - 1
                            ? "polygon(10% 0, 90% 0, 85% 100%, 15% 100%)"
                            : "polygon(7% 0, 93% 0, 90% 100%, 10% 100%)",
                    }}
                  >
                    <div className="text-center">
                      <div className="font-bold text-sm">{stage.count}</div>
                      <div className="text-xs opacity-90">{stage.name}</div>
                    </div>
                  </div>

                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full ml-4">
                    <div className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-medium text-gray-700">
                      {stage.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Métricas de conversão */}
          <div className="pt-2 border-t border-gray-200 mt-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">📊 Conversões entre Etapas</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 p-1.5 rounded">
                <span className="text-gray-600">Lead → Contato:</span>
                <span className="font-bold text-blue-600 ml-1">{funnel.conversions.leadToContato.toFixed(1)}%</span>
              </div>
              <div className="bg-green-50 p-1.5 rounded">
                <span className="text-gray-600">Contato → Agendada:</span>
                <span className="font-bold text-green-600 ml-1">
                  {funnel.conversions.contatoToAgendada.toFixed(1)}%
                </span>
              </div>
              <div className="bg-yellow-50 p-1.5 rounded">
                <span className="text-gray-600">Agendada → Realizada:</span>
                <span className="font-bold text-yellow-600 ml-1">
                  {funnel.conversions.agendadaToRealizada.toFixed(1)}%
                </span>
              </div>
              <div className="bg-red-50 p-1.5 rounded">
                <span className="text-gray-600">Realizada → Venda:</span>
                <span className="font-bold text-red-600 ml-1">{funnel.conversions.realizadaToVenda.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* FEE MRR e FEE ONE TIME */}
          <div className="pt-2 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">💰 Receita Gerada</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 p-2 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">FEE MRR (Recorrente)</div>
                <div className="font-bold text-green-600 text-base">
                  R$ {funnel.feeMrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">FEE ONE TIME (Escopo)</div>
                <div className="font-bold text-blue-600 text-base">
                  R$ {funnel.feeOneTime.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="mt-1.5 bg-gray-50 p-1.5 rounded text-center">
              <span className="text-xs text-gray-600">Total: </span>
              <span className="font-bold text-gray-800 text-sm">
                R$ {(funnel.feeMrr + funnel.feeOneTime).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Funil Geral */}
      <div className="mb-4">
        <VisualFunnel title="🎯 Funil Geral" funnel={generalFunnel} totalLeads={leads.length} color="#dc2626" />
      </div>

      {/* Funis por Closer */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">👥 Funis por Closer</h2>

        {closerFunnels.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {closerFunnels.map((closerFunnel, index) => {
              const colors = [
                "#2563eb", // Azul
                "#dc2626", // Vermelho
                "#059669", // Verde
                "#7c3aed", // Roxo
                "#ea580c", // Laranja
                "#0891b2", // Ciano
                "#be123c", // Rosa
                "#65a30d", // Lima
                "#4338ca", // Índigo
                "#c2410c", // Âmbar
              ]

              const closerColor = colors[index % colors.length]

              return (
                <VisualFunnel
                  key={closerFunnel.name}
                  title={`${closerFunnel.name}`}
                  funnel={closerFunnel.funnel}
                  totalLeads={closerStats[closerFunnel.name.toLowerCase()].length}
                  color={closerColor}
                />
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Nenhum Closer Encontrado</h3>
              <p className="text-sm text-gray-500">Não foram encontrados leads com closers atribuídos no sistema.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Funis por SDR */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">🎯 Funis por SDR</h2>

        {sdrFunnels.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {sdrFunnels.map((sdrFunnel, index) => {
              const colors = [
                "#16a34a", // Verde
                "#dc2626", // Vermelho
                "#2563eb", // Azul
                "#7c3aed", // Roxo
                "#ea580c", // Laranja
                "#0891b2", // Ciano
                "#be123c", // Rosa
                "#65a30d", // Lima
                "#4338ca", // Índigo
                "#c2410c", // Âmbar
              ]

              const sdrColor = colors[index % colors.length]

              return (
                <VisualFunnel
                  key={sdrFunnel.name}
                  title={`${sdrFunnel.name}`}
                  funnel={sdrFunnel.funnel}
                  totalLeads={sdrStats[sdrFunnel.name.toLowerCase()].length}
                  color={sdrColor}
                />
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Nenhum SDR Encontrado</h3>
              <p className="text-sm text-gray-500">Não foram encontrados leads com SDRs atribuídos no sistema.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resumo Comparativo */}
      {closerFunnels.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              📈 Comparativo de Performance - CLOSERs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 font-semibold">Closer</th>
                    <th className="text-center py-1.5 font-semibold">Leads</th>
                    <th className="text-center py-1.5 font-semibold">Contato</th>
                    <th className="text-center py-1.5 font-semibold">Agendadas</th>
                    <th className="text-center py-1.5 font-semibold">Realizadas</th>
                    <th className="text-center py-1.5 font-semibold">Vendas</th>
                    <th className="text-center py-1.5 font-semibold">FEE MRR</th>
                    <th className="text-center py-1.5 font-semibold">FEE ONE TIME</th>
                    <th className="text-center py-1.5 font-semibold">Taxa Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  {closerFunnels.map((closerFunnel) => {
                    const conversionRate =
                      closerFunnel.funnel.leads.count > 0
                        ? (closerFunnel.funnel.vendas.count / closerFunnel.funnel.leads.count) * 100
                        : 0

                    return (
                      <tr key={closerFunnel.name} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{closerFunnel.name}</td>
                        <td className="text-center py-2 font-bold text-blue-600">{closerFunnel.funnel.leads.count}</td>
                        <td className="text-center py-2">
                          {closerFunnel.funnel.contato.count}
                          <span className="text-xs text-gray-500 ml-1">
                            ({closerFunnel.funnel.contato.percentage.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="text-center py-2">
                          {closerFunnel.funnel.agendada.count}
                          <span className="text-xs text-gray-500 ml-1">
                            ({closerFunnel.funnel.agendada.percentage.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="text-center py-2">
                          {closerFunnel.funnel.realizada.count}
                          <span className="text-xs text-gray-500 ml-1">
                            ({closerFunnel.funnel.realizada.percentage.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="text-center py-2 font-bold text-green-600">
                          {closerFunnel.funnel.vendas.count}
                        </td>
                        <td className="text-center py-2 font-bold text-green-600">
                          R$ {closerFunnel.funnel.feeMrr.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                        </td>
                        <td className="text-center py-2 font-bold text-blue-600">
                          R$ {closerFunnel.funnel.feeOneTime.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                        </td>
                        <td className="text-center py-2">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                              conversionRate >= 10
                                ? "bg-green-100 text-green-800"
                                : conversionRate >= 5
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {conversionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Comparativo SDRs */}
      {sdrFunnels.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              📊 Comparativo de Performance - SDRs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 font-semibold">SDR</th>
                    <th className="text-center py-1.5 font-semibold">Leads</th>
                    <th className="text-center py-1.5 font-semibold">Contato</th>
                    <th className="text-center py-1.5 font-semibold">Agendadas</th>
                    <th className="text-center py-1.5 font-semibold">Realizadas</th>
                    <th className="text-center py-1.5 font-semibold">Vendas</th>
                    <th className="text-center py-1.5 font-semibold">FEE MRR</th>
                    <th className="text-center py-1.5 font-semibold">FEE ONE TIME</th>
                    <th className="text-center py-1.5 font-semibold">Taxa Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  {sdrFunnels.map((sdrFunnel) => {
                    const conversionRate =
                      sdrFunnel.funnel.leads.count > 0
                        ? (sdrFunnel.funnel.vendas.count / sdrFunnel.funnel.leads.count) * 100
                        : 0

                    return (
                      <tr key={sdrFunnel.name} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{sdrFunnel.name}</td>
                        <td className="text-center py-2 font-bold text-blue-600">{sdrFunnel.funnel.leads.count}</td>
                        <td className="text-center py-2">
                          {sdrFunnel.funnel.contato.count}
                          <span className="text-xs text-gray-500 ml-1">
                            ({sdrFunnel.funnel.contato.percentage.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="text-center py-2">
                          {sdrFunnel.funnel.agendada.count}
                          <span className="text-xs text-gray-500 ml-1">
                            ({sdrFunnel.funnel.agendada.percentage.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="text-center py-2">
                          {sdrFunnel.funnel.realizada.count}
                          <span className="text-xs text-gray-500 ml-1">
                            ({sdrFunnel.funnel.realizada.percentage.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="text-center py-2 font-bold text-green-600">{sdrFunnel.funnel.vendas.count}</td>
                        <td className="text-center py-2 font-bold text-green-600">
                          R$ {sdrFunnel.funnel.feeMrr.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                        </td>
                        <td className="text-center py-2 font-bold text-blue-600">
                          R$ {sdrFunnel.funnel.feeOneTime.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                        </td>
                        <td className="text-center py-2">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                              conversionRate >= 10
                                ? "bg-green-100 text-green-800"
                                : conversionRate >= 5
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {conversionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
