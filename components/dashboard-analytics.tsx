"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Lead } from "@/app/page"

interface DashboardAnalyticsProps {
  leads: Lead[]
}

export function DashboardAnalytics({ leads }: DashboardAnalyticsProps) {
  // Calculate metrics based on real data
  const totalLeads = leads.length
  const leadsWithSales = leads.filter((lead) => lead.valorVenda && Number.parseFloat(lead.valorVenda) > 0).length
  const conversionRate = totalLeads > 0 ? (leadsWithSales / totalLeads) * 100 : 0

  const totalSales = leads.reduce((sum, lead) => sum + (Number.parseFloat(lead.valorVenda) || 0), 0)
  const averageTicket = leadsWithSales > 0 ? totalSales / leadsWithSales : 0

  const totalInvestment = leads.reduce((sum, lead) => sum + (Number.parseFloat(lead.valorPagoLead) || 0), 0)
  const cac = totalLeads > 0 ? totalInvestment / totalLeads : 0

  const ltvCacRatio = cac > 0 ? averageTicket / cac : 0

  const additionalKPIs = [
    {
      title: "Taxa de Conversão Geral",
      value: `${conversionRate.toFixed(1)}%`,
      subtitle: `${leadsWithSales} de ${totalLeads} leads`,
      color: "border-l-blue-500",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
      subtitle: "Valor médio por venda",
      color: "border-l-green-500",
    },
    {
      title: "CAC (Custo por Lead)",
      value: `R$ ${cac.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      subtitle: "Custo médio por lead",
      color: "border-l-purple-500",
    },
    {
      title: "LTV/CAC Ratio",
      value: `${ltvCacRatio.toFixed(1)}x`,
      subtitle: "Retorno sobre investimento",
      color: "border-l-orange-500",
    },
  ]

  // Calculate rankings
  const sdrStats = leads.reduce(
    (acc, lead) => {
      if (!acc[lead.sdr]) {
        acc[lead.sdr] = { leads: 0, sales: 0, revenue: 0 }
      }
      acc[lead.sdr].leads++
      if (lead.valorVenda && Number.parseFloat(lead.valorVenda) > 0) {
        acc[lead.sdr].sales++
        acc[lead.sdr].revenue += Number.parseFloat(lead.valorVenda)
      }
      return acc
    },
    {} as Record<string, { leads: number; sales: number; revenue: number }>,
  )

  const closerStats = leads.reduce(
    (acc, lead) => {
      if (lead.closer) {
        if (!acc[lead.closer]) {
          acc[lead.closer] = { leads: 0, sales: 0, revenue: 0 }
        }
        acc[lead.closer].leads++
        if (lead.valorVenda && Number.parseFloat(lead.valorVenda) > 0) {
          acc[lead.closer].sales++
          acc[lead.closer].revenue += Number.parseFloat(lead.valorVenda)
        }
      }
      return acc
    },
    {} as Record<string, { leads: number; sales: number; revenue: number }>,
  )

  const nichoStats = leads.reduce(
    (acc, lead) => {
      if (!acc[lead.nicho]) {
        acc[lead.nicho] = { leads: 0, sales: 0, revenue: 0 }
      }
      acc[lead.nicho].leads++
      if (lead.valorVenda && Number.parseFloat(lead.valorVenda) > 0) {
        acc[lead.nicho].sales++
        acc[lead.nicho].revenue += Number.parseFloat(lead.valorVenda)
      }
      return acc
    },
    {} as Record<string, { leads: number; sales: number; revenue: number }>,
  )

  const rankingSDR = Object.entries(sdrStats)
    .map(([name, stats]) => ({ name, ...stats, conversion: stats.leads > 0 ? (stats.sales / stats.leads) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  const rankingCloser = Object.entries(closerStats)
    .map(([name, stats]) => ({ name, ...stats, conversion: stats.leads > 0 ? (stats.sales / stats.leads) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  const analiseNicho = Object.entries(nichoStats)
    .map(([name, stats]) => ({ name, ...stats, conversion: stats.leads > 0 ? (stats.sales / stats.leads) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="space-y-6">
      {/* Additional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {additionalKPIs.map((kpi, index) => (
          <Card key={index} className={`border-l-4 ${kpi.color}`}>
            <CardContent className="p-4">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rankings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking SDR */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ranking SDR</CardTitle>
            <p className="text-sm text-gray-500">Performance detalhada dos SDRs</p>
          </CardHeader>
          <CardContent>
            {rankingSDR.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Nenhum dado de SDR disponível</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rankingSDR.map((sdr, index) => (
                  <div key={sdr.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium capitalize">{sdr.name}</p>
                        <p className="text-sm text-gray-500">{sdr.conversion.toFixed(1)}% conversão</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        R$ {sdr.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sdr.leads} leads • {sdr.sales} vendas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking Closer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ranking Closer</CardTitle>
            <p className="text-sm text-gray-500">Performance detalhada dos Closers</p>
          </CardHeader>
          <CardContent>
            {rankingCloser.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Nenhum dado de Closer disponível</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rankingCloser.map((closer, index) => (
                  <div key={closer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium capitalize">{closer.name}</p>
                        <p className="text-sm text-gray-500">{closer.conversion.toFixed(1)}% conversão</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        R$ {closer.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {closer.leads} leads • {closer.sales} vendas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Análise Detalhada por Nicho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Análise Detalhada por Nicho</CardTitle>
          <p className="text-sm text-gray-500">Performance e métricas por segmento de mercado</p>
        </CardHeader>
        <CardContent>
          {analiseNicho.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Nenhum dado por nicho disponível</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nicho
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leads
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversão
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receita
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analiseNicho.map((nicho) => (
                    <tr key={nicho.name}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{nicho.name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{nicho.leads}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{nicho.sales}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{nicho.conversion.toFixed(1)}%</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          R$ {nicho.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
