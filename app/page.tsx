"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Plus, Info, DollarSign, Users, FileText, BarChart3, CheckCircle } from "lucide-react"
import { LeadsList } from "@/components/leads-list"
import { SalesTracking } from "@/components/sales-tracking"
import { CommissionControl } from "@/components/commission-control"
import { DashboardAnalytics } from "@/components/dashboard-analytics"
import { NovoLeadModal } from "@/components/novo-lead-modal"

export type Lead = {
  id: string
  nomeEmpresa: string
  produtoMarketing?: string
  nicho: string
  dataHoraCompra?: string
  valorPagoLead?: string
  tipoLead?: string
  faturamento?: string
  canal?: string
  nivelUrgencia?: string
  regiao?: string
  cidade?: string
  cnpj?: string
  nomeContato: string
  cargoContato?: string
  email: string
  emailCorporativo?: string
  telefone?: string
  sdr: string
  closer?: string
  arrematador?: string
  produto?: string
  anuncios?: string
  status: string
  observacoes?: string
  dataUltimoContato?: string
  motivoPerdaPV?: string
  temComentarioLBF?: boolean
  investimentoTrafego?: string
  ticketMedio?: string
  qtdLojas?: string
  qtdVendedores?: string
  conseguiuContato?: boolean
  reuniaoAgendada?: boolean
  reuniaoRealizada?: boolean
  valorProposta?: string
  valorVenda?: string
  dataVenda?: string
  dataFechamento?: string
  fee?: string
  escopoFechado?: string
  feeTotal?: string
  vendaViaJassonCo?: boolean
  comissaoSDR?: string
  comissaoCloser?: string
  statusComissao?: string
  created_at?: string
  updated_at?: string
}

// Ultra-robust localStorage operations with extensive logging
const LOCAL_STORAGE_KEY = "jasson-leads-data-v2"

const saveToLocalStorage = (leads: Lead[]) => {
  console.log("🔄 === INICIANDO SALVAMENTO NO LOCALSTORAGE ===")
  console.log("📊 Dados para salvar:", leads)
  console.log("📊 Quantidade de leads:", leads.length)

  try {
    // Test if localStorage is available
    if (typeof Storage === "undefined") {
      throw new Error("localStorage não está disponível neste navegador")
    }

    // Convert to JSON
    const jsonData = JSON.stringify(leads)
    console.log("📝 JSON gerado:", jsonData.substring(0, 200) + "...")

    // Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, jsonData)
    console.log("✅ Dados salvos com sucesso no localStorage")

    // Verify save
    const verification = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (verification) {
      const parsed = JSON.parse(verification)
      console.log("✅ Verificação: dados salvos corretamente -", parsed.length, "leads")
      return true
    } else {
      throw new Error("Falha na verificação do salvamento")
    }
  } catch (error) {
    console.error("❌ ERRO CRÍTICO no salvamento:", error)
    console.error("❌ Tipo do erro:", typeof error)
    console.error("❌ Mensagem:", error.message)

    // Try alternative storage
    try {
      console.log("🔄 Tentando salvamento alternativo...")
      window.jassonLeadsBackup = leads
      console.log("✅ Backup salvo em window.jassonLeadsBackup")
      return false
    } catch (backupError) {
      console.error("❌ Falha no backup também:", backupError)
      return false
    }
  }
}

const loadFromLocalStorage = (): Lead[] => {
  console.log("🔄 === CARREGANDO DO LOCALSTORAGE ===")

  try {
    // Check if localStorage is available
    if (typeof Storage === "undefined") {
      console.warn("⚠️ localStorage não disponível")
      return []
    }

    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    console.log("📱 Dados brutos do localStorage:", data ? "Encontrados" : "Não encontrados")

    if (!data) {
      console.log("📱 Nenhum dado encontrado, retornando array vazio")
      return []
    }

    const leads = JSON.parse(data)
    console.log("✅ Dados carregados com sucesso:", leads.length, "leads")
    console.log("📊 Primeiro lead:", leads[0])

    return Array.isArray(leads) ? leads : []
  } catch (error) {
    console.error("❌ Erro ao carregar do localStorage:", error)

    // Try backup
    try {
      if (window.jassonLeadsBackup) {
        console.log("🔄 Carregando do backup...")
        return window.jassonLeadsBackup
      }
    } catch (backupError) {
      console.error("❌ Erro no backup também:", backupError)
    }

    return []
  }
}

export default function LeadsControl() {
  const [activeTab, setActiveTab] = useState("lista")
  const [isNovoLeadModalOpen, setIsNovoLeadModalOpen] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const tabs = [
    { id: "lista", label: "Lista de Leads", active: activeTab === "lista" },
    { id: "vendas", label: "Acompanhamento de Vendas", active: activeTab === "vendas" },
    { id: "comissoes", label: "Controle de Comissões", active: activeTab === "comissoes" },
    { id: "dashboard", label: "Dashboard & Analytics", active: activeTab === "dashboard" },
  ]

  // Load leads on component mount
  useEffect(() => {
    console.log("🔄 === COMPONENTE MONTADO - CARREGANDO LEADS ===")
    try {
      const savedLeads = loadFromLocalStorage()
      setLeads(savedLeads)
      console.log("✅ Estado atualizado com", savedLeads.length, "leads")
    } catch (error) {
      console.error("❌ Erro crítico no carregamento:", error)
      setLeads([])
    } finally {
      setLoading(false)
      console.log("✅ Loading finalizado")
    }
  }, [])

  const handleSaveLead = async (leadData: any) => {
    console.log("🔄 === FUNÇÃO SALVAR LEAD CHAMADA ===")
    console.log("📊 Dados recebidos do modal:", leadData)

    try {
      setSaving(true)
      console.log("🔄 Estado saving definido como true")

      // Validate required fields with detailed logging - CAMPOS ATUALIZADOS
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

      console.log("🔍 Validando campos obrigatórios...")
      const missingFields = []

      for (const field of requiredFields) {
        const value = leadData[field]
        console.log(`🔍 Campo ${field}:`, value, typeof value)

        if (!value || value === "" || value === null || value === undefined) {
          missingFields.push(field)
        }
      }

      if (missingFields.length > 0) {
        const errorMsg = `❌ Campos obrigatórios não preenchidos: ${missingFields.join(", ")}`
        console.error(errorMsg)
        alert(errorMsg)
        return
      }

      console.log("✅ Validação passou - todos os campos obrigatórios preenchidos")

      // Create new lead object with extensive logging
      const leadId = editingLead ? editingLead.id : `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log("🆔 ID do lead:", leadId)

      const newLead: Lead = {
        id: leadId,
        nomeEmpresa: String(leadData.nomeEmpresa || ""),
        produtoMarketing: String(leadData.produtoMarketing || ""),
        nicho: String(leadData.nicho || ""),
        dataHoraCompra: String(leadData.dataHoraCompra || ""),
        valorPagoLead: String(leadData.valorPagoLead || ""),
        tipoLead: String(leadData.origemLead || ""), // Compatibilidade: salva como tipoLead
        faturamento: String(leadData.faturamento || ""),
        canal: String(leadData.canal || ""),
        nivelUrgencia: String(leadData.nivelUrgencia || ""),
        regiao: String(leadData.regiao || ""),
        cidade: String(leadData.cidade || ""),
        cnpj: String(leadData.cnpj || ""),
        nomeContato: String(leadData.nomeContato || ""),
        cargoContato: String(leadData.cargoContato || ""),
        email: String(leadData.email || ""),
        emailCorporativo: String(leadData.emailCorporativo || ""),
        telefone: String(leadData.telefone || ""),
        sdr: String(leadData.sdr || ""),
        closer: String(leadData.closer || ""),
        arrematador: String(leadData.arrematador || ""),
        produto: String(leadData.produto || ""),
        anuncios: String(leadData.anuncios || ""),
        status: String(leadData.status || ""),
        observacoes: String(leadData.observacoes || ""),
        dataUltimoContato: String(leadData.dataUltimoContato || ""),
        motivoPerdaPV: String(leadData.motivoPerdaPV || ""),
        temComentarioLBF: Boolean(leadData.temComentarioLBF),
        investimentoTrafego: String(leadData.investimentoTrafego || ""),
        ticketMedio: String(leadData.ticketMedio || ""),
        qtdLojas: String(leadData.qtdLojas || ""),
        qtdVendedores: String(leadData.qtdVendedores || ""),
        conseguiuContato: Boolean(leadData.conseguiuContato),
        reuniaoAgendada: Boolean(leadData.reuniaoAgendada),
        reuniaoRealizada: Boolean(leadData.reuniaoRealizada),
        valorProposta: String(leadData.valorProposta || ""),
        valorVenda: String(leadData.valorVenda || ""),
        dataVenda: String(leadData.dataVenda || ""),
        dataFechamento: String(leadData.dataFechamento || ""),
        fee: String(leadData.fee || ""),
        escopoFechado: String(leadData.escopoFechado || ""),
        feeTotal: String(leadData.feeTotal || ""),
        vendaViaJassonCo: Boolean(leadData.vendaViaJassonCo),
        comissaoSDR: String(leadData.comissaoSDR || ""),
        comissaoCloser: String(leadData.comissaoCloser || ""),
        statusComissao: String(leadData.statusComissao || ""),
        created_at: editingLead ? editingLead.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("📝 Lead objeto criado:", newLead)

      // Update leads array
      let updatedLeads: Lead[]

      if (editingLead) {
        console.log("✏️ Atualizando lead existente:", editingLead.id)
        updatedLeads = leads.map((lead) => (lead.id === editingLead.id ? newLead : lead))
        console.log(
          "✏️ Lead atualizado na posição:",
          leads.findIndex((l) => l.id === editingLead.id),
        )
      } else {
        console.log("➕ Adicionando novo lead")
        updatedLeads = [newLead, ...leads]
        console.log("➕ Novo array tem", updatedLeads.length, "leads")
      }

      console.log("💾 Tentando salvar no localStorage...")
      const saveSuccess = saveToLocalStorage(updatedLeads)

      if (saveSuccess !== false) {
        console.log("✅ Salvamento bem-sucedido, atualizando estado...")
        setLeads(updatedLeads)
        console.log("✅ Estado atualizado com", updatedLeads.length, "leads")

        // SEM POP-UP DE SUCESSO - APENAS LOG
        console.log(`✅ Lead "${leadData.nomeEmpresa}" ${editingLead ? "atualizado" : "salvo"} com sucesso!`)

        // Close modal and reset
        setIsNovoLeadModalOpen(false)
        setEditingLead(null)
        console.log("✅ Modal fechado e estado resetado")
      } else {
        throw new Error("Falha no salvamento no localStorage")
      }
    } catch (error) {
      console.error("❌ === ERRO CRÍTICO NO SALVAMENTO ===")
      console.error("❌ Erro:", error)
      console.error("❌ Stack:", error.stack)
      console.error("❌ Dados que causaram erro:", leadData)

      const errorMsg = `❌ Erro ao salvar lead: ${error.message}`
      console.error(errorMsg)
      alert(errorMsg)
    } finally {
      setSaving(false)
      console.log("🔄 Estado saving definido como false")
    }
  }

  const handleEditLead = (lead: Lead) => {
    console.log("✏️ === EDITANDO LEAD ===")
    console.log("✏️ Lead selecionado:", lead)
    setEditingLead(lead)
    setIsNovoLeadModalOpen(true)
    console.log("✏️ Modal aberto para edição")
  }

  const handleDeleteLead = (leadId: string) => {
    console.log("🗑️ === DELETANDO LEAD ===")
    console.log("🗑️ ID para deletar:", leadId)

    const leadToDelete = leads.find((lead) => lead.id === leadId)
    console.log("🗑️ Lead encontrado:", leadToDelete)

    if (leadToDelete && confirm(`Tem certeza que deseja excluir o lead "${leadToDelete.nomeEmpresa}"?`)) {
      try {
        const updatedLeads = leads.filter((lead) => lead.id !== leadId)
        console.log("🗑️ Array atualizado:", updatedLeads.length, "leads restantes")

        saveToLocalStorage(updatedLeads)
        setLeads(updatedLeads)

        // SEM POP-UP DE SUCESSO - APENAS LOG
        console.log(`✅ Lead "${leadToDelete.nomeEmpresa}" excluído com sucesso!`)
      } catch (error) {
        console.error("❌ Erro ao excluir lead:", error)
        alert("❌ Erro ao excluir lead. Tente novamente.")
      }
    }
  }

  const handleCloseModal = () => {
    console.log("❌ === FECHANDO MODAL ===")
    setIsNovoLeadModalOpen(false)
    setEditingLead(null)
    console.log("❌ Modal fechado e estado resetado")
  }

  const handleRefresh = () => {
    console.log("🔄 === ATUALIZANDO DADOS ===")
    try {
      const savedLeads = loadFromLocalStorage()
      setLeads(savedLeads)
      console.log("✅ Dados atualizados:", savedLeads.length, "leads")
    } catch (error) {
      console.error("❌ Erro ao atualizar:", error)
    }
  }

  // Calculate KPIs with logging
  const totalLeads = leads.length
  const totalInvestido = leads.reduce((sum, lead) => {
    const valor = Number.parseFloat(lead.valorPagoLead || "0")
    return sum + (isNaN(valor) ? 0 : valor)
  }, 0)
  const leadsAtivos = leads.filter(
    (lead) => !["CONTRATO ASSINADO", "DROPADO", "PERDIDO", "DESQUALIFICADO"].includes(lead.status),
  ).length
  const totalVendas = leads.reduce((sum, lead) => {
    const valor = Number.parseFloat(lead.valorVenda || "0")
    return sum + (isNaN(valor) ? 0 : valor)
  }, 0)

  const contratoAssinado = leads.filter((lead) => lead.status === "CONTRATO ASSINADO").length
  const followInfinito = leads.filter((lead) => lead.status === "FOLLOW INFINITO").length
  const tentandoContato = leads.filter((lead) => lead.status === "TENTANDO CONTATO").length

  console.log("📊 KPIs calculados:", {
    totalLeads,
    totalInvestido,
    leadsAtivos,
    totalVendas,
    contratoAssinado,
    followInfinito,
    tentandoContato,
  })

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
        return <LeadsList leads={leads} onEditLead={handleEditLead} onDeleteLead={handleDeleteLead} />
      case "vendas":
        return <SalesTracking leads={leads} />
      case "comissoes":
        return <CommissionControl leads={leads} />
      case "dashboard":
        return <DashboardAnalytics leads={leads} />
      default:
        return <LeadsList leads={leads} onEditLead={handleEditLead} onDeleteLead={handleDeleteLead} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">JO</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Controle de Leads</h1>
              <p className="text-sm text-red-600 font-medium">Jasson Oliveira & Co</p>
              <p className="text-sm text-gray-500">Gerenciamento Comercial</p>
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
              onClick={() => {
                console.log("➕ === ABRINDO MODAL NOVO LEAD ===")
                setIsNovoLeadModalOpen(true)
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lead</span>
            </Button>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <Info className="w-4 h-4 mr-1" />
                    Total Leads
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Contratos Assinados
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{contratoAssinado}</p>
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
                    Leads Ativos
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{leadsAtivos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Total Vendas
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    Follow Infinito
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{followInfinito}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Tentando Contato
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{tentandoContato}</p>
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
