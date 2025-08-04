"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, TrendingUp, Target, DollarSign, Users, BarChart3 } from "lucide-react"
import { useState } from "react"
import type { Lead } from "@/app/page"

interface MetasControlProps {
  leads: Lead[]
}

export function MetasControl({ leads }: MetasControlProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("todos")
  const [selectedSdr, setSelectedSdr] = useState("todos")

  // Helper function to safely get numeric value
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined) return 0
    const num = Number.parseFloat(String(value))
    return isNaN(num) ? 0 : num
  }

  // Helper function to safely get string value
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return ""
    return String(value)
  }

  // Mapear faturamento para tiers - VERSÃO MELHORADA
  const mapFaturamentoToTier = (faturamento: string): string => {
    const faturamentoClean = safeString(faturamento).toLowerCase().trim()

    if (!faturamentoClean || faturamentoClean === "" || faturamentoClean === "-") {
      return "Não informado"
    }

    // Mapeamento específico baseado na imagem
    if (faturamentoClean.includes("100") && (faturamentoClean.includes("200") || faturamentoClean.includes("2"))) {
      return "100 a 200k"
    }
    if (faturamentoClean.includes("200") && (faturamentoClean.includes("400") || faturamentoClean.includes("4"))) {
      return "200 a 400k"
    }
    if (faturamentoClean.includes("400") && (faturamentoClean.includes("1") || faturamentoClean.includes("mil"))) {
      return "400 a 1kk"
    }
    if (
      (faturamentoClean.includes("1") && faturamentoClean.includes("4")) ||
      (faturamentoClean.includes("milhão") && faturamentoClean.includes("4"))
    ) {
      return "1 a 4kk"
    }
    if (faturamentoClean.includes("4") && faturamentoClean.includes("16")) {
      return "4 a 16kk"
    }
    if (faturamentoClean.includes("16") && faturamentoClean.includes("40")) {
      return "16 a 40kk"
    }
    if (faturamentoClean.includes("40") || faturamentoClean.includes("acima") || faturamentoClean.includes("mais")) {
      return "Acima 40kk"
    }

    // Mapeamentos alternativos baseados em palavras-chave
    if (faturamentoClean.includes("até 100") || faturamentoClean.includes("100 mil")) {
      return "100 a 200k"
    }
    if (faturamentoClean.includes("pequeno") || faturamentoClean.includes("micro")) {
      return "100 a 200k"
    }
    if (faturamentoClean.includes("médio") || faturamentoClean.includes("medio")) {
      return "400 a 1kk"
    }
    if (faturamentoClean.includes("grande") || faturamentoClean.includes("alto")) {
      return "4 a 16kk"
    }
    if (faturamentoClean.includes("milhão") || faturamentoClean.includes("milhao")) {
      return "1 a 4kk"
    }

    // Se não conseguiu mapear, coloca em "Não informado"
    return "Não informado"
  }

  // Filter leads by period
  const getFilteredLeads = () => {
    const now = new Date()
    let filteredLeads = leads

    // Filter by period
    switch (selectedPeriod) {
      case "hoje":
        filteredLeads = leads.filter((lead) => {
          if (!lead.data_hora_compra) return false
          const leadDate = new Date(lead.data_hora_compra)
          return leadDate.toDateString() === now.toDateString()
        })
        break
      case "semana":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filteredLeads = leads.filter((lead) => {
          if (!lead.data_hora_compra) return false
          const leadDate = new Date(lead.data_hora_compra)
          return leadDate >= weekAgo
        })
        break
      case "mes":
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
        filteredLeads = leads.filter((lead) => {
          if (!lead.data_hora_compra) return false
          const leadDate = new Date(lead.data_hora_compra)
          return leadDate >= monthAgo
        })
        break
      default:
        // "todos" - não filtra por data
        filteredLeads = leads
    }

    // Filter by SDR
    if (selectedSdr !== "todos") {
      filteredLeads = filteredLeads.filter((lead) => lead.sdr === selectedSdr)
    }

    return filteredLeads
  }

  const filteredLeads = getFilteredLeads()

  // Calcular métricas por tier
  const tierAnalysis = () => {
    const tiers: Record<string, { leads: Lead[]; count: number; totalInvestido: number }> = {}

    filteredLeads.forEach((lead) => {
      const tier = mapFaturamentoToTier(lead.faturamento || "")
      const valorPago = safeNumber(lead.valor_pago_lead)

      if (!tiers[tier]) {
        tiers[tier] = { leads: [], count: 0, totalInvestido: 0 }
      }

      tiers[tier].leads.push(lead)
      tiers[tier].count++
      tiers[tier].totalInvestido += valorPago
    })

    const totalLeads = filteredLeads.length
    const totalInvestimento = filteredLeads.reduce((sum, lead) => {
      const valor = safeNumber(lead.valor_pago_lead)
      return sum + valor
    }, 0)

    // Definir ordem correta dos tiers
    const tierOrder = [
      "100 a 200k",
      "200 a 400k",
      "400 a 1kk",
      "1 a 4kk",
      "4 a 16kk",
      "16 a 40kk",
      "Acima 40kk",
      "Não informado",
    ]

    const tierData = tierOrder.map((tierName) => {
      const tierInfo = tiers[tierName] || { leads: [], count: 0, totalInvestido: 0 }
      return {
        tier: tierName,
        count: tierInfo.count,
        percentage: totalLeads > 0 ? (tierInfo.count / totalLeads) * 100 : 0,
        totalInvestido: tierInfo.totalInvestido,
        cpmql: tierInfo.count > 0 ? tierInfo.totalInvestido / tierInfo.count : 0,
        leads: tierInfo.leads,
      }
    })

    return { tierData, totalLeads, totalInvestimento }
  }

  const { tierData, totalLeads, totalInvestimento } = tierAnalysis()

  // Calcular métricas gerais
  const cpmqlGeral = totalLeads > 0 ? totalInvestimento / totalLeads : 0

  // Análise por SDR
  const sdrAnalysis = () => {
    const sdrStats: Record<string, { count: number; investido: number }> = {}

    filteredLeads.forEach((lead) => {
      const sdr = lead.sdr || "Não informado"
      const valor = safeNumber(lead.valor_pago_lead)

      if (!sdrStats[sdr]) {
        sdrStats[sdr] = { count: 0, investido: 0 }
      }

      sdrStats[sdr].count++
      sdrStats[sdr].investido += valor
    })

    return Object.entries(sdrStats).map(([sdr, stats]) => ({
      sdr,
      count: stats.count,
      investido: stats.investido,
      cpmql: stats.count > 0 ? stats.investido / stats.count : 0,
    }))
  }

  const sdrStats = sdrAnalysis()

  // Análise por dia (últimos 7 dias)
  const dailyAnalysis = () => {
    const dailyStats: Record<string, { count: number; investido: number }> = {}

    filteredLeads.forEach((lead) => {
      if (!lead.data_hora_compra) return

      const date = new Date(lead.data_hora_compra).toLocaleDateString("pt-BR")
      const valor = safeNumber(lead.valor_pago_lead)

      if (!dailyStats[date]) {
        dailyStats[date] = { count: 0, investido: 0 }
      }

      dailyStats[date].count++
      dailyStats[date].investido += valor
    })

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        count: stats.count,
        investido: stats.investido,
        cpmql: stats.count > 0 ? stats.investido / stats.count : 0,
      }))
      .sort(
        (a, b) =>
          new Date(a.date.split("/").reverse().join("-")).getTime() -
          new Date(b.date.split("/").reverse().join("-")).getTime(),
      )
  }

  const dailyStats = dailyAnalysis()

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎯 Controle de Metas</h2>
          <p className="text-sm text-gray-500">Análise de investimento e performance de compra de leads</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Última Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedSdr} onValueChange={setSelectedSdr}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos SDRs</SelectItem>
              <SelectItem value="antonio">Antônio</SelectItem>
              <SelectItem value="gabrielli">Gabrielli</SelectItem>
              <SelectItem value="vanessa">Vanessa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Total Investimento
                </p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvestimento)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Total Leads
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  CPMQL Médio
                </p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(cpmqlGeral)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Leads/Dia Médio
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dailyStats.length > 0 ? Math.round(totalLeads / dailyStats.length) : totalLeads}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Tier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Distribuição por Tier de Faturamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Distribuição por tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">R$</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPMQL médio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qnt leads</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tierData
                  .filter((tier) => tier.count > 0)
                  .map((tier) => (
                    <tr key={tier.tier} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tier.tier}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant="outline">{formatPercentage(tier.percentage)}</Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(tier.totalInvestido)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(tier.cpmql)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{tier.count}</div>
                      </td>
                    </tr>
                  ))}

                {/* Linha de Total */}
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">TOTAL</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge className="bg-gray-600">100%</Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(totalInvestimento)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(cpmqlGeral)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{totalLeads}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance por SDR e Análise Diária */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance por SDR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Performance por SDR</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sdrStats.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum dado para o período selecionado</p>
                </div>
              ) : (
                sdrStats.map((sdr) => (
                  <div key={sdr.sdr} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{sdr.sdr}</p>
                      <p className="text-sm text-gray-500">{sdr.count} leads</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(sdr.investido)}</p>
                      <p className="text-sm text-gray-500">CPMQL: {formatCurrency(sdr.cpmql)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Análise Diária */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>Análise por Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dailyStats.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum dado para o período selecionado</p>
                </div>
              ) : (
                dailyStats.map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium">{day.date}</p>
                      <p className="text-sm text-gray-500">{day.count} leads</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(day.investido)}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(day.cpmql)}/lead</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
