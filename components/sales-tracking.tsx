"use client"

import { Badge } from "@/components/ui/badge"
import type { Lead } from "@/app/page"

interface SalesTrackingProps {
  leads: Lead[]
}

export function SalesTracking({ leads }: SalesTrackingProps) {
  // Helper function to safely get string value
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return ""
    return String(value)
  }

  // Filter leads that have some sales activity
  const salesData = leads.filter(
    (lead) =>
      lead.conseguiu_contato ||
      lead.reuniao_agendada ||
      lead.reuniao_realizada ||
      lead.valor_proposta ||
      lead.valor_venda,
  )

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

  const getStatusBadge = (status: boolean) => {
    if (status) {
      return <Badge className="bg-black text-white">SIM</Badge>
    } else {
      return <span className="text-gray-500">NÃO</span>
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

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Acompanhamento de Vendas</h2>
        <p className="text-sm text-gray-500">Status do processo de vendas por lead</p>
      </div>

      {/* Content */}
      {salesData.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma venda em andamento</h3>
          <p className="text-gray-500 mb-4">Quando você adicionar leads, o acompanhamento de vendas aparecerá aqui.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto Marketing
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nicho
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reunião Agendada
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reunião Realizada
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Proposta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Venda
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Venda
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{safeString(lead.nome_empresa)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{safeString(lead.produto_marketing) || "-"}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge className={getBadgeColor(lead.nicho)}>{safeString(lead.nicho)}</Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{safeString(lead.nome_contato)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(lead.reuniao_agendada)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(lead.reuniao_realizada)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(lead.valor_proposta)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(lead.valor_venda)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(lead.data_venda)}</div>
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
