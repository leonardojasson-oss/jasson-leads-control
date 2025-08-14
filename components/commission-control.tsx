"use client"

import { Badge } from "@/components/ui/badge"
import type { Lead } from "@/app/page"

interface CommissionControlProps {
  leads: Lead[]
}

export function CommissionControl({ leads }: CommissionControlProps) {
  // Helper function to safely get string value
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return ""
    return String(value)
  }

  // Filter leads that have commission data
  const commissionData = leads.filter(
    (lead) => lead.comissao_sdr || lead.comissao_closer || lead.status_comissao || lead.valor_venda,
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

  const getStatusBadge = (status: string) => {
    const safeStatus = safeString(status).toLowerCase()
    switch (safeStatus) {
      case "pago":
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>
      case "pendente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <span className="text-gray-500">-</span>
    }
  }

  const calculateCommission = (valorVenda: string | number, percentual: string | number) => {
    const safeVenda = safeString(valorVenda)
    const safePercentual = safeString(percentual)

    if (!safeVenda || !safePercentual) return "-"

    try {
      const venda = Number.parseFloat(safeVenda)
      const perc = Number.parseFloat(safePercentual)

      if (isNaN(venda) || isNaN(perc)) return "-"

      const commission = (venda * perc) / 100
      return `R$ ${commission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    } catch {
      return "-"
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Controle de Comissões</h2>
        <p className="text-sm text-gray-500">Comissões de SDR e Closer por lead</p>
      </div>

      {/* Content */}
      {commissionData.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma comissão registrada</h3>
          <p className="text-gray-500 mb-4">
            As comissões de SDR e Closer aparecerão aqui conforme os leads forem processados.
          </p>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SDR</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comissão SDR
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comissão Closer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Comissão
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arrematador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Oferta
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commissionData.map((lead) => (
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
                    <div className="text-sm text-gray-900 capitalize">{safeString(lead.sdr)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{safeString(lead.closer) || "-"}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {safeString(lead.comissao_sdr) ? `${safeString(lead.comissao_sdr)}%` : "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {calculateCommission(lead.valor_venda, lead.comissao_sdr)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {safeString(lead.comissao_closer) ? `${safeString(lead.comissao_closer)}%` : "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {calculateCommission(lead.valor_venda, lead.comissao_closer)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(lead.status_comissao)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{safeString(lead.arrematador) || "-"}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{safeString(lead.tipo_oferta) || "-"}</div>
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
