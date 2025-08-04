"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  BarChart3,
  DollarSign,
  Settings,
  Save,
  RefreshCw,
} from "lucide-react"
import { useState, useEffect } from "react"
import type { Lead } from "@/app/page"

interface MetasControlProps {
  leads: Lead[]
}

interface TierConfig {
  meta: number
  idealDia: number
  cpmqlMeta: number
  color: string
  icon: string
}

interface MetasConfig {
  [key: string]: TierConfig
}

export function MetasControl({ leads }: MetasControlProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("mes")
  const [selectedSdr, setSelectedSdr] = useState("todos")
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [metasConfig, setMetasConfig] = useState<MetasConfig>({})
  const [isLoading, setIsLoading] = useState(true)

  // Configuração padrão das metas
  const defaultMetasConfig: MetasConfig = {
    "100 a 200k": { meta: 35, idealDia: 5, cpmqlMeta: 700, color: "from-emerald-500 to-teal-600", icon: "🎯" },
    "200 a 400k": { meta: 39, idealDia: 5, cpmqlMeta: 800, color: "from-blue-500 to-cyan-600", icon: "📈" },
    "400 a 1kk": { meta: 25, idealDia: 3, cpmqlMeta: 1000, color: "from-purple-500 to-indigo-600", icon: "🚀" },
    "1 a 4kk": { meta: 15, idealDia: 2, cpmqlMeta: 1600, color: "from-orange-500 to-red-600", icon: "⭐" },
    "4 a 16kk": { meta: 3, idealDia: 0, cpmqlMeta: 1800, color: "from-pink-500 to-rose-600", icon: "💎" },
    "16 a 40kk": { meta: 3, idealDia: 0, cpmqlMeta: 2070, color: "from-violet-500 to-purple-600", icon: "👑" },
    "+40kk": { meta: 3, idealDia: 0, cpmqlMeta: 2070, color: "from-amber-500 to-yellow-600", icon: "🏆" },
    "-100k": { meta: 0, idealDia: 0, cpmqlMeta: 0, color: "from-gray-400 to-gray-600", icon: "📊" },
  }

  // Carregar configurações salvas ou usar padrão
  useEffect(() => {
    const loadConfig = () => {
      try {
        const savedConfig = localStorage.getItem("jasson-metas-config")
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig)
          // Verificar se o config tem todas as propriedades necessárias
          const validConfig = { ...defaultMetasConfig }
          Object.keys(parsedConfig).forEach((tier) => {
            if (parsedConfig[tier] && typeof parsedConfig[tier] === "object") {
              validConfig[tier] = { ...defaultMetasConfig[tier], ...parsedConfig[tier] }
            }
          })
          setMetasConfig(validConfig)
        } else {
          setMetasConfig(defaultMetasConfig)
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error)
        setMetasConfig(defaultMetasConfig)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  // Salvar configurações
  const saveMetasConfig = (newConfig: MetasConfig) => {
    try {
      setMetasConfig(newConfig)
      localStorage.setItem("jasson-metas-config", JSON.stringify(newConfig))
      console.log("✅ Configurações de metas salvas:", newConfig)
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
    }
  }

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

  // Mapear faturamento para tiers exatamente como na imagem
  const mapFaturamentoToTier = (faturamento: string): string => {
    const faturamentoClean = safeString(faturamento).toLowerCase().trim()

    if (!faturamentoClean || faturamentoClean === "" || faturamentoClean === "-") {
      return "-100k"
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
      return "+40kk"
    }

    // Mapeamentos alternativos
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

    // Se não conseguiu mapear, coloca em -100k
    return "-100k"
  }

  // Filter leads by period
  const getFilteredLeads = () => {
    if (!leads || leads.length === 0) return []

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
        filteredLeads = leads
    }

    // Filter by SDR
    if (selectedSdr !== "todos") {
      filteredLeads = filteredLeads.filter((lead) => lead.sdr === selectedSdr)
    }

    return filteredLeads
  }

  // Calcular dados por tier
  const calculateTierData = () => {
    const tierData: Record<string, { realizado: number; totalInvestido: number }> = {}

    // Verificar se metasConfig está carregado
    if (!metasConfig || Object.keys(metasConfig).length === 0) {
      return {}
    }

    // Inicializar todos os tiers
    Object.keys(metasConfig).forEach((tier) => {
      tierData[tier] = { realizado: 0, totalInvestido: 0 }
    })

    // Obter leads filtrados
    const filteredLeads = getFilteredLeads()

    // Contar leads por tier
    filteredLeads.forEach((lead) => {
      const tier = mapFaturamentoToTier(lead.faturamento || "")
      const valorPago = safeNumber(lead.valor_pago_lead)

      // Verificar se o tier existe no tierData
      if (tierData[tier]) {
        tierData[tier].realizado++
        tierData[tier].totalInvestido += valorPago
      }
    })

    return tierData
  }

  // Ordem dos tiers conforme a imagem
  const tierOrder = ["100 a 200k", "200 a 400k", "400 a 1kk", "1 a 4kk", "4 a 16kk", "16 a 40kk", "+40kk", "-100k"]

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getStatusBadge = (percentual: number) => {
    if (percentual >= 100) return { color: "bg-green-500", text: "Meta Atingida", icon: Award }
    if (percentual >= 75) return { color: "bg-blue-500", text: "Quase Lá", icon: TrendingUp }
    if (percentual >= 50) return { color: "bg-yellow-500", text: "Em Progresso", icon: Zap }
    if (percentual >= 25) return { color: "bg-orange-500", text: "Atenção", icon: TrendingDown }
    return { color: "bg-red-500", text: "Crítico", icon: Target }
  }

  const calculateIdealPorDia = (metaMensal: number): number => {
    const hoje = new Date()
    const diaAtual = hoje.getDate()
    const diasDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()

    if (metaMensal === 0 || diasDoMes === 0) return 0

    const idealCalculado = (metaMensal / diasDoMes) * diaAtual
    return Math.round(idealCalculado)
  }

  // Calcular dados apenas se metasConfig estiver carregado
  const tierData = calculateTierData()
  const totalMeta = Object.values(metasConfig).reduce((sum, meta) => sum + (meta?.meta || 0), 0)
  const totalRealizado = Object.values(tierData).reduce((sum, data) => sum + (data?.realizado || 0), 0)
  const percentualGeral = totalMeta > 0 ? (totalRealizado / totalMeta) * 100 : 0

  // Modal de Configuração
  const ConfigModal = () => {
    const [tempConfig, setTempConfig] = useState<MetasConfig>(metasConfig)

    const handleSave = () => {
      saveMetasConfig(tempConfig)
      setIsConfigModalOpen(false)
    }

    const updateTierConfig = (tier: string, field: keyof TierConfig, value: number) => {
      setTempConfig((prev) => ({
        ...prev,
        [tier]: {
          ...prev[tier],
          [field]: value,
        },
      }))
    }

    return (
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-red-600" />
              <span>Configurar Metas por Tier</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Configure as metas mensais de leads e CPMQL para cada tier de faturamento.
                Essas configurações serão salvas e aplicadas automaticamente na análise.
              </p>
            </div>

            <div className="grid gap-4">
              {tierOrder.map((tier) => {
                const config = tempConfig[tier]
                if (!config) return null

                return (
                  <Card key={tier} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center text-white font-bold shadow-lg`}
                          >
                            {config.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{tier}</h3>
                            <p className="text-sm text-gray-500">Configurações do tier</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`meta-${tier}`} className="text-sm font-medium">
                            Meta Mensal (leads)
                          </Label>
                          <Input
                            id={`meta-${tier}`}
                            type="number"
                            value={config.meta}
                            onChange={(e) => updateTierConfig(tier, "meta", Number(e.target.value))}
                            className="mt-1"
                            min="0"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`ideal-${tier}`} className="text-sm font-medium">
                            Ideal por Dia (Calculado)
                          </Label>
                          <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700">
                            {calculateIdealPorDia(config.meta)}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Calculado automaticamente: (Meta Mensal ÷ Dias do Mês) × Dia Atual
                          </p>
                        </div>

                        <div>
                          <Label htmlFor={`cpmql-${tier}`} className="text-sm font-medium">
                            CPMQL Meta (R$)
                          </Label>
                          <Input
                            id={`cpmql-${tier}`}
                            type="number"
                            value={config.cpmqlMeta}
                            onChange={(e) => updateTierConfig(tier, "cpmqlMeta", Number(e.target.value))}
                            className="mt-1"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-500">Carregando configurações de metas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Moderno */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Controle de Metas</h1>
                  <p className="text-red-100">Meta/Mês Compra de Leads</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsConfigModalOpen(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar Metas
              </Button>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white backdrop-blur-sm">
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
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white backdrop-blur-sm">
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
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full"></div>
      </div>

      {/* Cards de Resumo Modernos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
          <CardContent className="relative z-10 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Meta Mensal</p>
                <p className="text-3xl font-bold">{totalMeta}</p>
                <p className="text-blue-100 text-sm">leads esperados</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600"></div>
          <CardContent className="relative z-10 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Total Realizado</p>
                <p className="text-3xl font-bold">{totalRealizado}</p>
                <p className="text-green-100 text-sm">leads conquistados</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              percentualGeral >= 75
                ? "from-emerald-500 to-emerald-600"
                : percentualGeral >= 50
                  ? "from-yellow-500 to-yellow-600"
                  : "from-red-500 to-red-600"
            }`}
          ></div>
          <CardContent className="relative z-10 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Performance Geral</p>
                <p className="text-3xl font-bold">{formatPercentage(percentualGeral)}</p>
                <p className="text-white/80 text-sm">da meta atingida</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal Moderna */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <span>Detalhamento por Tier de Faturamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Header da Tabela */}
              <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-sm">Faturamento</th>
                  <th className="px-6 py-4 text-center font-bold text-sm">Meta</th>
                  <th className="px-6 py-4 text-center font-bold text-sm">Realizado</th>
                  <th className="px-6 py-4 text-center font-bold text-sm">Ideal por Dia</th>
                  <th className="px-6 py-4 text-center font-bold text-sm">% Meta</th>
                  <th className="px-6 py-4 text-center font-bold text-sm">CPMQL Meta</th>
                  <th className="px-6 py-4 text-center font-bold text-sm">CPMQL Real</th>
                  <th className="px-6 py-4 text-center font-bold text-sm">Status</th>
                </tr>
              </thead>

              {/* Linhas de Dados */}
              <tbody className="divide-y divide-gray-100">
                {tierOrder.map((tier, index) => {
                  const meta = metasConfig[tier]
                  if (!meta) return null

                  const tierDataItem = tierData[tier] || { realizado: 0, totalInvestido: 0 }
                  const realizado = tierDataItem.realizado
                  const totalInvestido = tierDataItem.totalInvestido
                  const percentualMeta = meta.meta > 0 ? (realizado / meta.meta) * 100 : 0
                  const cpmqlRealizado = realizado > 0 ? totalInvestido / realizado : 0
                  const status = getStatusBadge(percentualMeta)
                  const StatusIcon = status.icon

                  return (
                    <tr key={tier} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${meta.color} rounded-lg flex items-center justify-center text-white font-bold shadow-lg`}
                          >
                            {meta.icon}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{tier}</div>
                            <div className="text-sm text-gray-500">Tier {index + 1}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-lg text-gray-900">{meta.meta}</div>
                        <div className="text-xs text-gray-500">leads</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-lg text-blue-600">{realizado}</div>
                        <div className="text-xs text-gray-500">conquistados</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-lg text-purple-600">{calculateIdealPorDia(meta.meta)}</div>
                        <div className="text-xs text-gray-500">até hoje</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={`${status.color} text-white font-bold px-3 py-1`}>
                          {formatPercentage(percentualMeta)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-semibold text-gray-900">{formatCurrency(meta.cpmqlMeta)}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`font-semibold ${realizado > 0 ? "text-green-600" : "text-gray-400"}`}>
                          {realizado > 0 ? formatCurrency(cpmqlRealizado) : "R$ 0,00"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className={`w-8 h-8 ${status.color} rounded-full flex items-center justify-center`}>
                            <StatusIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{status.text}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-800">
            <Zap className="w-5 h-5" />
            <span>Insights Inteligentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-800">Melhor Performance</span>
              </div>
              <p className="text-sm text-gray-600">
                {tierOrder.find((tier) => {
                  const meta = metasConfig[tier]
                  const tierDataItem = tierData[tier]
                  return meta && tierDataItem && meta.meta > 0 && (tierDataItem.realizado / meta.meta) * 100 > 0
                }) || "Nenhum tier com performance"}{" "}
                está liderando as metas
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-800">Investimento Total</span>
              </div>
              <p className="text-sm text-gray-600">
                {formatCurrency(Object.values(tierData).reduce((sum, data) => sum + (data?.totalInvestido || 0), 0))}{" "}
                investidos este período
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Configuração */}
      <ConfigModal />
    </div>
  )
}
