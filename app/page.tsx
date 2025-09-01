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
  TrendingUp,
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

  const getCurrentMonthLeads = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return leads.filter((lead) => {
      if (!lead.data_hora_compra) return false
      const leadDate = new Date(lead.data_hora_compra)
      return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear
    })
  }

  const calculatePerformanceMetrics = () => {
    const currentMonthLeads = getCurrentMonthLeads()

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

  const getPerformanceColor = (percentual: number) => {
    if (percentual >= 100) return "border-l-green-500"
    if (percentual >= 80) return "border-l-yellow-500"
    return "border-l-red-500"
  }

  const getPerformanceTextColor = (percentual: number) => {
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
        return <MetasControl leads={leads} />
      case "vendas":
        return <SalesTracking leads={leads} />
      case "comissoes":
        return <CommissionControl leads={leads} />
      case "dashboard":
        return <DashboardAnalytics leads={leads} />
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

      {/* KPI Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
          {/* Leads Comprados */}
          <Card
            className={`border-l-4 ${getPerformanceColor((performanceMetrics.leadsComprados.realizado / performanceMetrics.leadsComprados.meta) * 100)}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    Leads Comprados
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{performanceMetrics.leadsComprados.realizado}</p>
                  <p className="text-xs text-gray-500">Meta: {performanceMetrics.leadsComprados.meta}</p>
                  <p
                    className={`text-xs font-medium ${getPerformanceTextColor((performanceMetrics.leadsComprados.realizado / performanceMetrics.leadsComprados.meta) * 100)}`}
                  >
                    {performanceMetrics.leadsComprados.meta > 0
                      ? `${((performanceMetrics.leadsComprados.realizado / performanceMetrics.leadsComprados.meta) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investimento */}
          <Card
            className={`border-l-4 ${getPerformanceColor((performanceMetrics.investimento.realizado / performanceMetrics.investimento.meta) * 100)}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Investimento
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {performanceMetrics.investimento.realizado.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Meta: R${" "}
                    {performanceMetrics.investimento.meta.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                  <p
                    className={`text-xs font-medium ${getPerformanceTextColor((performanceMetrics.investimento.realizado / performanceMetrics.investimento.meta) * 100)}`}
                  >
                    {performanceMetrics.investimento.meta > 0
                      ? `${((performanceMetrics.investimento.realizado / performanceMetrics.investimento.meta) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RM (Reuniões Marcadas) */}
          <Card
            className={`border-l-4 ${getPerformanceColor((performanceMetrics.rm.realizado / performanceMetrics.rm.meta) * 100)}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    RM
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{performanceMetrics.rm.realizado}</p>
                  <p className="text-xs text-gray-500">Meta: {performanceMetrics.rm.meta}</p>
                  <p
                    className={`text-xs font-medium ${getPerformanceTextColor((performanceMetrics.rm.realizado / performanceMetrics.rm.meta) * 100)}`}
                  >
                    {performanceMetrics.rm.meta > 0
                      ? `${((performanceMetrics.rm.realizado / performanceMetrics.rm.meta) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RR (Reuniões Realizadas) */}
          <Card
            className={`border-l-4 ${getPerformanceColor((performanceMetrics.rr.realizado / performanceMetrics.rr.meta) * 100)}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    RR
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{performanceMetrics.rr.realizado}</p>
                  <p className="text-xs text-gray-500">Meta: {performanceMetrics.rr.meta}</p>
                  <p
                    className={`text-xs font-medium ${getPerformanceTextColor((performanceMetrics.rr.realizado / performanceMetrics.rr.meta) * 100)}`}
                  >
                    {performanceMetrics.rr.meta > 0
                      ? `${((performanceMetrics.rr.realizado / performanceMetrics.rr.meta) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FEE MRR */}
          <Card
            className={`border-l-4 ${getPerformanceColor((performanceMetrics.feeMRR.realizado / performanceMetrics.feeMRR.meta) * 100)}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    FEE MRR
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {performanceMetrics.feeMRR.realizado.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Meta: R$ {performanceMetrics.feeMRR.meta.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                  <p
                    className={`text-xs font-medium ${getPerformanceTextColor((performanceMetrics.feeMRR.realizado / performanceMetrics.feeMRR.meta) * 100)}`}
                  >
                    {performanceMetrics.feeMRR.meta > 0
                      ? `${((performanceMetrics.feeMRR.realizado / performanceMetrics.feeMRR.meta) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FEE ONE-TIME */}
          <Card
            className={`border-l-4 ${getPerformanceColor((performanceMetrics.feeOneTime.realizado / performanceMetrics.feeOneTime.meta) * 100)}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    FEE ONE-TIME
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {performanceMetrics.feeOneTime.realizado.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Meta: R$ {performanceMetrics.feeOneTime.meta.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                  <p
                    className={`text-xs font-medium ${getPerformanceTextColor((performanceMetrics.feeOneTime.realizado / performanceMetrics.feeOneTime.meta) * 100)}`}
                  >
                    {performanceMetrics.feeOneTime.meta > 0
                      ? `${((performanceMetrics.feeOneTime.realizado / performanceMetrics.feeOneTime.meta) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ROAS */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    ROAS
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{performanceMetrics.roas.toFixed(2)}x</p>
                  <p className="text-xs text-gray-500">Retorno sobre Investimento</p>
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
