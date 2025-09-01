"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  RefreshCw,
  Plus,
  Info,
  DollarSign,
  Users,
  BarChart3,
  CheckCircle,
  Database,
  Target,
  Calendar,
} from "lucide-react"
import { LeadsList } from "@/components/leads-list"
import { SalesTracking } from "@/components/sales-tracking"
import { CommissionControl } from "@/components/commission-control"
import { DashboardAnalytics } from "@/components/dashboard-analytics"
import { MetasControl } from "@/components/metas-control"
import { NovoLeadModal } from "@/components/novo-lead-modal"
import { leadOperations, type Lead, isSupabaseConfigured, testSupabaseConnection } from "@/lib/supabase-operations"
import { LeadsSpreadsheet } from "@/components/leads-spreadsheet"

export type { Lead }

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
  metaRM: number
  metaRR: number
  color: string
  icon: string
}

interface SDRsMetasConfig {
  [key: string]: SDRMetasConfig
}

interface CloserMetasConfig {
  metaRR: number
  metaVendas: number
  metaFeeMRR: number
  metaFeeOneTime: number
  color: string
  icon: string
}

interface ClosersMetasConfig {
  [key: string]: CloserMetasConfig
}

export default function LeadsControl() {
  const [activeTab, setActiveTab] = useState("lista")
  const [isNovoLeadModalOpen, setIsNovoLeadModalOpen] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState<"loading" | "connected" | "local">("loading")

  const [dateFilterType, setDateFilterType] = useState("data_hora_compra")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])

  const [metasConfig, setMetasConfig] = useState<MetasConfig>({})
  const [sdrMetasConfig, setSDRMetasConfig] = useState<SDRsMetasConfig>({})
  const [closerMetasConfig, setCloserMetasConfig] = useState<ClosersMetasConfig>({})

  const tabs = [
    { id: "lista", label: "Lista de Leads", active: activeTab === "lista" },
    { id: "planilha", label: "📊 Controle Inbound", active: activeTab === "planilha" }, // alterado de "📊 Planilha" para "📊 Controle Inbound"
    { id: "metas", label: "🎯 Controle de Metas", active: activeTab === "metas" },
    { id: "vendas", label: "Acompanhamento de Vendas", active: activeTab === "vendas" },
    { id: "comissoes", label: "Controle de Comissões", active: activeTab === "comissoes" },
    { id: "dashboard", label: "Dashboard & Analytics", active: activeTab === "dashboard" },
  ]

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

  // Carregar leads na inicialização
  useEffect(() => {
    loadLeads()
    loadMetasConfig()
    const currentMonth = getCurrentMonthRange()
    setStartDate(currentMonth.start)
    setEndDate(currentMonth.end)
  }, [])

  const loadMetasConfig = () => {
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
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      setMetasConfig(defaultMetasConfig)
      setSDRMetasConfig(defaultSDRMetasConfig)
      setCloserMetasConfig(defaultCloserMetasConfig)
    }
  }

  const loadLeads = async () => {
    console.log("🔄 === CARREGANDO LEADS ===")
    try {
      setLoading(true)
      setSupabaseStatus("loading")

      const supabaseWorking = await testSupabaseConnection()
      console.log("🔍 Supabase funcionando:", supabaseWorking)

      const loadedLeads = await leadOperations.getAll()
      setLeads(loadedLeads)
      console.log("✅ Leads carregados:", loadedLeads.length)

      if (isSupabaseConfigured && supabaseWorking) {
        setSupabaseStatus("connected")
        console.log("✅ Status: Conectado ao Supabase")
      } else {
        setSupabaseStatus("local")
        console.log("📱 Status: Modo Local")
      }
    } catch (error) {
      console.error("❌ Erro ao carregar leads:", error)
      setLeads([])
      setSupabaseStatus("local")
    } finally {
      setLoading(false)
    }
  }

  const mapFaturamentoToTier = (faturamento: string): string => {
    const faturamentoOriginal = faturamento || ""
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    }

    const faturamentoNorm = normalizeText(faturamentoOriginal)

    if (!faturamentoNorm || faturamentoNorm === "" || faturamentoNorm === "-") {
      return "-100k"
    }

    if (/de\s*10[01]\s*mil\s*(a|à)\s*200\s*mil/i.test(faturamentoNorm)) return "101 a 200k"
    if (/de\s*20[01]\s*mil\s*(a|à)\s*400\s*mil/i.test(faturamentoNorm)) return "201 a 400k"
    if (/de\s*40[01]\s*mil\s*(a|à)\s*1\s*(milhao|milhoes)/i.test(faturamentoNorm)) return "401 a 1kk"
    if (/de\s*1\s*(a|à)\s*4\s*(milhao|milhoes)/i.test(faturamentoNorm)) return "1 a 4kk"
    if (/de\s*4\s*(a|à)\s*16\s*(milhao|milhoes)/i.test(faturamentoNorm)) return "4 a 16kk"
    if (/de\s*16\s*(a|à)\s*40\s*(milhao|milhoes)/i.test(faturamentoNorm)) return "16 a 40kk"
    if (/(mais\s*de\s*40|acima\s*de\s*40|\+\s*40).*(milhao|milhoes)/i.test(faturamentoNorm)) return "+40kk"

    return "-100k"
  }

  const getCurrentMonthRange = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    const firstDay = new Date(year, month, 1, 0, 0, 0, 0)
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0]
    }

    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay),
    }
  }

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      setFilteredLeads(leads)
      return
    }

    const filtered = leads.filter((lead) => {
      const leadDate = lead[dateFilterType as keyof Lead] as string
      if (!leadDate) return false

      const date = new Date(leadDate).toISOString().split("T")[0]
      return date >= startDate && date <= endDate
    })

    setFilteredLeads(filtered)
  }

  useEffect(() => {
    if (leads.length > 0) {
      applyDateFilter()
    } else {
      setFilteredLeads([])
    }
  }, [leads, startDate, endDate, dateFilterType])

  const calculatePerformanceMetrics = () => {
    const currentMonthLeads = filteredLeads.length > 0 ? filteredLeads : leads

    // 1. Leads Comprados
    const metaLeadsComprados = Object.values(metasConfig).reduce((sum, config) => sum + (config?.meta || 0), 0)
    const realizadoLeadsComprados = currentMonthLeads.length

    // 2. Investimento
    const metaInvestimento = Object.values(metasConfig).reduce((sum, config, index) => {
      const tierKeys = Object.keys(metasConfig)
      const tierKey = tierKeys[index]
      const tierLeads = currentMonthLeads.filter((lead) => mapFaturamentoToTier(lead.faturamento || "") === tierKey)
      return sum + tierLeads.length * (config?.cpmqlMeta || 0)
    }, 0)
    const realizadoInvestimento = currentMonthLeads.reduce((sum, lead) => {
      const valor = Number.parseFloat(String(lead.valor_pago_lead || "0"))
      return sum + (isNaN(valor) ? 0 : valor)
    }, 0)

    // 3. RM (Reuniões Marcadas)
    const metaRM = Object.values(sdrMetasConfig).reduce((sum, config) => sum + (config?.metaRM || 0), 0)
    const realizadoRM = currentMonthLeads.filter((lead) => lead.reuniao_agendada === true).length

    // 4. RR (Reuniões Realizadas)
    const metaRR = Object.values(sdrMetasConfig).reduce((sum, config) => sum + (config?.metaRR || 0), 0)
    const realizadoRR = currentMonthLeads.filter((lead) => lead.reuniao_realizada === true).length

    // 5. FEE MRR (apenas leads com DATA DE ASSINATURA)
    const metaFeeMRR = Object.values(closerMetasConfig).reduce((sum, config) => sum + (config?.metaFeeMRR || 0), 0)
    const realizadoFeeMRR = currentMonthLeads
      .filter((lead) => lead.data_assinatura)
      .reduce((sum, lead) => sum + (Number.parseFloat(String(lead.fee_total || "0")) || 0), 0)

    // 6. FEE ONE-TIME (apenas leads com DATA DE ASSINATURA)
    const metaFeeOneTime = Object.values(closerMetasConfig).reduce(
      (sum, config) => sum + (config?.metaFeeOneTime || 0),
      0,
    )
    const realizadoFeeOneTime = currentMonthLeads
      .filter((lead) => lead.data_assinatura)
      .reduce((sum, lead) => sum + (Number.parseFloat(String(lead.escopo_fechado || "0")) || 0), 0)

    // 7. ROAS
    const totalReceita = realizadoFeeMRR + realizadoFeeOneTime
    const roas = realizadoInvestimento > 0 ? totalReceita / realizadoInvestimento : 0

    return {
      leadsComprados: { meta: metaLeadsComprados, realizado: realizadoLeadsComprados },
      investimento: { meta: metaInvestimento, realizado: realizadoInvestimento },
      rm: { meta: metaRM, realizado: realizadoRM },
      rr: { meta: metaRR, realizado: realizadoRR },
      feeMRR: { meta: metaFeeMRR, realizado: realizadoFeeMRR },
      feeOneTime: { meta: metaFeeOneTime, realizado: realizadoFeeOneTime },
      roas: roas,
    }
  }

  const calculateHeaderMetrics = () => {
    let leadsToAnalyze = filteredLeads

    // Se não há leads filtrados, aplicar filtro do mês atual
    if (filteredLeads.length === 0 && leads.length > 0 && startDate && endDate) {
      leadsToAnalyze = leads.filter((lead) => {
        const leadDate = lead[dateFilterType as keyof Lead] as string
        if (!leadDate) return false
        const date = new Date(leadDate).toISOString().split("T")[0]
        return date >= startDate && date <= endDate
      })
    }

    // Valor Compra
    const valorCompra = leadsToAnalyze.reduce((sum, lead) => {
      const valor = Number.parseFloat(String(lead.valor_pago_lead || "0"))
      return sum + (isNaN(valor) ? 0 : valor)
    }, 0)

    const feeMRR = leadsToAnalyze
      .filter((lead) => lead.data_assinatura)
      .reduce((sum, lead) => {
        const valor = Number.parseFloat(String(lead.fee_mrr || "0"))
        return sum + (isNaN(valor) ? 0 : valor)
      }, 0)

    // ROAS
    const feeOneTime = leadsToAnalyze
      .filter((lead) => lead.data_assinatura)
      .reduce((sum, lead) => {
        const valor = Number.parseFloat(String(lead.escopo_fechado || "0"))
        return sum + (isNaN(valor) ? 0 : valor)
      }, 0)

    const totalReceita = feeMRR + feeOneTime
    const roas = valorCompra > 0 ? totalReceita / valorCompra : 0

    // Quantidade de Leads
    const qtdLeads = leadsToAnalyze.length

    // Ticket Médio
    const leadsComAssinatura = leadsToAnalyze.filter((lead) => lead.data_assinatura).length
    const ticketMedio = leadsComAssinatura > 0 ? totalReceita / leadsComAssinatura : 0

    // Custo por Lead
    const custoPorLead = qtdLeads > 0 ? valorCompra / qtdLeads : 0

    // Quantidade de Vendas
    const qtdVendas = leadsComAssinatura

    return {
      valorCompra,
      feeMRR,
      roas,
      qtdLeads,
      feeOneTime,
      ticketMedio,
      custoPorLead,
      qtdVendas,
    }
  }

  const calculatePerformanceColor = (percentual: number) => {
    if (percentual >= 100) return "border-l-green-500"
    if (percentual >= 80) return "border-l-yellow-500"
    return "border-l-red-500"
  }

  const calculatePerformanceTextColor = (percentual: number) => {
    if (percentual >= 100) return "text-green-600"
    if (percentual >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  const handleSaveLead = async (leadData: any) => {
    console.log("🔄 === SALVANDO LEAD ===")
    console.log("📊 Dados recebidos:", leadData)
    console.log("✏️ Editando lead:", editingLead?.id)

    try {
      setSaving(true)

      // Validação básica
      const requiredFields = [
        "nomeEmpresa",
        "produtoMarketing",
        "nicho",
        "valorPagoLead",
        "origemLead",
        "nomeContato",
        "email",
        "telefone",
        "sdr",
        "arrematador",
      ]

      const missingFields = requiredFields.filter((field) => {
        const value = leadData[field]
        return !value || value === ""
      })

      if (missingFields.length > 0) {
        alert(`❌ Campos obrigatórios não preenchidos:\n${missingFields.join(", ")}`)
        return
      }

      // Preparar dados para salvar
      const leadToSave = {
        nome_empresa: leadData.nomeEmpresa,
        produto_marketing: leadData.produtoMarketing,
        nicho: leadData.nicho,
        data_hora_compra: leadData.dataHoraCompra || null,
        valor_pago_lead: Number.parseFloat(leadData.valorPagoLead) || 0,
        tipo_lead: leadData.origemLead,
        faturamento: leadData.faturamento,
        canal: leadData.canal,
        nivel_urgencia: leadData.nivelUrgencia,
        regiao: leadData.regiao,
        cidade: leadData.cidade,
        cnpj: leadData.cnpj,
        nome_contato: leadData.nomeContato,
        cargo_contato: leadData.cargoContato,
        email: leadData.email,
        email_corporativo: leadData.emailCorporativo,
        telefone: leadData.telefone,
        sdr: leadData.sdr,
        closer: leadData.closer,
        arrematador: leadData.arrematador,
        produto: leadData.produto,
        anuncios: leadData.anuncios,
        status: leadData.status || "BACKLOG",
        observacoes_sdr: leadData.observacoes, // ✅ Corrigido: observacoes → observacoes_sdr
        data_ultimo_contato: leadData.dataUltimoContato || null,
        motivo_perda_pv: leadData.motivoPerdaPV,
        tem_comentario_lbf: leadData.temComentarioLBF || false,
        investimento_trafego: leadData.investimentoTrafego,
        ticket_medio: leadData.ticketMedio,
        qtd_lojas: leadData.qtdLojas,
        qtd_vendedores: leadData.qtdVendedores,
        conseguiu_contato: leadData.conseguiuContato,
        reuniao_agendada: leadData.reuniaoAgendada,
        reuniao_realizada: leadData.reuniaoRealizada,
        valor_proposta: Number.parseFloat(leadData.valorProposta) || null,
        valor_venda: Number.parseFloat(leadData.valorVenda) || null,
        data_marcacao: leadData.dataVenda || null, // ✅ Corrigido: data_venda → data_marcacao
        data_reuniao: leadData.dataFechamento || null, // ✅ Corrigido: data_fechamento → data_reuniao
        fee: Number.parseFloat(leadData.fee) || null,
        escopo_fechado: leadData.escopoFechado,
        fee_mrr: Number.parseFloat(leadData.feeTotal) || null, // ✅ Corrigido: fee_total → fee_mrr
        venda_via_jasson_co: leadData.vendaViaJassonCo || false,
        comissao_sdr: Number.parseFloat(leadData.comissaoSDR) || null,
        comissao_closer: Number.parseFloat(leadData.comissaoCloser) || null,
        status_comissao: leadData.statusComissao,
        temperatura: leadData.temperatura || "Frio", // ✅ Adicionado campo temperatura
      }

      if (editingLead) {
        console.log("✏️ Atualizando lead existente:", editingLead.id)
        const updatedLead = await leadOperations.update(editingLead.id, leadToSave)

        if (updatedLead) {
          console.log("✅ Lead atualizado com sucesso:", updatedLead.id)
        } else {
          console.log("⚠️ Update retornou null, mas pode ter funcionado")
        }
      } else {
        console.log("➕ Criando novo lead")
        const newLead = await leadOperations.create(leadToSave)
        console.log("✅ Lead criado com sucesso:", newLead.id)
      }

      // Recarregar lista SEMPRE após salvar
      console.log("🔄 Recarregando lista de leads...")
      await loadLeads()

      // Fechar modal
      setIsNovoLeadModalOpen(false)
      setEditingLead(null)

      console.log("✅ Processo de salvamento concluído")
    } catch (error) {
      console.error("❌ Erro ao salvar lead:", error)
      alert(`❌ Erro ao salvar lead: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditLead = (lead: Lead) => {
    console.log("✏️ Editando lead:", lead.id)
    setEditingLead(lead)
    setIsNovoLeadModalOpen(true)
  }

  const handleDeleteLead = async (leadId: string) => {
    console.log("🗑️ Deletando lead:", leadId)

    const leadToDelete = leads.find((lead) => lead.id === leadId)
    if (!leadToDelete) return

    if (confirm(`Tem certeza que deseja excluir o lead "${leadToDelete.nome_empresa}"?`)) {
      try {
        await leadOperations.delete(leadId)
        console.log("✅ Lead deletado com sucesso")

        // Recarregar lista
        await loadLeads()
      } catch (error) {
        console.error("❌ Erro ao deletar lead:", error)
        alert("❌ Erro ao deletar lead. Tente novamente.")
      }
    }
  }

  const handleCloseModal = () => {
    setIsNovoLeadModalOpen(false)
    setEditingLead(null)
  }

  const handleRefresh = () => {
    loadLeads()
    loadMetasConfig() // Recarregar metas também
  }

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      console.log("[v0] === ATUALIZANDO LEAD ===")
      console.log("[v0] ID:", id)
      console.log("[v0] Dados recebidos:", updates)

      setLeads((prevLeads) => prevLeads.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)))
      console.log("[v0] Lead atualizado no localStorage")

      // Atualizar no Supabase em background
      console.log("[v0] Tentando atualizar no Supabase...")
      await leadOperations.update(id, updates)
      console.log("[v0] ✅ Lead também atualizado no Supabase")
    } catch (error) {
      console.error("[v0] Erro ao atualizar lead:", error)

      console.log("[v0] Revertendo estado devido ao erro...")
      await loadLeads()
      alert("Erro ao atualizar lead")
    }
  }

  // Calcular KPIs
  const totalLeads = leads.length
  const totalInvestido = leads.reduce((sum, lead) => {
    const valor = Number.parseFloat(String(lead.valor_pago_lead || "0"))
    return sum + (isNaN(valor) ? 0 : valor)
  }, 0)
  const leadsAtivos = leads.filter(
    (lead) => !["CONTRATO ASSINADO", "DROPADO", "PERDIDO", "DESQUALIFICADO"].includes(lead.status),
  ).length
  const totalVendas = leads.reduce((sum, lead) => {
    const valor = Number.parseFloat(String(lead.valor_venda || "0"))
    return sum + (isNaN(valor) ? 0 : valor)
  }, 0)

  const contratoAssinado = leads.filter((lead) => lead.status === "CONTRATO ASSINADO" || lead.data_assinatura).length
  const followInfinito = leads.filter((lead) => lead.status === "FOLLOW INFINITO").length
  const tentandoContato = leads.filter((lead) => lead.status === "TENTANDO CONTATO").length

  const getStatusBadge = () => {
    switch (supabaseStatus) {
      case "loading":
        return (
          <div className="flex items-center space-x-2 text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        )
      case "connected":
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">Supabase Conectado</span>
          </div>
        )
      case "local":
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Modo Local</span>
          </div>
        )
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Carregando leads...</p>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case "lista":
        return (
          <LeadsList
            leads={leads}
            onEditLead={handleEditLead}
            onDeleteLead={handleDeleteLead}
            onUpdateLead={handleUpdateLead}
          />
        )
      case "planilha":
        return <LeadsSpreadsheet leads={leads} onUpdateLead={handleUpdateLead} onRefresh={handleRefresh} />
      case "metas":
        return <MetasControl leads={filteredLeads} />
      case "vendas":
        return <SalesTracking leads={filteredLeads} />
      case "comissoes":
        return <CommissionControl leads={filteredLeads} />
      case "dashboard":
        return <DashboardAnalytics leads={filteredLeads} />
      default:
        return (
          <LeadsList
            leads={leads}
            onEditLead={handleEditLead}
            onDeleteLead={handleDeleteLead}
            onUpdateLead={handleUpdateLead}
          />
        )
    }
  }

  const performanceMetrics = calculatePerformanceMetrics()
  const headerMetrics = calculateHeaderMetrics()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V4</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Controle de Leads</h1>
              <p className="text-sm text-red-600 font-medium">Jasson Oliveira & Co</p>
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-500">Gerenciamento Comercial</p>
                {getStatusBadge()}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="flex items-center space-x-2 bg-transparent"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 flex items-center space-x-2"
              onClick={() => setIsNovoLeadModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lead</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Filtro por Data */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">Filtro por Data</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Filtrar por:</span>
              <select
                value={dateFilterType}
                onChange={(e) => setDateFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="data_hora_compra">Data Criação</option>
                <option value="data_marcacao">Data da Marcação</option>
                <option value="data_reuniao">Data da Reunião</option>
                <option value="data_assinatura">Data de Assinatura</option>
                <option value="data_ultimo_contato">Data Último Contato</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">De:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Até:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <Button
              onClick={applyDateFilter}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 text-sm"
            >
              Aplicar
            </Button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Primeira fileira: Valor Compra | FEE MRR | FEE ONE-TIME | ROAS */}

          {/* Valor Compra */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Valor Compra
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {headerMetrics.valorCompra.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FEE MRR */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    FEE MRR
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {headerMetrics.feeMRR.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FEE ONE-TIME */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    FEE ONE-TIME
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {headerMetrics.feeOneTime.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ROAS */}
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    ROAS
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{headerMetrics.roas.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segunda fileira: Qtd. Leads | Ticket Médio | Custo por Lead | Qtd. Vendas */}

          {/* Qtd. Leads */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Qtd. Leads
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{headerMetrics.qtdLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Médio */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    Ticket Médio
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {headerMetrics.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custo por Lead */}
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <Info className="w-4 h-4 mr-1" />
                    Custo por Lead
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {headerMetrics.custoPorLead.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Qtd. Vendas */}
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Qtd. Vendas
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{headerMetrics.qtdVendas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                tab.active ? "bg-red-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {renderContent()}
      </div>

      {/* Novo Lead Modal */}
      <NovoLeadModal
        isOpen={isNovoLeadModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveLead}
        editingLead={editingLead}
        saving={saving}
      />
    </div>
  )
}
