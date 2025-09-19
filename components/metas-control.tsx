"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  BarChart3,
  Settings,
  Save,
  RefreshCw,
  Users,
  Calendar,
  CheckCircle,
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

interface SDRMetasConfig {
  metaRM: number // Meta de Reuniões Marcadas
  metaRR: number // Meta de Reuniões Realizadas
  color: string
  icon: string
}

interface SDRsMetasConfig {
  [key: string]: SDRMetasConfig
}

interface CloserMetasConfig {
  metaRR: number // Meta de Reuniões Realizadas
  metaVendas: number // Meta de Vendas
  metaFeeMRR: number // Meta de FEE MRR
  metaFeeOneTime: number // Meta de FEE ONE-TIME
  color: string
  icon: string
}

interface ClosersMetasConfig {
  [key: string]: CloserMetasConfig
}

interface NovasMetasConfig {
  feeMRR: number
  feeOneTime: number
  leads: number
  rm: number
  rr: number
  logos: number
}

export default function MetasControl({ leads }: MetasControlProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isSDRConfigModalOpen, setIsSDRConfigModalOpen] = useState(false)
  const [isCloserConfigModalOpen, setIsCloserConfigModalOpen] = useState(false)
  const [metasConfig, setMetasConfig] = useState<MetasConfig>({})
  const [sdrMetasConfig, setSDRMetasConfig] = useState<SDRsMetasConfig>({})
  const [closerMetasConfig, setCloserMetasConfig] = useState<ClosersMetasConfig>({})
  const [isLoading, setIsLoading] = useState(true)

  const [novasMetasConfig, setNovasMetasConfig] = useState<NovasMetasConfig>({
    feeMRR: 0,
    feeOneTime: 0,
    leads: 0,
    rm: 0,
    rr: 0,
    logos: 0,
  })
  const [isNovasMetasConfigModalOpen, setIsNovasMetasConfigModalOpen] = useState(false)

  // Configuração padrão das metas
  const defaultMetasConfig: MetasConfig = {
    "101 a 200k": { meta: 35, idealDia: 5, cpmqlMeta: 700, color: "from-emerald-500 to-teal-600", icon: "🎯" },
    "201 a 400k": { meta: 39, idealDia: 5, cpmqlMeta: 800, color: "from-blue-500 to-cyan-600", icon: "📈" },
    "401 a 1kk": { meta: 25, idealDia: 3, cpmqlMeta: 1000, color: "from-purple-500 to-indigo-600", icon: "🚀" },
    "1 a 4kk": { meta: 15, idealDia: 2, cpmqlMeta: 1600, color: "from-orange-500 to-red-600", icon: "⭐" },
    "4 a 16kk": { meta: 3, idealDia: 0, cpmqlMeta: 1800, color: "from-pink-500 to-rose-600", icon: "💎" },
    "16 a 40kk": { meta: 3, idealDia: 0, cpmqlMeta: 2070, color: "from-violet-500 to-purple-600", icon: "👑" },
    "+40kk": { meta: 3, idealDia: 0, cpmqlMeta: 2070, color: "from-amber-500 to-yellow-600", icon: "🏆" },
    "-100k": { meta: 0, idealDia: 0, cpmqlMeta: 0, color: "from-gray-400 to-gray-600", icon: "📊" },
  }

  const defaultSDRMetasConfig: SDRsMetasConfig = {
    gabrielli: { metaRM: 63, metaRR: 57, color: "from-blue-500 to-blue-600", icon: "🎯" },
    vanessa: { metaRM: 50, metaRR: 45, color: "from-green-500 to-green-600", icon: "📈" },
    antonio: { metaRM: 60, metaRR: 54, color: "from-purple-500 to-purple-600", icon: "🚀" },
  }

  const defaultCloserMetasConfig: ClosersMetasConfig = {
    alan: {
      metaRR: 30,
      metaVendas: 8,
      metaFeeMRR: 15000,
      metaFeeOneTime: 50000,
      color: "from-blue-500 to-blue-600",
      icon: "🎯",
    },
    giselle: {
      metaRR: 25,
      metaVendas: 6,
      metaFeeMRR: 12000,
      metaFeeOneTime: 40000,
      color: "from-green-500 to-green-600",
      icon: "📈",
    },
    leonardo: {
      metaRR: 28,
      metaVendas: 7,
      metaFeeMRR: 14000,
      metaFeeOneTime: 45000,
      color: "from-purple-500 to-purple-600",
      icon: "🚀",
    },
    francisco: {
      metaRR: 20,
      metaVendas: 5,
      metaFeeMRR: 10000,
      metaFeeOneTime: 35000,
      color: "from-orange-500 to-orange-600",
      icon: "⭐",
    },
  }

  const defaultNovasMetasConfig: NovasMetasConfig = {
    feeMRR: 50000,
    feeOneTime: 150000,
    leads: 100,
    rm: 150,
    rr: 120,
    logos: 25,
  }

  // Carregar configurações salvas ou usar padrão
  useEffect(() => {
    const loadConfig = () => {
      try {
        const savedConfig = localStorage.getItem("jasson-metas-config")
        const savedSDRConfig = localStorage.getItem("jasson-sdr-metas-config")
        const savedCloserConfig = localStorage.getItem("jasson-closer-metas-config")

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

        if (savedSDRConfig) {
          const parsedSDRConfig = JSON.parse(savedSDRConfig)
          const validSDRConfig = { ...defaultSDRMetasConfig }
          Object.keys(parsedSDRConfig).forEach((sdr) => {
            if (parsedSDRConfig[sdr] && typeof parsedSDRConfig[sdr] === "object") {
              validSDRConfig[sdr] = { ...defaultSDRMetasConfig[sdr], ...parsedSDRConfig[sdr] }
            }
          })
          setSDRMetasConfig(validSDRConfig)
        } else {
          setSDRMetasConfig(defaultSDRMetasConfig)
        }

        if (savedCloserConfig) {
          const parsedCloserConfig = JSON.parse(savedCloserConfig)
          const validCloserConfig = { ...defaultCloserMetasConfig }
          Object.keys(parsedCloserConfig).forEach((closer) => {
            if (parsedCloserConfig[closer] && typeof parsedCloserConfig[closer] === "object") {
              validCloserConfig[closer] = { ...defaultCloserMetasConfig[closer], ...parsedCloserConfig[closer] }
            }
          })
          setCloserMetasConfig(validCloserConfig)
        } else {
          setCloserMetasConfig(defaultCloserMetasConfig)
        }

        const savedNovasMetasConfig = localStorage.getItem("jasson-novas-metas-config")
        if (savedNovasMetasConfig) {
          const parsedConfig = JSON.parse(savedNovasMetasConfig)
          setNovasMetasConfig({ ...defaultNovasMetasConfig, ...parsedConfig })
        } else {
          setNovasMetasConfig(defaultNovasMetasConfig)
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error)
        setMetasConfig(defaultMetasConfig)
        setSDRMetasConfig(defaultSDRMetasConfig)
        setCloserMetasConfig(defaultCloserMetasConfig)
        setNovasMetasConfig(defaultNovasMetasConfig)
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

  const saveSDRMetasConfig = (newConfig: SDRsMetasConfig) => {
    try {
      setSDRMetasConfig(newConfig)
      localStorage.setItem("jasson-sdr-metas-config", JSON.stringify(newConfig))
      console.log("✅ Configurações de metas dos SDRs salvas:", newConfig)
    } catch (error) {
      console.error("Erro ao salvar configurações dos SDRs:", error)
    }
  }

  const saveCloserMetasConfig = (newConfig: ClosersMetasConfig) => {
    try {
      setCloserMetasConfig(newConfig)
      localStorage.setItem("jasson-closer-metas-config", JSON.stringify(newConfig))
      console.log("✅ Configurações de metas dos Closers salvas:", newConfig)
    } catch (error) {
      console.error("Erro ao salvar configurações dos Closers:", error)
    }
  }

  const saveNovasMetasConfig = (newConfig: NovasMetasConfig) => {
    try {
      setNovasMetasConfig(newConfig)
      localStorage.setItem("jasson-novas-metas-config", JSON.stringify(newConfig))
      console.log("✅ Configurações das novas metas salvas:", newConfig)
    } catch (error) {
      console.error("Erro ao salvar configurações das novas metas:", error)
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

  // Mapear faturamento para tiers - VERSÃO COM REGEX ROBUSTA
  const mapFaturamentoToTier = (faturamento: string): string => {
    const faturamentoOriginal = safeString(faturamento)

    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/\s+/g, " ") // Normaliza espaços
        .trim()
    }

    const faturamentoNorm = normalizeText(faturamentoOriginal)

    console.log("[v0] DEBUG - Faturamento original:", faturamentoOriginal)
    console.log("[v0] DEBUG - Faturamento normalizado:", faturamentoNorm)

    // Se não há faturamento ou está vazio, vai para -100k
    if (
      !faturamentoNorm ||
      faturamentoNorm === "" ||
      faturamentoNorm === "-" ||
      faturamentoNorm === "null" ||
      faturamentoNorm === "undefined"
    ) {
      console.log("[v0] DEBUG - Faturamento vazio, indo para -100k")
      return "-100k"
    }

    if (
      /de\s*5[01]\s*mil\s*(a|à)\s*7[0]\s*mil/i.test(faturamentoNorm) ||
      /de\s*7[01]\s*mil\s*(a|à)\s*100\s*mil/i.test(faturamentoNorm)
    ) {
      console.log("[v0] DEBUG - Mapeado para -100k (51-70 mil ou 71-100 mil)")
      return "-100k"
    }

    if (/de\s*10[01]\s*mil\s*(a|à)\s*200\s*mil/i.test(faturamentoNorm)) {
      console.log("[v0] DEBUG - Mapeado para 101 a 200k")
      return "101 a 200k"
    }

    if (/de\s*20[01]\s*mil\s*(a|à)\s*400\s*mil/i.test(faturamentoNorm)) {
      console.log("[v0] DEBUG - Mapeado para 201 a 400k")
      return "201 a 400k"
    }

    if (/de\s*40[01]\s*mil\s*(a|à)\s*1\s*(milhao|milhoes)/i.test(faturamentoNorm)) {
      console.log("[v0] DEBUG - Mapeado para 401 a 1kk")
      return "401 a 1kk"
    }

    if (/de\s*1\s*(a|à)\s*4\s*(milhao|milhoes)/i.test(faturamentoNorm)) {
      console.log("[v0] DEBUG - Mapeado para 1 a 4kk")
      return "1 a 4kk"
    }

    if (/de\s*4\s*(a|à)\s*16\s*(milhao|milhoes)/i.test(faturamentoNorm)) {
      console.log("[v0] DEBUG - Mapeado para 4 a 16kk")
      return "4 a 16kk"
    }

    if (/de\s*16\s*(a|à)\s*40\s*(milhao|milhoes)/i.test(faturamentoNorm)) {
      console.log("[v0] DEBUG - Mapeado para 16 a 40kk")
      return "16 a 40kk"
    }

    if (/(mais\s*de\s*40|acima\s*de\s*40|\+\s*40).*(milhao|milhoes)/i.test(faturamentoNorm)) {
      console.log("[v0] DEBUG - Mapeado para +40kk")
      return "+40kk"
    }

    // Se não conseguiu mapear nada específico, vai para -100k (sem informação)
    console.log("[v0] DEBUG - Faturamento não mapeado:", faturamentoOriginal, "-> indo para -100k")
    return "-100k"
  }

  // Filter leads by period
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
    } else {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      filteredLeads = leads.filter((lead) => {
        if (!lead.data_hora_compra) return false
        const leadDate = new Date(lead.data_hora_compra)
        return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear
      })
    }

    // filteredLeads = filteredLeads.filter((lead) => {
    //   const origem = lead.tipo_lead || lead.origem_lead || lead.origemLead || ""
    //   return origem.toLowerCase() === "leadbroker"
    // })

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

  const calculateSDRData = () => {
    const sdrData: Record<
      string,
      {
        totalLeads: number
        reunioesMarcadas: number
        reunioesRealizadas: number
        conversaoRM: number
        conversaoRR: number
      }
    > = {}

    // Inicializar dados para cada SDR
    Object.keys(sdrMetasConfig).forEach((sdr) => {
      sdrData[sdr] = {
        totalLeads: 0,
        reunioesMarcadas: 0,
        reunioesRealizadas: 0,
        conversaoRM: 0,
        conversaoRR: 0,
      }
    })

    const filteredLeads = getFilteredLeads()

    filteredLeads.forEach((lead) => {
      const sdr = lead.sdr?.toLowerCase()
      if (sdr && sdrData[sdr]) {
        sdrData[sdr].totalLeads++

        if (lead.reuniao_agendada) {
          sdrData[sdr].reunioesMarcadas++
        }

        if (lead.reuniao_realizada) {
          sdrData[sdr].reunioesRealizadas++
        }
      }
    })

    // Calcular conversões
    Object.keys(sdrData).forEach((sdr) => {
      const data = sdrData[sdr]
      data.conversaoRM = data.totalLeads > 0 ? (data.reunioesMarcadas / data.totalLeads) * 100 : 0
      data.conversaoRR = data.reunioesMarcadas > 0 ? (data.reunioesRealizadas / data.reunioesMarcadas) * 100 : 0
    })

    return sdrData
  }

  const calculateCloserData = () => {
    const closerData: Record<
      string,
      {
        reunioesRealizadas: number
        vendas: number
        feeMRR: number
        feeOneTime: number
      }
    > = {}

    // Inicializar dados para cada closer
    Object.keys(closerMetasConfig).forEach((closer) => {
      closerData[closer] = {
        reunioesRealizadas: 0,
        vendas: 0,
        feeMRR: 0,
        feeOneTime: 0,
      }
    })

    const filteredLeads = getFilteredLeads()

    filteredLeads.forEach((lead) => {
      const closer = lead.closer?.toLowerCase()
      if (closer && closerData[closer]) {
        if (lead.reuniao_realizada) {
          closerData[closer].reunioesRealizadas++
        }

        // Contar vendas (se tem data de assinatura)
        if (lead.data_assinatura) {
          closerData[closer].vendas++

          // fee_total = FEE MRR, escopo_fechado = FEE ONE-TIME
          if (lead.fee_total) {
            closerData[closer].feeMRR += Number(lead.fee_total) || 0
          }

          if (lead.escopo_fechado) {
            closerData[closer].feeOneTime += Number(lead.escopo_fechado) || 0
          }
        }
      }
    })

    return closerData
  }

  const calculateNovasMetasData = () => {
    const allLeads = leads // Todos os leads sem filtro de data para algumas métricas
    const filteredLeads = getFilteredLeads() // Leads filtrados por data para outras métricas

    console.log("[v0] METAS DEBUG - Total de leads:", leads?.length || 0)
    console.log("[v0] METAS DEBUG - Leads filtrados por data:", filteredLeads.length)
    console.log(
      "[v0] METAS DEBUG - Primeiros 3 leads filtrados:",
      filteredLeads.slice(0, 3).map((l) => ({
        id: l.id,
        tipo_lead: l.tipo_lead,
        data_hora_compra: l.data_hora_compra,
      })),
    )

    // FEE MRR - independente de quando o lead foi comprado, se data de assinatura foi no mês
    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    const realizadoFeeMRR = allLeads
      .filter((lead) => {
        if (!lead.data_assinatura) return false
        const dataAssinatura = new Date(lead.data_assinatura)
        return dataAssinatura.getMonth() === mesAtual && dataAssinatura.getFullYear() === anoAtual
      })
      .reduce((sum, lead) => sum + (Number.parseFloat(String(lead.fee_mrr || "0")) || 0), 0)

    // FEE ONE-TIME - independente de quando o lead foi comprado, se data de assinatura foi no mês
    const realizadoFeeOneTime = allLeads
      .filter((lead) => {
        if (!lead.data_assinatura) return false
        const dataAssinatura = new Date(lead.data_assinatura)
        return dataAssinatura.getMonth() === mesAtual && dataAssinatura.getFullYear() === anoAtual
      })
      .reduce((sum, lead) => sum + (Number.parseFloat(String(lead.escopo_fechado || "0")) || 0), 0)

    // Leads - todo lead com origem LeadBroker OU Blackbox que foi comprado dentro do mês
    const realizadoLeads = filteredLeads.filter((lead) => {
      const origem = lead.tipo_lead?.toLowerCase()?.trim()
      const isValid = origem === "leadbroker" || origem === "lead broker" || origem === "blackbox"
      return isValid
    }).length

    console.log("[v0] METAS DEBUG - Leads LeadBroker/Blackbox encontrados:", realizadoLeads)
    console.log("[v0] METAS DEBUG - Tipos de lead únicos:", [...new Set(filteredLeads.map((l) => l.tipo_lead))])

    // RM - toda reunião marcada de origem LeadBroker ou Blackbox que foi marcada dentro do mês
    const realizadoRM = filteredLeads.filter((lead) => {
      const origem = lead.tipo_lead?.toLowerCase()?.trim()
      const isOrigemValida = origem === "leadbroker" || origem === "lead broker" || origem === "blackbox"
      return isOrigemValida && lead.reuniao_agendada === true
    }).length

    // RR - toda reunião realizada de origem LeadBroker ou Blackbox que foi realizada dentro do mês
    const realizadoRR = filteredLeads.filter((lead) => {
      const origem = lead.tipo_lead?.toLowerCase()?.trim()
      const isOrigemValida = origem === "leadbroker" || origem === "lead broker" || origem === "blackbox"
      return isOrigemValida && lead.reuniao_realizada === true
    }).length

    // Logos - número de vendas, toda venda realizada dentro do mês
    const realizadoLogos = allLeads.filter((lead) => {
      if (!lead.data_assinatura) return false
      const dataAssinatura = new Date(lead.data_assinatura)
      return dataAssinatura.getMonth() === mesAtual && dataAssinatura.getFullYear() === anoAtual
    }).length

    // Calcular ideal por dia
    const hoje2 = new Date()
    const diaAtual = hoje2.getDate()
    const diasDoMes = new Date(hoje2.getFullYear(), hoje2.getMonth() + 1, 0).getDate()

    const calcularIdealDia = (metaMensal: number) => {
      if (metaMensal === 0 || diasDoMes === 0) return 0
      return Math.round((metaMensal / diasDoMes) * diaAtual)
    }

    return {
      feeMRR: {
        meta: novasMetasConfig.feeMRR,
        realizado: realizadoFeeMRR,
        idealDia: calcularIdealDia(novasMetasConfig.feeMRR),
        falta: novasMetasConfig.feeMRR - realizadoFeeMRR,
        percentual: novasMetasConfig.feeMRR > 0 ? (realizadoFeeMRR / novasMetasConfig.feeMRR) * 100 : 0,
      },
      feeOneTime: {
        meta: novasMetasConfig.feeOneTime,
        realizado: realizadoFeeOneTime,
        idealDia: calcularIdealDia(novasMetasConfig.feeOneTime),
        falta: novasMetasConfig.feeOneTime - realizadoFeeOneTime,
        percentual: novasMetasConfig.feeOneTime > 0 ? (realizadoFeeOneTime / novasMetasConfig.feeOneTime) * 100 : 0,
      },
      leads: {
        meta: novasMetasConfig.leads,
        realizado: realizadoLeads,
        idealDia: calcularIdealDia(novasMetasConfig.leads),
        falta: novasMetasConfig.leads - realizadoLeads,
        percentual: novasMetasConfig.leads > 0 ? (realizadoLeads / novasMetasConfig.leads) * 100 : 0,
      },
      rm: {
        meta: novasMetasConfig.rm,
        realizado: realizadoRM,
        idealDia: calcularIdealDia(novasMetasConfig.rm),
        falta: novasMetasConfig.rm - realizadoRM,
        percentual: novasMetasConfig.rm > 0 ? (realizadoRM / novasMetasConfig.rm) * 100 : 0,
      },
      rr: {
        meta: novasMetasConfig.rr,
        realizado: realizadoRR,
        idealDia: calcularIdealDia(novasMetasConfig.rr),
        falta: novasMetasConfig.rr - realizadoRR,
        percentual: novasMetasConfig.rr > 0 ? (realizadoRR / novasMetasConfig.rr) * 100 : 0,
      },
      logos: {
        meta: novasMetasConfig.logos,
        realizado: realizadoLogos,
        idealDia: calcularIdealDia(novasMetasConfig.logos),
        falta: novasMetasConfig.logos - realizadoLogos,
        percentual: novasMetasConfig.logos > 0 ? (realizadoLogos / novasMetasConfig.logos) * 100 : 0,
      },
    }
  }

  // Ordem dos tiers
  const tierOrder = ["-100k", "101 a 200k", "201 a 400k", "401 a 1kk", "1 a 4kk", "4 a 16kk", "16 a 40kk", "+40kk"]

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

  // Calcular dados reais dos arrematadores por tier
  const calculateArrematadorData = () => {
    const arrematadorData: Record<
      string,
      {
        totalRealizado: number
        tierData: Record<string, number>
      }
    > = {}

    const arrematadores = [
      { key: "alan", name: "Alan", color: "from-blue-500 to-blue-600", icon: "🎯" },
      { key: "antonio", name: "Antônio", color: "from-green-500 to-green-600", icon: "📈" },
      { key: "gabrielli", name: "Gabrielli", color: "from-red-500 to-red-600", icon: "⭐" },
      { key: "giselle", name: "Giselle", color: "from-pink-500 to-pink-600", icon: "💎" },
      { key: "guilherme", name: "Guilherme", color: "from-indigo-500 to-indigo-600", icon: "🎪" },
      { key: "leonardo", name: "Leonardo", color: "from-orange-500 to-orange-600", icon: "👑" },
      { key: "marcelo", name: "Marcelo", color: "from-teal-500 to-teal-600", icon: "🚀" },
      { key: "matriz", name: "Matriz", color: "from-slate-500 to-slate-600", icon: "🏢" },
      { key: "vanessa", name: "Vanessa", color: "from-violet-500 to-violet-600", icon: "🏆" },
    ]

    // Inicializar dados
    arrematadores.forEach((arr) => {
      arrematadorData[arr.key] = {
        totalRealizado: 0,
        tierData: {},
      }

      // Inicializar dados por tier
      tierOrder.forEach((tier) => {
        arrematadorData[arr.key].tierData[tier] = 0
      })
    })

    // Contar leads por arrematador e tier
    const filteredLeads = getFilteredLeads()
    filteredLeads.forEach((lead) => {
      const arr = lead.arrematador?.toLowerCase()
      const tier = mapFaturamentoToTier(lead.faturamento || "")

      if (arr && arrematadorData[arr]) {
        arrematadorData[arr].tierData[tier]++
        arrematadorData[arr].totalRealizado++
      }
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

    console.log("[v0] ConfigModal renderizado, isConfigModalOpen:", isConfigModalOpen)

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

  const SDRConfigModal = () => {
    const [tempSDRConfig, setTempSDRConfig] = useState<SDRsMetasConfig>(sdrMetasConfig)

    const handleSave = () => {
      saveSDRMetasConfig(tempSDRConfig)
      setIsSDRConfigModalOpen(false)
    }

    const updateSDRConfig = (sdr: string, field: keyof SDRMetasConfig, value: number) => {
      setTempSDRConfig((prev) => ({
        ...prev,
        [sdr]: {
          ...prev[sdr],
          [field]: value,
        },
      }))
    }

    return (
      <Dialog open={isSDRConfigModalOpen} onOpenChange={setIsSDRConfigModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>Configurar Metas dos SDRs</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Configure as metas mensais de Reuniões Marcadas (RM) e Reuniões Realizadas
                (RR) para cada SDR.
              </p>
            </div>

            <div className="grid gap-4">
              {Object.keys(sdrMetasConfig).map((sdr) => {
                const config = tempSDRConfig[sdr]
                if (!config) return null

                return (
                  <Card key={sdr} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center text-white font-bold shadow-lg`}
                          >
                            {config.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 capitalize">{sdr}</h3>
                            <p className="text-sm text-gray-500">Configurações do SDR</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`meta-rm-${sdr}`} className="text-sm font-medium">
                            Meta RM (Reuniões Marcadas)
                          </Label>
                          <Input
                            id={`meta-rm-${sdr}`}
                            type="number"
                            value={config.metaRM}
                            onChange={(e) => updateSDRConfig(sdr, "metaRM", Number(e.target.value))}
                            className="mt-1"
                            min="0"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`meta-rr-${sdr}`} className="text-sm font-medium">
                            Meta RR (Reuniões Realizadas)
                          </Label>
                          <Input
                            id={`meta-rr-${sdr}`}
                            type="number"
                            value={config.metaRR}
                            onChange={(e) => updateSDRConfig(sdr, "metaRR", Number(e.target.value))}
                            className="mt-1"
                            min="0"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsSDRConfigModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const CloserConfigModal = () => {
    const [tempConfig, setTempConfig] = useState<ClosersMetasConfig>(closerMetasConfig)

    const handleSave = () => {
      saveCloserMetasConfig(tempConfig)
      setIsCloserConfigModalOpen(false)
    }

    const updateCloserConfig = (closer: string, field: keyof CloserMetasConfig, value: number) => {
      setTempConfig((prev) => ({
        ...prev,
        [closer]: {
          ...prev[closer],
          [field]: value,
        },
      }))
    }

    return (
      <Dialog open={isCloserConfigModalOpen} onOpenChange={setIsCloserConfigModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-orange-600" />
              <span>Configurar Metas dos Closers</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>💡 Dica:</strong> Configure as metas mensais de reuniões realizadas, vendas e valores de FEE
                para cada closer. Essas configurações serão salvas e aplicadas automaticamente na análise.
              </p>
            </div>

            <div className="grid gap-4">
              {Object.keys(tempConfig).map((closer) => {
                const config = tempConfig[closer]
                if (!config) return null

                return (
                  <Card key={closer} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center text-white font-bold shadow-lg`}
                          >
                            {config.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 capitalize">{closer}</h3>
                            <p className="text-sm text-gray-500">Configurações do closer</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor={`metaRR-${closer}`} className="text-sm font-medium">
                            Meta RR
                          </Label>
                          <Input
                            id={`metaRR-${closer}`}
                            type="number"
                            value={config.metaRR}
                            onChange={(e) => updateCloserConfig(closer, "metaRR", Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`metaVendas-${closer}`} className="text-sm font-medium">
                            Meta Vendas
                          </Label>
                          <Input
                            id={`metaVendas-${closer}`}
                            type="number"
                            value={config.metaVendas}
                            onChange={(e) => updateCloserConfig(closer, "metaVendas", Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`metaFeeMRR-${closer}`} className="text-sm font-medium">
                            Meta FEE MRR (R$)
                          </Label>
                          <Input
                            id={`metaFeeMRR-${closer}`}
                            type="number"
                            value={config.metaFeeMRR}
                            onChange={(e) => updateCloserConfig(closer, "metaFeeMRR", Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`metaFeeOneTime-${closer}`} className="text-sm font-medium">
                            Meta FEE One-Time (R$)
                          </Label>
                          <Input
                            id={`metaFeeOneTime-${closer}`}
                            type="number"
                            value={config.metaFeeOneTime}
                            onChange={(e) => updateCloserConfig(closer, "metaFeeOneTime", Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCloserConfigModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const NovasMetasConfigModal = () => {
    const [tempConfig, setTempConfig] = useState<NovasMetasConfig>(novasMetasConfig)

    const handleSave = () => {
      saveNovasMetasConfig(tempConfig)
      setIsNovasMetasConfigModalOpen(false)
    }

    const updateConfig = (field: keyof NovasMetasConfig, value: number) => {
      setTempConfig((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

    return (
      <Dialog open={isNovasMetasConfigModalOpen} onOpenChange={setIsNovasMetasConfigModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-green-600" />
              <span>Configurar Metas Mensais</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>💡 Dica:</strong> Configure as metas mensais para FEE MRR, FEE ONE-TIME, Leads, RM, RR e Logos.
                O sistema calculará automaticamente o ideal por dia e o progresso.
              </p>
            </div>

            <div className="grid gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="meta-fee-mrr" className="text-sm font-medium">
                        Meta FEE MRR (R$)
                      </Label>
                      <Input
                        id="meta-fee-mrr"
                        type="number"
                        value={tempConfig.feeMRR}
                        onChange={(e) => updateConfig("feeMRR", Number(e.target.value))}
                        className="mt-1"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="meta-fee-onetime" className="text-sm font-medium">
                        Meta FEE ONE-TIME (R$)
                      </Label>
                      <Input
                        id="meta-fee-onetime"
                        type="number"
                        value={tempConfig.feeOneTime}
                        onChange={(e) => updateConfig("feeOneTime", Number(e.target.value))}
                        className="mt-1"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="meta-leads" className="text-sm font-medium">
                        Meta Leads
                      </Label>
                      <Input
                        id="meta-leads"
                        type="number"
                        value={tempConfig.leads}
                        onChange={(e) => updateConfig("leads", Number(e.target.value))}
                        className="mt-1"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="meta-rm" className="text-sm font-medium">
                        Meta RM (Reuniões Marcadas)
                      </Label>
                      <Input
                        id="meta-rm"
                        type="number"
                        value={tempConfig.rm}
                        onChange={(e) => updateConfig("rm", Number(e.target.value))}
                        className="mt-1"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="meta-rr" className="text-sm font-medium">
                        Meta RR (Reuniões Realizadas)
                      </Label>
                      <Input
                        id="meta-rr"
                        type="number"
                        value={tempConfig.rr}
                        onChange={(e) => updateConfig("rr", Number(e.target.value))}
                        className="mt-1"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="meta-logos" className="text-sm font-medium">
                        Meta Logos (Vendas)
                      </Label>
                      <Input
                        id="meta-logos"
                        type="number"
                        value={tempConfig.logos}
                        onChange={(e) => updateConfig("logos", Number(e.target.value))}
                        className="mt-1"
                        min="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsNovasMetasConfigModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
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

  const novasMetasData = calculateNovasMetasData()

  return (
    <div className="space-y-4">
      {/* Header Compacto */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 p-4 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Controle de Compra de Leads</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  console.log("[v0] Botão Config clicado")
                  setIsConfigModalOpen(true)
                }}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm text-xs h-7 px-2"
              >
                <Settings className="w-3 h-3 mr-1" />
                Config
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsNovasMetasConfigModalOpen(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm text-xs h-7 px-2"
              >
                <Settings className="w-3 h-3 mr-1" />
                Metas Mensais
              </Button>
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

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Metas Mensais</h2>
              <p className="text-sm text-gray-500">Controle de metas: FEE MRR, FEE ONE-TIME, Leads, RM, RR e Logos</p>
            </div>
          </div>
          <Button onClick={() => setIsNovasMetasConfigModalOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Settings className="w-4 h-4 mr-2" />
            Configurar Metas
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* FEE MRR */}
          <Card
            className={`border-l-4 ${getStatusBadge(novasMetasData.feeMRR.percentual).color.replace("bg-", "border-l-")}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💰</span>
                  <h3 className="font-semibold text-gray-900">FEE MRR</h3>
                </div>
                <Badge className={getStatusBadge(novasMetasData.feeMRR.percentual).color}>
                  {formatPercentage(novasMetasData.feeMRR.percentual)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Meta:</span>
                  <span className="font-medium">{formatCurrency(novasMetasData.feeMRR.meta)} (100%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Realizado:</span>
                  <span className="font-medium">
                    {formatCurrency(novasMetasData.feeMRR.realizado)} (
                    {formatPercentage(
                      novasMetasData.feeMRR.meta > 0
                        ? (novasMetasData.feeMRR.realizado / novasMetasData.feeMRR.meta) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ideal Dia:</span>
                  <span className="font-medium">
                    {formatCurrency(novasMetasData.feeMRR.idealDia)} (
                    {formatPercentage(
                      novasMetasData.feeMRR.idealDia > 0
                        ? (novasMetasData.feeMRR.realizado / novasMetasData.feeMRR.idealDia) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Falta:</span>
                  <span
                    className={`font-medium ${novasMetasData.feeMRR.falta <= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(Math.abs(novasMetasData.feeMRR.falta))} (
                    {formatPercentage(
                      novasMetasData.feeMRR.meta > 0
                        ? (Math.abs(novasMetasData.feeMRR.falta) / novasMetasData.feeMRR.meta) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FEE ONE-TIME */}
          <Card
            className={`border-l-4 ${getStatusBadge(novasMetasData.feeOneTime.percentual).color.replace("bg-", "border-l-")}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💎</span>
                  <h3 className="font-semibold text-gray-900">FEE ONE-TIME</h3>
                </div>
                <Badge className={getStatusBadge(novasMetasData.feeOneTime.percentual).color}>
                  {formatPercentage(novasMetasData.feeOneTime.percentual)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Meta:</span>
                  <span className="font-medium">{formatCurrency(novasMetasData.feeOneTime.meta)} (100%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Realizado:</span>
                  <span className="font-medium">
                    {formatCurrency(novasMetasData.feeOneTime.realizado)} (
                    {formatPercentage(
                      novasMetasData.feeOneTime.meta > 0
                        ? (novasMetasData.feeOneTime.realizado / novasMetasData.feeOneTime.meta) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ideal Dia:</span>
                  <span className="font-medium">
                    {formatCurrency(novasMetasData.feeOneTime.idealDia)} (
                    {formatPercentage(
                      novasMetasData.feeOneTime.idealDia > 0
                        ? (novasMetasData.feeOneTime.realizado / novasMetasData.feeOneTime.idealDia) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Falta:</span>
                  <span
                    className={`font-medium ${novasMetasData.feeOneTime.falta <= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(Math.abs(novasMetasData.feeOneTime.falta))} (
                    {formatPercentage(
                      novasMetasData.feeOneTime.meta > 0
                        ? (Math.abs(novasMetasData.feeOneTime.falta) / novasMetasData.feeOneTime.meta) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads */}
          <Card
            className={`border-l-4 ${getStatusBadge(novasMetasData.leads.percentual).color.replace("bg-", "border-l-")}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">👥</span>
                  <h3 className="font-semibold text-gray-900">Leads</h3>
                </div>
                <Badge className={getStatusBadge(novasMetasData.leads.percentual).color}>
                  {formatPercentage(novasMetasData.leads.percentual)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Meta:</span>
                  <span className="font-medium">{novasMetasData.leads.meta} (100%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Realizado:</span>
                  <span className="font-medium">
                    {novasMetasData.leads.realizado} (
                    {formatPercentage(
                      novasMetasData.leads.meta > 0
                        ? (novasMetasData.leads.realizado / novasMetasData.leads.meta) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ideal Dia:</span>
                  <span className="font-medium">
                    {novasMetasData.leads.idealDia} (
                    {formatPercentage(
                      novasMetasData.leads.idealDia > 0
                        ? (novasMetasData.leads.realizado / novasMetasData.leads.idealDia) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Falta:</span>
                  <span
                    className={`font-medium ${novasMetasData.leads.falta <= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {Math.abs(novasMetasData.leads.falta)} (
                    {formatPercentage(
                      novasMetasData.leads.meta > 0
                        ? (Math.abs(novasMetasData.leads.falta) / novasMetasData.leads.meta) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RM */}
          <Card
            className={`border-l-4 ${getStatusBadge(novasMetasData.rm.percentual).color.replace("bg-", "border-l-")}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📅</span>
                  <h3 className="font-semibold text-gray-900">RM</h3>
                </div>
                <Badge className={getStatusBadge(novasMetasData.rm.percentual).color}>
                  {formatPercentage(novasMetasData.rm.percentual)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Meta:</span>
                  <span className="font-medium">{novasMetasData.rm.meta} (100%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Realizado:</span>
                  <span className="font-medium">
                    {novasMetasData.rm.realizado} (
                    {formatPercentage(
                      novasMetasData.rm.meta > 0 ? (novasMetasData.rm.realizado / novasMetasData.rm.meta) * 100 : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ideal Dia:</span>
                  <span className="font-medium">
                    {novasMetasData.rm.idealDia} (
                    {formatPercentage(
                      novasMetasData.rm.idealDia > 0
                        ? (novasMetasData.rm.realizado / novasMetasData.rm.idealDia) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Falta:</span>
                  <span className={`font-medium ${novasMetasData.rm.falta <= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Math.abs(novasMetasData.rm.falta)} (
                    {formatPercentage(
                      novasMetasData.rm.meta > 0
                        ? (Math.abs(novasMetasData.rm.falta) / novasMetasData.rm.meta) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RR */}
          <Card
            className={`border-l-4 ${getStatusBadge(novasMetasData.rr.percentual).color.replace("bg-", "border-l-")}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">✅</span>
                  <h3 className="font-semibold text-gray-900">RR</h3>
                </div>
                <Badge className={getStatusBadge(novasMetasData.rr.percentual).color}>
                  {formatPercentage(novasMetasData.rr.percentual)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Meta:</span>
                  <span className="font-medium">{novasMetasData.rr.meta} (100%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Realizado:</span>
                  <span className="font-medium">
                    {novasMetasData.rr.realizado} (
                    {formatPercentage(
                      novasMetasData.rr.meta > 0 ? (novasMetasData.rr.realizado / novasMetasData.rr.meta) * 100 : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ideal Dia:</span>
                  <span className="font-medium">
                    {novasMetasData.rr.idealDia} (
                    {formatPercentage(
                      novasMetasData.rr.idealDia > 0
                        ? (novasMetasData.rr.realizado / novasMetasData.rr.idealDia) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Falta:</span>
                  <span className={`font-medium ${novasMetasData.rr.falta <= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Math.abs(novasMetasData.rr.falta)} (
                    {formatPercentage(
                      novasMetasData.rr.meta > 0
                        ? (Math.abs(novasMetasData.rr.falta) / novasMetasData.rr.meta) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logos */}
          <Card
            className={`border-l-4 ${getStatusBadge(novasMetasData.logos.percentual).color.replace("bg-", "border-l-")}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏆</span>
                  <h3 className="font-semibold text-gray-900">Logos</h3>
                </div>
                <Badge className={getStatusBadge(novasMetasData.logos.percentual).color}>
                  {formatPercentage(novasMetasData.logos.percentual)}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Meta:</span>
                  <span className="font-medium">{novasMetasData.logos.meta} (100%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Realizado:</span>
                  <span className="font-medium">
                    {novasMetasData.logos.realizado} (
                    {formatPercentage(
                      novasMetasData.logos.meta > 0
                        ? (novasMetasData.logos.realizado / novasMetasData.logos.meta) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ideal Dia:</span>
                  <span className="font-medium">
                    {novasMetasData.logos.idealDia} (
                    {formatPercentage(
                      novasMetasData.logos.idealDia > 0
                        ? (novasMetasData.logos.realizado / novasMetasData.logos.idealDia) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Falta:</span>
                  <span
                    className={`font-medium ${novasMetasData.logos.falta <= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {Math.abs(novasMetasData.logos.falta)} (
                    {formatPercentage(
                      novasMetasData.logos.meta > 0
                        ? (Math.abs(novasMetasData.logos.falta) / novasMetasData.logos.meta) * 100
                        : 0,
                    )}
                    )
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cards de Resumo Compactos */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
          <CardContent className="relative z-10 p-3 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium mb-1">Meta Total</p>
                <p className="text-xl font-bold">{totalMeta}</p>
              </div>
              <Target className="w-6 h-6 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600"></div>
          <CardContent className="relative z-10 p-3 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium mb-1">Realizado</p>
                <p className="text-xl font-bold">{totalRealizado}</p>
              </div>
              <Award className="w-6 h-6 text-white/80" />
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
          <CardContent className="relative z-10 p-3 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs font-medium mb-1">Performance</p>
                <p className="text-xl font-bold">{formatPercentage(percentualGeral)}</p>
              </div>
              <BarChart3 className="w-6 h-6 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tabela Principal Compacta */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b py-2">
            <CardTitle className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-red-600" />
              <span>Detalhamento por Tier</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-xs">Tier</th>
                    <th className="px-3 py-2 text-center font-bold text-xs">Meta</th>
                    <th className="px-3 py-2 text-center font-bold text-xs">Realizado</th>
                    <th className="px-3 py-2 text-center font-bold text-xs">Ideal/Dia</th>
                    <th className="px-3 py-2 text-center font-bold text-xs">%</th>
                    <th className="px-3 py-2 text-center font-bold text-xs">CPMQL</th>
                    <th className="px-3 py-2 text-center font-bold text-xs">Status</th>
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
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-5 h-5 bg-gradient-to-br ${meta.color} rounded flex items-center justify-center text-white text-xs font-bold`}
                            >
                              {meta.icon}
                            </div>
                            <span className="font-medium text-xs text-gray-900">{tier}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-gray-900">{meta.meta}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-blue-600">{realizado}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-purple-600">{calculateIdealPorDia(meta.meta)}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={`${status.color} text-white font-bold text-xs px-1 py-0.5`}>
                            {formatPercentage(percentualMeta)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="text-xs">
                            <div className="font-semibold text-gray-600">{formatCurrency(meta.cpmqlMeta)}</div>
                            <div className={`${realizado > 0 ? "text-green-600" : "text-gray-400"}`}>
                              {realizado > 0 ? formatCurrency(cpmqlRealizado) : "R$ 0"}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div
                            className={`w-5 h-5 ${status.color} rounded-full flex items-center justify-center mx-auto`}
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
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 border-b py-2">
            <CardTitle className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-600" />
              <span>Leads Comprados por Arrematador</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 font-semibold text-gray-700 text-xs">Arrematador</th>
                    {["-100k", ...tierOrder.slice(1, 7), "+40kk"].map((tier) => {
                      const tierConfig = metasConfig[tier]
                      return (
                        <th key={tier} className="text-center py-1.5 px-1">
                          <div className="flex flex-col items-center space-y-0.5">
                            <div
                              className={`w-4 h-4 bg-gradient-to-br ${tierConfig?.color} rounded flex items-center justify-center`}
                            >
                              <span className="text-xs">{tierConfig?.icon}</span>
                            </div>
                            <span className="text-xs font-medium text-gray-600 leading-tight">
                              {tier.replace(" a ", "-").replace("kk", "M")}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                    <th className="text-center py-1.5 font-semibold text-gray-700 text-xs">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const arrematadorData = calculateArrematadorData()
                    const arrematadores = [
                      { key: "alan", name: "Alan", color: "from-blue-500 to-blue-600", icon: "🎯" },
                      { key: "antonio", name: "Antônio", color: "from-green-500 to-green-600", icon: "📈" },
                      { key: "gabrielli", name: "Gabrielli", color: "from-red-500 to-red-600", icon: "⭐" },
                      { key: "giselle", name: "Giselle", color: "from-pink-500 to-pink-600", icon: "💎" },
                      { key: "guilherme", name: "Guilherme", color: "from-indigo-500 to-indigo-600", icon: "🎪" },
                      { key: "leonardo", name: "Leonardo", color: "from-orange-500 to-orange-600", icon: "👑" },
                      { key: "marcelo", name: "Marcelo", color: "from-teal-500 to-teal-600", icon: "🚀" },
                      { key: "matriz", name: "Matriz", color: "from-slate-500 to-slate-600", icon: "🏢" },
                      { key: "vanessa", name: "Vanessa", color: "from-violet-500 to-violet-600", icon: "🏆" },
                    ]

                    return arrematadores.map((arr) => {
                      const data = arrematadorData[arr.key]

                      return (
                        <tr key={arr.key} className="border-b hover:bg-gray-50">
                          <td className="py-2">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-5 h-5 bg-gradient-to-br ${arr.color} rounded flex items-center justify-center text-white font-bold shadow-sm`}
                              >
                                <span className="text-xs">{arr.icon}</span>
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{arr.name}</span>
                            </div>
                          </td>
                          {["-100k", ...tierOrder.slice(1, 7), "+40kk"].map((tier) => {
                            const leadsCount = data.tierData[tier] || 0
                            return (
                              <td key={tier} className="text-center py-2 px-1">
                                <span
                                  className={`font-bold text-sm ${leadsCount > 0 ? "text-green-600" : "text-gray-400"}`}
                                >
                                  {leadsCount}
                                </span>
                              </td>
                            )
                          })}
                          <td className="text-center py-2">
                            <span className="font-bold text-base text-blue-600">{data.totalRealizado}</span>
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Controle de Metas - SDRs</span>
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setIsSDRConfigModalOpen(true)}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-xs h-7 px-2"
            >
              <Settings className="w-3 h-3 mr-1" />
              Config SDRs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-xs">SDR</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">Leads</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">Meta RM</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">RM Real</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">% L→RM</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">Meta RR</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">RR Real</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">% RM→RR</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const sdrData = calculateSDRData()

                  return Object.keys(sdrMetasConfig).map((sdr) => {
                    const config = sdrMetasConfig[sdr]
                    const data = sdrData[sdr]
                    const percentualRM = config.metaRM > 0 ? (data.reunioesMarcadas / config.metaRM) * 100 : 0
                    const percentualRR = config.metaRR > 0 ? (data.reunioesRealizadas / config.metaRR) * 100 : 0
                    const statusRM = getStatusBadge(percentualRM)
                    const statusRR = getStatusBadge(percentualRR)

                    return (
                      <tr key={sdr} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-5 h-5 bg-gradient-to-br ${config.color} rounded flex items-center justify-center text-white text-xs font-bold`}
                            >
                              {config.icon}
                            </div>
                            <span className="font-medium text-xs text-gray-900 capitalize">{sdr}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-gray-900">{data.totalLeads}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-blue-600">{config.metaRM}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-green-600">{data.reunioesMarcadas}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={`${statusRM.color} text-white font-bold text-xs px-1 py-0.5`}>
                            {formatPercentage(data.conversaoRM)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-blue-600">{config.metaRR}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-green-600">{data.reunioesRealizadas}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={`${statusRR.color} text-white font-bold text-xs px-1 py-0.5`}>
                            {formatPercentage(data.conversaoRR)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex space-x-1 justify-center">
                            <div
                              className={`w-3 h-3 ${statusRM.color} rounded-full flex items-center justify-center`}
                              title="Status RM"
                            >
                              <Calendar className="w-2 h-2 text-white" />
                            </div>
                            <div
                              className={`w-3 h-3 ${statusRR.color} rounded-full flex items-center justify-center`}
                              title="Status RR"
                            >
                              <CheckCircle className="w-2 h-2 text-white" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-100 border-b py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <Target className="w-4 h-4 text-orange-600" />
              <span>Controle de Metas - Closers</span>
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setIsCloserConfigModalOpen(true)}
              className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 text-xs h-7 px-2"
            >
              <Settings className="w-3 h-3 mr-1" />
              Config Closers
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-600 to-red-700 text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-xs">Closer</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">Leads</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">Meta RR</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">RR Real</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">% RR</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">Meta Vendas</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">Vendas</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">% Vendas</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">FEE MRR</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">FEE One-Time</th>
                  <th className="px-3 py-2 text-center font-bold text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const closerData = calculateCloserData()

                  return Object.keys(closerMetasConfig).map((closer) => {
                    const config = closerMetasConfig[closer]
                    const data = closerData[closer]
                    const percentualRR = config.metaRR > 0 ? (data.reunioesRealizadas / config.metaRR) * 100 : 0
                    const percentualVendas = config.metaVendas > 0 ? (data.vendas / config.metaVendas) * 100 : 0
                    const statusRR = getStatusBadge(percentualRR)
                    const statusVendas = getStatusBadge(percentualVendas)

                    return (
                      <tr key={closer} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-5 h-5 bg-gradient-to-br ${config.color} rounded flex items-center justify-center text-white text-xs font-bold`}
                            >
                              {config.icon}
                            </div>
                            <span className="font-medium text-xs text-gray-900 capitalize">{closer}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-gray-900">{data.totalLeads}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-orange-600">{config.metaRR}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-green-600">{data.reunioesRealizadas}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={`${statusRR.color} text-white font-bold text-xs px-1 py-0.5`}>
                            {formatPercentage(percentualRR)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-orange-600">{config.metaVendas}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-bold text-sm text-green-600">{data.vendas}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={`${statusVendas.color} text-white font-bold text-xs px-1 py-0.5`}>
                            {formatPercentage(percentualVendas)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="text-xs">
                            <div className="font-semibold text-gray-600">{formatCurrency(config.metaFeeMRR)}</div>
                            <div className="text-green-600 font-bold">{formatCurrency(data.feeMRR)}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="text-xs">
                            <div className="font-semibold text-gray-600">{formatCurrency(config.metaFeeOneTime)}</div>
                            <div className="text-green-600 font-bold">{formatCurrency(data.feeOneTime)}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex space-x-1 justify-center">
                            <div
                              className={`w-3 h-3 ${statusRR.color} rounded-full flex items-center justify-center`}
                              title="Status RR"
                            >
                              <Calendar className="w-2 h-2 text-white" />
                            </div>
                            <div
                              className={`w-3 h-3 ${statusVendas.color} rounded-full flex items-center justify-center`}
                              title="Status Vendas"
                            >
                              <CheckCircle className="w-2 h-2 text-white" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ConfigModal />
      <SDRConfigModal />
      <CloserConfigModal />
      <NovasMetasConfigModal />
    </div>
  )
}
