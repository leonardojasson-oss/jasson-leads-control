"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import type { Lead } from "@/app/page"

interface DashboardAnalyticsProps {
  leads: Lead[]
}

export function DashboardAnalytics({ leads }: DashboardAnalyticsProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [dateFilterColumn, setDateFilterColumn] = useState<string>("")
  const [dateFilterStart, setDateFilterStart] = useState<string>("")
  const [dateFilterEnd, setDateFilterEnd] = useState<string>("")
  const [origemLeadFilter, setOrigemLeadFilter] = useState<string>("todos")

  const searchParams = useSearchParams()
  const router = useRouter()

  const dateFilterOptions = [
    { value: "data_reuniao", label: "DATA DA REUNIÃO" },
    { value: "data_ultimo_contato", label: "DATA ÚLTIMO CONTATO" },
    { value: "data_hora_compra", label: "DATA DA COMPRA" },
    { value: "data_marcacao", label: "DATA DA MARCAÇÃO" },
    { value: "data_assinatura", label: "DATA DE ASSINATURA" },
  ]

  const origemLeadOptions = [
    { value: "todos", label: "Todos (Geral)" },
    { value: "LeadBroker", label: "LeadBroker" },
    { value: "Blackbox", label: "Blackbox" },
    { value: "Outbound", label: "Outbound" },
    { value: "Indicação", label: "Indicação" },
    { value: "Networking", label: "Networking" },
    { value: "Recomendação", label: "Recomendação" },
    { value: "Evento", label: "Evento" },
  ]

  function pad(n: number) {
    return n.toString().padStart(2, "0")
  }

  function getCurrentMonthRangeLocal() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    const start = new Date(year, month, 1, 0, 0, 0, 0)
    const today = new Date()
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    const fromISO = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
    const toISO = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

    return { start, end, fromISO, toISO }
  }

  useEffect(() => {
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    if (fromParam && toParam) {
      setStartDate(fromParam)
      setEndDate(toParam)
    } else {
      const { fromISO, toISO } = getCurrentMonthRangeLocal()
      setStartDate(fromISO)
      setEndDate(toISO)

      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.set("from", fromISO)
      newSearchParams.set("to", toISO)
      router.replace(`?${newSearchParams.toString()}`, { scroll: false })
    }
  }, [searchParams, router])

  const updateURL = (from: string, to: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    if (from && to) {
      newSearchParams.set("from", from)
      newSearchParams.set("to", to)
    } else {
      newSearchParams.delete("from")
      newSearchParams.delete("to")
    }
    router.replace(`?${newSearchParams.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    const { fromISO, toISO } = getCurrentMonthRangeLocal()
    setStartDate(fromISO)
    setEndDate(toISO)
    updateURL(fromISO, toISO)
  }

  const handleStartDateChange = (value: string) => {
    setStartDate(value)
    if (value && endDate) {
      updateURL(value, endDate)
    }
  }

  const handleEndDateChange = (value: string) => {
    setEndDate(value)
    if (startDate && value) {
      updateURL(startDate, value)
    }
  }

  const getFilteredLeads = () => {
    console.log("[v0] getFilteredLeads - leads totais:", leads?.length)
    console.log("[v0] getFilteredLeads - startDate:", startDate, "endDate:", endDate)
    console.log("[v0] getFilteredLeads - dateFilterColumn:", dateFilterColumn)
    console.log("[v0] getFilteredLeads - origemLeadFilter:", origemLeadFilter)

    if (!leads || leads.length === 0) return []

    let filteredLeads = leads

    if (startDate && endDate) {
      filteredLeads = leads.filter((lead) => {
        const leadDate = lead.data_hora_compra
        if (!leadDate) return false
        const date = new Date(leadDate).toISOString().split("T")[0]
        const isInRange = date >= startDate && date <= endDate
        return isInRange
      })
      console.log("[v0] getFilteredLeads - após filtro de data:", filteredLeads.length)
    }

    if (origemLeadFilter && origemLeadFilter !== "todos") {
      const beforeOrigemFilter = filteredLeads.length
      filteredLeads = filteredLeads.filter((lead) => {
        const origem = (lead.tipo_lead || lead.origem_lead || lead.origemLead || "").toLowerCase()
        const filterValue = origemLeadFilter.toLowerCase()

        // Para LeadBroker, aceitar tanto "leadbroker" quanto "lead broker"
        if (filterValue === "leadbroker") {
          return origem === "leadbroker" || origem === "lead broker"
        }

        return origem === filterValue
      })
      console.log("[v0] getFilteredLeads - após filtro de origem:", filteredLeads.length, "antes:", beforeOrigemFilter)
    }

    console.log("[v0] getFilteredLeads - resultado final:", filteredLeads.length)
    return filteredLeads
  }

  const filteredLeads = getFilteredLeads()

  const calculateFunnel = (leadsData: Lead[]) => {
    const totalLeads = leadsData.length
    const contato = leadsData.filter((lead) => lead.conseguiu_contato).length
    const agendada = leadsData.filter((lead) => lead.reuniao_agendada).length
    const realizada = leadsData.filter((lead) => lead.reuniao_realizada).length
    const vendas = leadsData.filter((lead) => lead.data_assinatura && lead.status === "GANHO").length

    const leadsComAssinatura = leadsData.filter((lead) => lead.data_assinatura)

    const feeMrr = leadsComAssinatura.reduce((sum, lead) => {
      const fee = Number.parseFloat(String(lead.fee_mrr || "0"))
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
    const statusHierarchy = [
      "BACKLOG",
      "TENTANDO CONTATO",
      "QUALI AGENDADA",
      "QUALIFICANDO",
      "REUNIÃO AGENDADA",
      "REUNIÃO REALIZADA",
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
        (lead.fee_mrr && Number.parseFloat(String(lead.fee_mrr)) > 0) ||
        (lead.escopo_fechado && Number.parseFloat(String(lead.escopo_fechado)) > 0)
      const noDataAssinatura = !lead.data_assinatura
      const noMotivoPerda = !lead.motivo_perda || lead.motivo_perda.trim() === ""
      const currentStatusIndex = statusHierarchy.indexOf(lead.status || "")
      const statusQualified = currentStatusIndex >= minStatusIndex && currentStatusIndex !== -1

      return hasFeeValue && noDataAssinatura && noMotivoPerda && statusQualified
    })

    const quantidade = forecastLeads.length

    const potencialFeeMrr = forecastLeads.reduce((sum, lead) => {
      const fee = Number.parseFloat(String(lead.fee_mrr || "0"))
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
      "REUNIÃO REALIZADA",
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
        (lead.fee_mrr && Number.parseFloat(String(lead.fee_mrr)) > 0) ||
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

          const feeMrr = Number.parseFloat(String(lead.fee_mrr || "0"))
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

  const getDisplayPeriod = () => {
    if (startDate && endDate) {
      const [startYear, startMonth, startDay] = startDate.split("-").map(Number)
      const [endYear, endMonth, endDay] = endDate.split("-").map(Number)

      const start = new Date(startYear, startMonth - 1, startDay)
      const end = new Date(endYear, endMonth - 1, endDay)

      const startFormatted = start.toLocaleDateString("pt-BR")
      const endFormatted = end.toLocaleDateString("pt-BR")

      return `${startFormatted} até ${endFormatted}`
    }
    return "Período não definido"
  }

  const applyDateFilter = () => {
    if (!dateFilterColumn) {
      alert("Por favor, selecione uma coluna para filtrar.")
      return
    }
    if (!dateFilterStart || !dateFilterEnd) {
      alert("Por favor, selecione as datas de início e fim.")
      return
    }
  }

  const clearDateFilter = () => {
    setDateFilterColumn("")
    setDateFilterStart("")
    setDateFilterEnd("")
  }

  return (
    <div className="space-y-4">
      <div
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white relative overflow-hidden"
        style={{ padding: "12px 16px" }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="da-header-row" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="da-title" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold">Dashboard & Analytics</h1>
              </div>
              <p className="text-sm text-white/80">
                Análise de Performance e Funis de Conversão • {getDisplayPeriod()}
                {origemLeadFilter !== "todos" && (
                  <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">
                    Origem: {origemLeadOptions.find((opt) => opt.value === origemLeadFilter)?.label}
                  </span>
                )}
              </p>
            </div>

            <div
              className="da-datebar"
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "nowrap",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.85)",
                  marginRight: "4px",
                }}
              >
                De
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="date-input"
                style={{
                  height: "32px",
                  minWidth: "150px",
                  fontSize: "14px",
                  padding: "0 8px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
                placeholder="dd/mm/aaaa"
              />
              <label
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.85)",
                  marginRight: "4px",
                }}
              >
                até
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="date-input"
                style={{
                  height: "32px",
                  minWidth: "150px",
                  fontSize: "14px",
                  padding: "0 8px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
                placeholder="dd/mm/aaaa"
              />
              <Button
                onClick={clearFilters}
                className="btn-clear"
                style={{
                  height: "32px",
                  padding: "0 10px",
                  fontSize: "13px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="flex items-center space-x-4 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">🎯 Origem do Lead:</label>
            <Select value={origemLeadFilter} onValueChange={setOrigemLeadFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione uma origem" />
              </SelectTrigger>
              <SelectContent>
                {origemLeadOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">📅 Filtrar por período:</label>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Filtrar por:</label>
            <Select value={dateFilterColumn} onValueChange={setDateFilterColumn}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione uma coluna" />
              </SelectTrigger>
              <SelectContent>
                {dateFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">De:</label>
            <Input
              type="date"
              value={dateFilterStart}
              onChange={(e) => setDateFilterStart(e.target.value)}
              className="w-36"
              placeholder="dd/mm/aaaa"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Até:</label>
            <Input
              type="date"
              value={dateFilterEnd}
              onChange={(e) => setDateFilterEnd(e.target.value)}
              className="w-36"
              placeholder="dd/mm/aaaa"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={applyDateFilter} className="h-8">
              Aplicar Filtro
            </Button>
            <Button variant="outline" onClick={clearDateFilter} className="h-8 bg-transparent">
              Limpar Filtro
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <VisualFunnel title="🎯 Funil Geral" funnel={generalFunnel} totalLeads={filteredLeads.length} color="#dc2626" />
      </div>

      <div className="mb-4">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-orange-600">📈</span>
            Forecast – Propostas em Aberto
          </h2>
          <p className="text-sm text-gray-500">Potencial de receita futura • Propostas apresentadas mas não fechadas</p>
        </div>

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

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">👥 Funis por Closer</h2>

        {closerFunnels.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {closerFunnels.map((closerFunnel, index) => {
              const colors = [
                "#2563eb",
                "#dc2626",
                "#059669",
                "#7c3aed",
                "#ea580c",
                "#0891b2",
                "#be123c",
                "#65a30d",
                "#4338ca",
                "#c2410c",
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

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">🎯 Funis por SDR</h2>

        {sdrFunnels.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {sdrFunnels.map((sdrFunnel, index) => {
              const colors = [
                "#16a34a",
                "#dc2626",
                "#2563eb",
                "#7c3aed",
                "#ea580c",
                "#0891b2",
                "#be123c",
                "#65a30d",
                "#4338ca",
                "#c2410c",
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
