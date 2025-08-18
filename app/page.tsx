"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Plus, Info, DollarSign, Users, FileText, BarChart3, CheckCircle, Database } from "lucide-react"
import { LeadsList } from "@/components/leads-list"
import { SalesTracking } from "@/components/sales-tracking"
import { CommissionControl } from "@/components/commission-control"
import { DashboardAnalytics } from "@/components/dashboard-analytics"
import { MetasControl } from "@/components/metas-control"
import { NovoLeadModal } from "@/components/novo-lead-modal"
import { leadOperations, type Lead, isSupabaseConfigured, testSupabaseConnection } from "@/lib/supabase-operations"
import { LeadsSpreadsheet } from "@/components/leads-spreadsheet"

export type { Lead }

export default function LeadsControl() {
  const [activeTab, setActiveTab] = useState("lista")
  const [isNovoLeadModalOpen, setIsNovoLeadModalOpen] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState<"loading" | "connected" | "local">("loading")

  const tabs = [
    { id: "lista", label: "Lista de Leads", active: activeTab === "lista" },
    { id: "planilha", label: "📊 Planilha", active: activeTab === "planilha" },
    { id: "metas", label: "🎯 Controle de Metas", active: activeTab === "metas" },
    { id: "vendas", label: "Acompanhamento de Vendas", active: activeTab === "vendas" },
    { id: "comissoes", label: "Controle de Comissões", active: activeTab === "comissoes" },
    { id: "dashboard", label: "Dashboard & Analytics", active: activeTab === "dashboard" },
  ]

  // Carregar leads na inicialização
  useEffect(() => {
    loadLeads()
  }, [])

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
        observacoes: leadData.observacoes,
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
        data_venda: leadData.dataVenda || null,
        data_fechamento: leadData.dataFechamento || null,
        fee: Number.parseFloat(leadData.fee) || null,
        escopo_fechado: leadData.escopoFechado,
        fee_total: Number.parseFloat(leadData.feeTotal) || null,
        venda_via_jasson_co: leadData.vendaViaJassonCo || false,
        comissao_sdr: Number.parseFloat(leadData.comissaoSDR) || null,
        comissao_closer: Number.parseFloat(leadData.comissaoCloser) || null,
        status_comissao: leadData.statusComissao,
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
