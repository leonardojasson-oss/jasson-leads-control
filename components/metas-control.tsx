"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target, TrendingUp, TrendingDown, Award, Zap, BarChart3, Settings, Save, RefreshCw, Users } from "lucide-react"
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

interface ArrematadorTierMetas {
  [arrematador: string]: {
    [tier: string]: number
  }
}

export function MetasControl({ leads }: MetasControlProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("mes")
  const [selectedSdr, setSelectedSdr] = useState("todos")
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [metasConfig, setMetasConfig] = useState<MetasConfig>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isArrematadorModalOpen, setIsArrematadorModalOpen] = useState(false)
  const [arrematadorMetas, setArrematadorMetas] = useState<ArrematadorTierMetas>({})

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

  // Mapear faturamento para tiers
  const mapFaturamentoToTier = (faturamento: string): string => {
    const faturamentoClean = safeString(faturamento).toLowerCase().trim()

    if (!faturamentoClean || faturamentoClean === "" || faturamentoClean === "-") {
      return "-100k"
    }

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

    return "-100k"
  }

  // Filter leads by period
  const getFilteredLeads = () => {
    if (!leads || leads.length === 0) return []

    const now = new Date()
    let filteredLeads = leads

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

    if (selectedSdr !== "todos") {
      filteredLeads = filteredLeads.filter((lead) => lead.sdr === selectedSdr)
    }

    return filteredLeads
  }

  // Calcular dados por tier
  const calculateTierData = () => {
    const tierData: Record<string, { realizado: number; totalInvestido: number }> = {}

    if (!metasConfig || Object.keys(metasConfig).length === 0) {
      return {}
    }

    Object.keys(metasConfig).forEach((tier) => {
      tierData[tier] = { realizado: 0, totalInvestido: 0 }
    })

    const filteredLeads = getFilteredLeads()

    filteredLeads.forEach((lead) => {
      const tier = mapFaturamentoToTier(lead.faturamento || "")
      const valorPago = safeNumber(lead.valor_pago_lead)

      if (tierData[tier]) {
        tierData[tier].realizado++
        tierData[tier].totalInvestido += valorPago
      }
    })

    return tierData
  }

  // Ordem dos tiers
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

  // Carregar metas dos arrematadores por tier
  useEffect(() => {
    const loadArrematadorMetas = () => {
      try {
        const savedMetas = localStorage.getItem("jasson-arrematador-tier-metas")
        if (savedMetas) {
          setArrematadorMetas(JSON.parse(savedMetas))
        } else {
          // Metas padrão por tier
          const defaultArrematadorMetas: ArrematadorTierMetas = {}
          const arrematadores = ["alan", "antonio", "gabrielli", "jasson", "vanessa", "william"]

          arrematadores.forEach((arr) => {
            defaultArrematadorMetas[arr] = {
              "100 a 200k": 8,
              "200 a 400k": 6,
              "400 a 1kk": 4,
              "1 a 4kk": 3,
              "4 a 16kk": 1,
              "16 a 40kk": 1,
              "+40kk": 1,
              "-100k": 0,
            }
          })

          setArrematadorMetas(defaultArrematadorMetas)
        }
      } catch (error) {
        console.error("Erro ao carregar metas dos arrematadores:", error)
      }
    }

    if (!isLoading) {
      loadArrematadorMetas()
    }
  }, [isLoading])

  // Salvar metas dos arrematadores
  const saveArrematadorMetas = (newMetas: ArrematadorTierMetas) => {
    try {
      setArrematadorMetas(newMetas)
      localStorage.setItem("jasson-arrematador-tier-metas", JSON.stringify(newMetas))
      console.log("✅ Metas dos arrematadores salvas:", newMetas)
    } catch (error) {
      console.error("Erro ao salvar metas dos arrematadores:", error)
    }
  }

  // Calcular dados dos arrematadores por tier
  const calculateArrematadorData = () => {
    const arrematadorData: Record<
      string,
      {
        totalRealizado: number
        totalMeta: number
        percentualGeral: number
        tierData: Record<string, { realizado: number; meta: number }>
      }
    > = {}

    const arrematadores = ["alan", "antonio", "gabrielli", "jasson", "vanessa", "william"]

    // Inicializar dados
    arrematadores.forEach((arr) => {
      arrematadorData[arr] = {
        totalRealizado: 0,
        totalMeta: 0,
        percentualGeral: 0,
        tierData: {},
      }

      // Inicializar dados por tier
      tierOrder.forEach((tier) => {
        arrematadorData[arr].tierData[tier] = {
          realizado: 0,
          meta: arrematadorMetas[arr]?.[tier] || 0,
        }
      })
    })

    // Contar leads por arrematador e tier
    const filteredLeads = getFilteredLeads()
    filteredLeads.forEach((lead) => {
      const arr = lead.arrematador?.toLowerCase()
      const tier = mapFaturamentoToTier(lead.faturamento || "")

      if (arr && arrematadorData[arr] && arrematadorData[arr].tierData[tier]) {
        arrematadorData[arr].tierData[tier].realizado++
        arrematadorData[arr].totalRealizado++
      }
    })

    // Calcular totais e percentuais
    Object.keys(arrematadorData).forEach((arr) => {
      const data = arrematadorData[arr]
      data.totalMeta = Object.values(data.tierData).reduce((sum, tier) => sum + tier.meta, 0)
      data.percentualGeral = data.totalMeta > 0 ? (data.totalRealizado / data.totalMeta) * 100 : 0
    })

    return arrematadorData
  }

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

  // Modal de Metas dos Arrematadores por Tier
  const ArrematadorMetasModal = () => {
    const [tempMetas, setTempMetas] = useState<ArrematadorTierMetas>(arrematadorMetas)

    const handleSave = () => {
      saveArrematadorMetas(tempMetas)
      setIsArrematadorModalOpen(false)
    }

    const updateMeta = (arrematador: string, tier: string, meta: number) => {
      setTempMetas((prev) => ({
        ...prev,
        [arrematador]: {
          ...prev[arrematador],
          [tier]: meta,
        },
      }))
    }

    const arrematadores = [
      { key: "alan", name: "Alan", color: "from-blue-500 to-blue-600", icon: "🎯" },
      { key: "antonio", name: "Antônio", color: "from-green-500 to-green-600", icon: "📈" },
      { key: "gabrielli", name: "Gabrielli", color: "from-purple-500 to-purple-600", icon: "🚀" },
      { key: "jasson", name: "Jasson", color: "from-red-500 to-red-600", icon: "⭐" },
      { key: "vanessa", name: "Vanessa", color: "from-pink-500 to-pink-600", icon: "💎" },
      { key: "william", name: "William", color: "from-orange-500 to-orange-600", icon: "👑" },
    ]

    return (
      <Dialog open={isArrematadorModalOpen} onOpenChange={setIsArrematadorModalOpen}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Configurar Metas dos Arrematadores por Tier</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>🎯 Configuração:</strong> Defina a meta mensal de leads por tier de faturamento para cada
                arrematador.
              </p>
            </div>

            <div className="space-y-4">
              {arrematadores.map((arr) => (
                <Card key={arr.key} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div
                        className={`w-8 h-8 bg-gradient-to-br ${arr.color} rounded-lg flex items-center justify-center text-white font-bold shadow-lg`}
                      >
                        <span className="text-sm">{arr.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 capitalize">{arr.name}</h3>
                        <p className="text-sm text-gray-500">Metas por tier de faturamento</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                      {tierOrder.map((tier) => {
                        const tierConfig = metasConfig[tier]
                        return (
                          <div key={tier} className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">{tier}</Label>
                            <div className="flex items-center space-x-1">
                              <div
                                className={`w-4 h-4 bg-gradient-to-br ${tierConfig?.color} rounded flex items-center justify-center`}
                              >
                                <span className="text-xs">{tierConfig?.icon}</span>
                              </div>
                              <Input
                                type="number"
                                value={tempMetas[arr.key]?.[tier] || 0}
                                onChange={(e) => updateMeta(arr.key, tier, Number(e.target.value))}
                                className="h-8 text-xs"
                                min="0"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsArrematadorModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar Metas
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
    <div className="space-y-6">
      {/* Header Compacto */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Controle de Metas</h1>
                <p className="text-red-100 text-sm">Meta/Mês Compra de Leads</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsConfigModalOpen(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm text-sm h-8"
              >
                <Settings className="w-3 h-3 mr-1" />
                Config
              </Button>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white backdrop-blur-sm h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mês</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSdr} onValueChange={setSelectedSdr}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white backdrop-blur-sm h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="antonio">Antônio</SelectItem>
                  <SelectItem value="gabrielli">Gabrielli</SelectItem>
                  <SelectItem value="vanessa">Vanessa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo Compactos */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
          <CardContent className="relative z-10 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium mb-1">Meta Total</p>
                <p className="text-2xl font-bold">{totalMeta}</p>
              </div>
              <Target className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600"></div>
          <CardContent className="relative z-10 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium mb-1">Realizado</p>
                <p className="text-2xl font-bold">{totalRealizado}</p>
              </div>
              <Award className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              percentualGeral >= 75
                ? "from-emerald-500 to-emerald-600"
                : percentualGeral >= 50
                  ? "from-yellow-500 to-yellow-600"
                  : "from-red-500 to-red-600"
            }`}
          ></div>
          <CardContent className="relative z-10 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs font-medium mb-1">Performance</p>
                <p className="text-2xl font-bold">{formatPercentage(percentualGeral)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal Compacta */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b py-3">
          <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-red-600" />
            <span>Detalhamento por Tier</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-xs">Tier</th>
                  <th className="px-4 py-3 text-center font-bold text-xs">Meta</th>
                  <th className="px-4 py-3 text-center font-bold text-xs">Real</th>
                  <th className="px-4 py-3 text-center font-bold text-xs">Ideal</th>
                  <th className="px-4 py-3 text-center font-bold text-xs">%</th>
                  <th className="px-4 py-3 text-center font-bold text-xs">CPMQL</th>
                  <th className="px-4 py-3 text-center font-bold text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tierOrder.map((tier) => {
                  const meta = metasConfig[tier]
                  if (!meta) return null

                  const tierDataItem = tierData[tier] || { realizado: 0, totalInvestido: 0 }
                  const realizado = tierDataItem.realizado
                  const totalInvestido = tierDataItem.totalInvestido
                  const percentualMeta = meta.meta > 0 ? (realizado / meta.meta) * 100 : 0
                  const cpmqlRealizado = realizado > 0 ? totalInvestido / realizado : 0
                  const status = getStatusBadge(percentualMeta)

                  return (
                    <tr key={tier} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-6 h-6 bg-gradient-to-br ${meta.color} rounded flex items-center justify-center text-white text-xs font-bold`}
                          >
                            {meta.icon}
                          </div>
                          <span className="font-medium text-sm text-gray-900">{tier}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-gray-900">{meta.meta}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-blue-600">{realizado}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-purple-600">{calculateIdealPorDia(meta.meta)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`${status.color} text-white font-bold text-xs px-2 py-1`}>
                          {formatPercentage(percentualMeta)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-xs">
                          <div className="font-semibold text-gray-600">{formatCurrency(meta.cpmqlMeta)}</div>
                          <div className={`${realizado > 0 ? "text-green-600" : "text-gray-400"}`}>
                            {realizado > 0 ? formatCurrency(cpmqlRealizado) : "R$ 0"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className={`w-6 h-6 ${status.color} rounded-full flex items-center justify-center mx-auto`}
                        >
                          <status.icon className="w-3 h-3 text-white" />
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

      {/* Seção dos Arrematadores Compacta */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 border-b py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-600" />
              <span>Performance dos Arrematadores</span>
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setIsArrematadorModalOpen(true)}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 text-sm h-8"
            >
              <Settings className="w-3 h-3 mr-1" />
              Config
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {(() => {
              const arrematadorData = calculateArrematadorData()
              const arrematadores = [
                { key: "alan", name: "Alan", color: "from-blue-500 to-blue-600", icon: "🎯" },
                { key: "antonio", name: "Antônio", color: "from-green-500 to-green-600", icon: "📈" },
                { key: "gabrielli", name: "Gabrielli", color: "from-purple-500 to-purple-600", icon: "🚀" },
                { key: "jasson", name: "Jasson", color: "from-red-500 to-red-600", icon: "⭐" },
                { key: "vanessa", name: "Vanessa", color: "from-pink-500 to-pink-600", icon: "💎" },
                { key: "william", name: "William", color: "from-orange-500 to-orange-600", icon: "👑" },
              ]

              return arrematadores.map((arr) => {
                const data = arrematadorData[arr.key]
                const status = getStatusBadge(data.percentualGeral)

                return (
                  <Card
                    key={arr.key}
                    className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${arr.color}`}></div>
                    <CardContent className="relative z-10 p-3 text-white">
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center space-x-1">
                          <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center backdrop-blur-sm">
                            <span className="text-xs">{arr.icon}</span>
                          </div>
                          <h3 className="font-bold text-sm">{arr.name}</h3>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white/80">Real:</span>
                            <span className="font-bold">{data.totalRealizado}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-white/80">Meta:</span>
                            <span className="font-semibold">{data.totalMeta}</span>
                          </div>
                          <Badge className={`${status.color} text-white text-xs px-2 py-0.5 w-full justify-center`}>
                            {formatPercentage(data.percentualGeral)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Metas dos Arrematadores */}
      <ArrematadorMetasModal />

      {/* Modal de Configuração */}
      <ConfigModal />
    </div>
  )
}
