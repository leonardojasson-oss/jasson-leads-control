"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Edit, Trash2, Filter } from "lucide-react"
import type { Lead } from "@/app/page"

interface LeadsListProps {
  leads: Lead[]
  onEditLead: (lead: Lead) => void
  onDeleteLead: (leadId: string) => void
}

export function LeadsList({ leads, onEditLead, onDeleteLead }: LeadsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")

  // Status options with colors (matching the spreadsheet)
  const statusOptions = [
    { value: "CONTRATO ASSINADO", label: "Contrato Assinado", color: "bg-green-100 text-green-800 border-green-200" },
    { value: "DROPADO", label: "Dropado", color: "bg-gray-100 text-gray-800 border-gray-200" },
    { value: "FOLLOW INFINITO", label: "Follow Infinito", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { value: "PERDIDO", label: "Perdido", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { value: "DESQUALIFICADO", label: "Desqualificado", color: "bg-gray-100 text-gray-800 border-gray-200" },
    { value: "TENTANDO CONTATO", label: "Tentando Contato", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { value: "NO-SHOW/REMARCANDO", label: "No-Show/Remarcando", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
    { value: "BACKLOG", label: "Backlog", color: "bg-red-100 text-red-800 border-red-200" },
    { value: "CONTATO AGENDADO", label: "Contato Agendado", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { value: "QUALIFICANDO", label: "Qualificando", color: "bg-orange-100 text-orange-800 border-orange-200" },
    { value: "REUNIÃO AGENDADA", label: "Reunião Agendada", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    { value: "REUNIÃO", label: "Reunião", color: "bg-pink-100 text-pink-800 border-pink-200" },
    { value: "REUNIÃO REALIZADA", label: "Reunião Realizada", color: "bg-teal-100 text-teal-800 border-teal-200" },
    {
      value: "DÚVIDAS E FECHAMENTO",
      label: "Dúvidas e Fechamento",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    },
    { value: "CONTRATO NA RUA", label: "Contrato na Rua", color: "bg-lime-100 text-lime-800 border-lime-200" },
    { value: "GANHO", label: "Ganho", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { value: "FOLLOW UP", label: "Follow Up", color: "bg-violet-100 text-violet-800 border-violet-200" },
    { value: "NO-SHOW", label: "No-Show", color: "bg-rose-100 text-rose-800 border-rose-200" },
  ]

  // Helper function to safely get string value
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return ""
    return String(value)
  }

  // Filter leads based on search term and status
  const filteredLeads = leads.filter((lead) => {
    // Safe string conversions for search
    const nomeEmpresa = safeString(lead.nome_empresa).toLowerCase()
    const nomeContato = safeString(lead.nome_contato).toLowerCase()
    const produtoMarketing = safeString(lead.produto_marketing).toLowerCase()
    const nicho = safeString(lead.nicho).toLowerCase()
    const sdr = safeString(lead.sdr).toLowerCase()
    const closer = safeString(lead.closer).toLowerCase()
    const searchLower = safeString(searchTerm).toLowerCase()

    const matchesSearch =
      nomeEmpresa.includes(searchLower) ||
      nomeContato.includes(searchLower) ||
      produtoMarketing.includes(searchLower) ||
      nicho.includes(searchLower) ||
      sdr.includes(searchLower) ||
      closer.includes(searchLower)

    const matchesStatus = statusFilter === "todos" || safeString(lead.status) === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const safeStatus = safeString(status)
    const statusOption = statusOptions.find((option) => option.value === safeStatus)
    if (!statusOption) {
      return <Badge className="bg-gray-100 text-gray-800">{safeStatus || "Sem Status"}</Badge>
    }
    return <Badge className={statusOption.color}>{statusOption.label}</Badge>
  }

  const getBadgeColor = (type: string) => {
    const safeType = safeString(type).toLowerCase()
    switch (safeType) {
      case "estruturação estratégica":
        return "bg-blue-100 text-blue-800"
      case "assessoria":
        return "bg-blue-100 text-blue-800"
      case "varejo":
        return "bg-green-100 text-green-800"
      case "serviço":
        return "bg-green-100 text-green-800"
      case "indústria":
        return "bg-green-100 text-green-800"
      case "outro":
        return "bg-green-100 text-green-800"
      case "turismo":
        return "bg-green-100 text-green-800"
      case "e-commerce":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDateTime = (dateString: string) => {
    const safeDateString = safeString(dateString)
    if (!safeDateString) return "-"
    try {
      const date = new Date(safeDateString)
      return isNaN(date.getTime()) ? "-" : date.toLocaleString("pt-BR")
    } catch {
      return "-"
    }
  }

  const formatDate = (dateString: string) => {
    const safeDateString = safeString(dateString)
    if (!safeDateString) return "-"
    try {
      const date = new Date(safeDateString)
      return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR")
    } catch {
      return "-"
    }
  }

  const formatCurrency = (value: string | number) => {
    const safeValue = safeString(value)
    if (!safeValue) return "-"
    try {
      const num = Number.parseFloat(safeValue)
      return isNaN(num) ? "-" : `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    } catch {
      return "-"
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por empresa, contato, produto, nicho, SDR ou Closer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Leads Cadastrados ({filteredLeads.length})</h2>
        <p className="text-sm text-gray-500">Lista completa de leads e suas informações</p>
      </div>

      {/* Content */}
      {filteredLeads.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {leads.length === 0 ? "Nenhum lead encontrado" : "Nenhum resultado encontrado"}
          </h3>
          <p className="text-gray-500 mb-4">
            {leads.length === 0
              ? 'Comece adicionando seu primeiro lead clicando no botão "Novo Lead" acima.'
              : "Tente ajustar os termos de busca ou filtros para encontrar o que procura."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto Marketing
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nicho
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Lead
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SDR</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Contato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Venda
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observações
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(lead.status)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{safeString(lead.nome_empresa)}</div>
                    <div className="text-sm text-gray-500">{safeString(lead.cidade) || "-"}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{safeString(lead.nome_contato)}</div>
                    <div className="text-sm text-gray-500">{safeString(lead.email)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{safeString(lead.produto_marketing) || "-"}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge className={getBadgeColor(lead.nicho)}>{safeString(lead.nicho)}</Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(lead.valor_pago_lead)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{safeString(lead.sdr)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{safeString(lead.closer) || "-"}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(lead.data_ultimo_contato)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(lead.valor_venda)}</div>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    <div className="text-sm text-gray-900 truncate" title={safeString(lead.observacoes)}>
                      {safeString(lead.observacoes) || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditLead(lead)}
                        className="h-8 w-8 p-0"
                        title="Editar lead"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteLead(lead.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
