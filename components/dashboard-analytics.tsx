"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BarChart3 } from "lucide-react"
import { useState } from "react"
import type { Lead } from "@/app/page"

interface DashboardAnalyticsProps {
  leads: Lead[]
}

export function DashboardAnalytics({ leads }: DashboardAnalyticsProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const getFilteredLeads = () => {
    if (!leads || leads.length === 0) return []

    let filteredLeads = leads

    if (startDate || endDate) {
      filteredLeads = leads.filter((lead) => {
        if (!lead.data_hora_compra) return false
        const leadDate = new Date(lead.data_hora_compra)

        if (startDate && endDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999) // Incluir o dia final completo
          return leadDate >= start && leadDate <= end
        } else if (startDate) {
          const start = new Date(startDate)
          return leadDate >= start
        } else if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return leadDate <= end
        }

        return true
      })
    }

    return filteredLeads
  }

  const filteredLeads = getFilteredLeads()

  // Função para calcular funil de conversão
  const calculateFunnel = (leadsData: Lead[]) => {
    const totalLeads = leadsData.length
    const contato = leadsData.filter((lead) => lead.conseguiu_contato).length
    const agendada = leadsData.filter((lead) => lead.reuniao_agendada).length
    const realizada = leadsData.filter((lead) => lead.reuniao_realizada).length
    const vendas = leadsData.filter((lead) => lead.data_assinatura && lead.status === "GANHO").length

    const leadsComAssinatura = leadsData.filter((lead) => lead.data_assinatura)

    const feeMrr = leadsComAssinatura.reduce((sum, lead) => {
      const fee = Number.parseFloat(String(lead.fee_total || "0"))
      return sum + (isNaN(fee) ? 0 : fee)
    }, 0)

    const feeOneTime = leadsComAssinatura.reduce((sum, lead) => {
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

  const generalFunnel = calculateFunnel(filteredLeads)

  const calculateForecast = (leadsData: Lead[]) => {
    // Definir status que são >= REUNIÃO REALIZADA
    const statusHierarchy = [
      "BACKLOG",
      "TENTANDO CONTATO",
      "QUALI AGENDADA",
      "QUALIFICANDO",
      "REUNIÃO AGENDADA",
      "REUNIÃO REALIZADA", // A partir daqui são considerados
      "DÚVIDAS E FECHAMENTO",
      "CONTRATO NA RUA",
      "GANHO",
      "FOLLOW UP",
      "FOLLOW INFINITO",
      "NO-SHOW",
      "PERDIDO",
    ]

    const minStatusIndex = statusHierarchy.indexOf("REUNIÃO REALIZADA")

    const forecastLeads = leadsData.filter((lead) => {
      // Deve ter valor de proposta preenchido (FEE MRR e/ou FEE ONE-TIME)
      const hasFeeValue =
        (lead.fee_total && Number.parseFloat(String(lead.fee_total)) > 0) ||
        (lead.escopo_fechado && Number.parseFloat(String(lead.escopo_fechado)) > 0)

      // Deve NÃO ter DATA DE ASSINATURA preenchida
      const noDataAssinatura = !lead.data_assinatura

      // Deve NÃO ter MOTIVO DE PERDA preenchido
      const noMotivoPerda = !lead.motivo_perda || lead.motivo_perda.trim() === ""

      // Deve estar em um STATUS >= REUNIÃO REALIZADA
      const currentStatusIndex = statusHierarchy.indexOf(lead.status || "")
      const statusQualified = currentStatusIndex >= minStatusIndex && currentStatusIndex !== -1

      return hasFeeValue && noDataAssinatura && noMotivoPerda && statusQualified
    })

    const quantidade = forecastLeads.length

    const potencialFeeMrr = forecastLeads.reduce((sum, lead) => {
      const fee = Number.parseFloat(String(lead.fee_total || "0"))
      return sum + (isNaN(fee) ? 0 : fee)
    }, 0)

    const potencialFeeOneTime = forecastLeads.reduce((sum, lead) => {
      const escopo = Number.parseFloat(String(lead.escopo_fechado || "0"))
      return sum + (isNaN(escopo) ? 0 : escopo)
    }, 0)

    const totalOportunidade = potencialFeeMrr + potencialFeeOneTime

    return {
      quantidade,
      potencialFeeMrr,
      potencialFeeOneTime,
      totalOportunidade,
    }
  }

  const forecast = calculateForecast(filteredLeads)

  const calculateForecastByCloser = (leadsData: Lead[]) => {
    const statusHierarchy = [
      "BACKLOG",
      "TENTANDO CONTATO",
      "QUALI AGENDADA",
      "QUALIFICANDO",
      "REUNIÃO AGENDADA",
      "REUNIÃO REALIZADA", // A partir daqui são considerados
      "DÚVIDAS E FECHAMENTO",
      "CONTRATO NA RUA",
      "GANHO",
      "FOLLOW UP",
      "FOLLOW INFINITO",
      "NO-SHOW",
      "PERDIDO",
    ]

    const minStatusIndex = statusHierarchy.indexOf("REUNIÃO REALIZADA")

    const forecastLeads = leadsData.filter((lead) => {
      const hasFeeValue =
        (lead.fee_total && Number.parseFloat(String(lead.fee_total)) > 0) ||
        (lead.escopo_fechado && Number.parseFloat(String(lead.escopo_fechado)) > 0)
      const noDataAssinatura = !lead.data_assinatura
      const noMotivoPerda = !lead.motivo_perda || lead.motivo_perda.trim() === ""
      const currentStatusIndex = statusHierarchy.indexOf(lead.status || "")
      const statusQualified = currentStatusIndex >= minStatusIndex && currentStatusIndex !== -1

      return hasFeeValue && noDataAssinatura && noMotivoPerda && statusQualified
    })

    const closerForecast = forecastLeads.reduce(
      (acc, lead) => {
        const closer = lead.closer?.toLowerCase()?.trim()
        if (closer && closer !== "") {
          if (!acc[closer]) {
            acc[closer] = {
              name: closer.charAt(0).toUpperCase() + closer.slice(1),
              quantidade: 0,
              potencialFeeMrr: 0,
              potencialFeeOneTime: 0,
              totalOportunidade: 0,
            }
          }

          acc[closer].quantidade += 1

          const feeMrr = Number.parseFloat(String(lead.fee_total || "0"))
          const feeOneTime = Number.parseFloat(String(lead.escopo_fechado || "0"))

          acc[closer].potencialFeeMrr += isNaN(feeMrr) ? 0 : feeMrr
          acc[closer].potencialFeeOneTime += isNaN(feeOneTime) ? 0 : feeOneTime
          acc[closer].totalOportunidade = acc[closer].potencialFeeMrr + acc[closer].potencialFeeOneTime
        }
        return acc
      },
      {} as Record<
        string,
        {
          name: string
          quantidade: number
          potencialFeeMrr: number
          potencialFeeOneTime: number
          totalOportunidade: number
        }
      >,
    )

    return Object.values(closerForecast).sort((a, b) => b.totalOportunidade - a.totalOportunidade)
  }

  const forecastByCloser = calculateForecastByCloser(filteredLeads)

  const closerStats = filteredLeads.reduce(
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

  const sdrStats = filteredLeads.reduce(
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-4 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Dashboard & Analytics</h1>
                <p className="text-sm text-white/80">Análise de Performance e Funis de Conversão</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-32 bg-white/10 border-white/20 text-white placeholder-white/60 backdrop-blur-sm h-7 text-xs"
                  placeholder="Data inicial"
                />
                <span className="text-white/80 text-xs">até</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-32 bg-white/10 border-white/20 text-white placeholder-white/60 backdrop-blur-sm h-7 text-xs"
                  placeholder="Data final"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Funil Geral */}
      <div className="mb-4">
        <VisualFunnel title="🎯 Funil Geral" funnel={generalFunnel} totalLeads={filteredLeads.length} color="#dc2626" />
      </div>

      {/* Forecast – Propostas em Aberto */}
      <div className="mb-4">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-orange-600">📈</span>
            Forecast – Propostas em Aberto
          </h2>
          <p className="text-sm text-gray-500">Potencial de receita futura • Propostas apresentadas mas não fechadas</p>
        </div>

        {/* Cards horizontais dos indicadores principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Propostas Abertas</p>
                  <p className="text-2xl font-bold text-orange-600">{forecast.quantidade}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-lg">📋</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Potencial FEE MRR</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {forecast.potencialFeeMrr.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">💰</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Potencial FEE ONE-TIME</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {forecast.potencialFeeOneTime.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">💎</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total em Oportunidade</p>
                  <p className="text-2xl font-bold text-orange-700">
                    R$ {forecast.totalOportunidade.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-700 text-lg">🎯</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forecast por Closer - Tabela compacta */}
        {forecastByCloser.length > 0 && (
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-purple-600">👥</span>
                Forecast por Closer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Closer</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Propostas</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">FEE MRR</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">FEE ONE-TIME</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastByCloser.map((closer, index) => (
                      <tr
                        key={closer.name}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="py-3 px-4 font-medium text-gray-900">{closer.name}</td>
                        <td className="text-center py-3 px-4">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-semibold text-xs">
                            {closer.quantidade}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4 font-semibold text-green-600">
                          R$ {closer.potencialFeeMrr.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                        </td>
                        <td className="text-center py-3 px-4 font-semibold text-blue-600">
                          R$ {closer.potencialFeeOneTime.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-semibold">
                            R$ {closer.totalOportunidade.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
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
