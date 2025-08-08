"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Plus, Info, DollarSign, Users, FileText, BarChart3, CheckCircle, Database } from 'lucide-react'
import { LeadsList } from "@/components/leads-list"
import { SalesTracking } from "@/components/sales-tracking"
import { CommissionControl } from "@/components/commission-control"
import { DashboardAnalytics } from "@/components/dashboard-analytics"
import { MetasControl } from "@/components/metas-control"
import { NovoLeadModal } from "@/components/novo-lead-modal"
import { leadOperations, type Lead, isSupabaseConfigured } from "@/lib/supabase-operations"
import { LeadsSpreadsheet } from "@/components/leads-spreadsheet"
import { DeleteImportedLeadsButton } from "@/components/delete-imported-leads-button" // Importe o novo componente
import { FunnelsDashboard } from "@/components/funnels-dashboard"

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

      const loadedLeads = await leadOperations.getAll()
      setLeads(loadedLeads)
      console.log("✅ Leads carregados:", loadedLeads.length)

      // Determinar status da conexão
      if (isSupabaseConfigured) {
        // Check if any lead ID is a number (from Supabase) or string (from localStorage)
        const hasSupabaseData = loadedLeads.some((lead) => typeof lead.id === "number")
        setSupabaseStatus(hasSupabaseData ? "connected" : "local")
      } else {
        setSupabaseStatus("local")
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

    try {
      setSaving(true)

      // Validação básica - CAMPOS OBRIGATÓRIOS
      const requiredFields = [
        "nomeEmpresa", // Changed from nome_empresa
        "nicho",
        "nomeContato", // Changed from nome_contato
        "email",
        "sdr",
        "status",
      ]

      const missingFields = requiredFields.filter((field) => {
        const value = leadData[field]
        return !value || value === ""
      })

      if (missingFields.length > 0) {
        alert(`❌ Campos obrigatórios não preenchidos:\n${missingFields.join(", ")}`)
        return
      }

      // Prepare data for saving (map from form data to Lead type)
      const leadToSave: Omit<Lead, "id" | "created_at" | "updated_at"> = {
        nome_empresa: leadData.nomeEmpresa,
        nome_fantazia: leadData.nomeFantazia,
        produto_marketing: leadData.produtoMarketing,
        nicho: leadData.nicho,
        data_compra: leadData.dataCompra || null,
        horario_compra: leadData.horarioCompra || null,
        valor_venda: Number.parseFloat(leadData.valorVenda) || null,
        venda: leadData.venda || false,
        tipo_lead: leadData.tipoLead,
        faturamento: leadData.faturamento,
        canal: leadData.canal,
        nivel_urgencia: leadData.nivelUrgencia,
        regiao: leadData.regiao,
        cidade: leadData.cidade,
        nome_contato: leadData.nomeContato,
        cargo_contato: leadData.cargoContato,
        email: leadData.email,
        email_corporativo: leadData.emailCorporativo || false,
        sdr: leadData.sdr,
        closer: leadData.closer,
        arrematador: leadData.arrematador,
        anuncios: leadData.anuncios || false,
        status: leadData.status || "BACKLOG",
        observacoes: leadData.observacoes,
        data_ultimo_contato: leadData.dataUltimoContato || null,
        cs: leadData.conseguiuContato || false,
        rm: leadData.reuniaoAgendada || false,
        rr: leadData.reuniaoRealizada || false,
        ns: leadData.noShow || false,
        data_marcacao: leadData.dataMarcacao || null,
        data_reuniao: leadData.dataReuniao || null,
        data_assinatura: leadData.dataAssinatura || null,
        fee: Number.parseFloat(leadData.fee) || null,
        escopo_fechado_valor: Number.parseFloat(leadData.escopoFechadoValor) || null,
        fee_total: Number.parseFloat(leadData.feeTotal) || null,
      }

      let result: Lead

      if (editingLead) {
        console.log("✏️ Atualizando lead existente")
        result = (await leadOperations.update(editingLead.id, leadToSave)) || editingLead
      } else {
        console.log("➕ Criando novo lead")
        result = await leadOperations.create(leadToSave)
      }

      console.log("✅ Lead salvo com sucesso:", result.id)

      // Recarregar lista
      await loadLeads()

      // Fechar modal
      setIsNovoLeadModalOpen(false)
      setEditingLead(null)
    } catch (error: any) {
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

  const handleDeleteLead = async (leadId: string | number) => {
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

  const handleUpdateLead = async (id: string | number, updates: Partial<Lead>) => {
    try {
      await leadOperations.update(id, updates)
      await loadLeads() // Recarregar dados
    } catch (error) {
      console.error("Erro ao atualizar lead:", error)
      alert("Erro ao atualizar lead")
    }
  }

  // Calcular KPIs
  const totalLeads = leads.length
  // Removed totalInvestido as valor_pago_lead is gone
  const leadsAtivos = leads.filter(
    (lead) => !["GANHO", "DROPADO"].includes(lead.status), // Assuming GANHO and DROPADO are final states
  ).length
  const totalVendas = leads.reduce((sum, lead) => {
    const valor = Number.parseFloat(String(lead.valor_venda || "0"))
    return sum + (isNaN(valor) ? 0 : valor)
  }, 0)

  const contratoAssinado = leads.filter((lead) => lead.status === "CONTRATO ASSINADO" || lead.status === "GANHO").length
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
        return <LeadsList leads={leads} onEditLead={handleEditLead} onDeleteLead={handleDeleteLead} />
      case "planilha":
        return <LeadsSpreadsheet leads={leads} onUpdateLead={handleUpdateLead} onRefresh={handleRefresh} />
      case "metas":
        return <MetasControl leads={leads} />
      case "vendas":
        return <SalesTracking leads={leads} />
      case "comissoes":
        return <CommissionControl leads={leads} />
      case "dashboard":
        return <FunnelsDashboard leads={leads} />
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
            {/* Novo botão de exclusão de leads importados */}
            <DeleteImportedLeadsButton onDeletionComplete={handleRefresh} />
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
