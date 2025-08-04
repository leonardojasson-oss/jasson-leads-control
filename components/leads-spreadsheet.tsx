"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Save, RefreshCw, Filter, Eye, EyeOff, RotateCcw } from "lucide-react"
import type { Lead } from "@/app/page"

interface LeadsSpreadsheetProps {
  leads: Lead[]
  onUpdateLead: (id: string, updates: Partial<Lead>) => void
  onRefresh: () => void
}

export function LeadsSpreadsheet({ leads, onUpdateLead, onRefresh }: LeadsSpreadsheetProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [localChanges, setLocalChanges] = useState<Record<string, Partial<Lead>>>({})
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    // Colunas principais sempre visíveis
    nome_empresa: true,
    status: true,
    observacoes: true,
    data_ultimo_contato: true,
    data_hora_compra: true,
    arrematador: true,
    sdr: true,
    valor_pago_lead: true,
    tipo_lead: true,
    conseguiu_contato: true,
    reuniao_agendada: true,
    reuniao_realizada: true,
    // Outras colunas inicialmente ocultas
    data_venda: false,
    data_fechamento: false,
    motivo_perda_pv: false,
    faturamento: false,
    nicho: false,
    cidade: false,
    regiao: false,
    cargo_contato: false,
    email: false,
    produto: false,
    anuncios: false,
    horario_compra: false,
    closer: false,
    tem_comentario_lbf: false,
    fee: false,
    fee_total: false,
    escopo_fechado: false,
    data_assinatura: false,
  })

  // TODAS as colunas da planilha conforme solicitado
  const columns = [
    { key: "nome_empresa", label: "LEAD", width: "200px", type: "text" },
    {
      key: "status",
      label: "STATUS",
      width: "150px",
      type: "select",
      options: [
        "BACKLOG",
        "TENTANDO CONTATO",
        "CONTATO AGENDADO",
        "QUALIFICANDO",
        "REUNIÃO AGENDADA",
        "REUNIÃO",
        "REUNIÃO REALIZADA",
        "DÚVIDAS E FECHAMENTO",
        "CONTRATO NA RUA",
        "GANHO",
        "FOLLOW UP",
        "NO-SHOW",
        "DROPADO",
        "FOLLOW INFINITO",
      ],
    },
    { key: "observacoes", label: "OBSERVAÇÕES", width: "200px", type: "text" },
    { key: "data_ultimo_contato", label: "DATA ÚLTIMO CONTATO", width: "150px", type: "date" },
    { key: "data_hora_compra", label: "DATA DA COMPRA", width: "150px", type: "datetime-local" },
    {
      key: "arrematador",
      label: "ARREMATANTE",
      width: "120px",
      type: "select",
      options: ["alan", "antonio", "gabrielli", "jasson", "vanessa", "william"],
    },
    { key: "sdr", label: "SDR", width: "100px", type: "select", options: ["antonio", "gabrielli", "vanessa"] },
    { key: "valor_pago_lead", label: "VALOR", width: "100px", type: "number" },
    {
      key: "tipo_lead",
      label: "ORIGEM",
      width: "120px",
      type: "select",
      options: ["leadbroker", "organico", "indicacao", "facebook", "google", "linkedin"],
    },
    { key: "conseguiu_contato", label: "CS", width: "60px", type: "boolean" },
    { key: "reuniao_agendada", label: "RM", width: "60px", type: "boolean" },
    { key: "reuniao_realizada", label: "RR", width: "60px", type: "boolean" },
    { key: "reuniao_realizada", label: "RNS", width: "60px", type: "boolean" }, // Assumindo que RNS = Reunião Realizada
    { key: "data_venda", label: "DATA DA MARCAÇÃO", width: "150px", type: "date" },
    { key: "data_fechamento", label: "DATA DA REUNIÃO", width: "150px", type: "date" },
    { key: "motivo_perda_pv", label: "MOTIVO DE PERDA", width: "150px", type: "text" },
    { key: "faturamento", label: "FATURAMENTO", width: "150px", type: "text" },
    {
      key: "nicho",
      label: "SEGMENTO",
      width: "120px",
      type: "select",
      options: [
        "Estruturação Estratégica",
        "Assessoria",
        "Varejo",
        "Serviço",
        "Indústria",
        "Outro",
        "Turismo",
        "E-commerce",
      ],
    },
    { key: "cidade", label: "CIDADE", width: "120px", type: "text" },
    { key: "regiao", label: "REGIÃO", width: "120px", type: "text" },
    { key: "cargo_contato", label: "CARGO", width: "120px", type: "text" },
    { key: "email", label: "EMAIL", width: "200px", type: "email" },
    { key: "produto", label: "PRODUTO", width: "150px", type: "text" },
    {
      key: "anuncios",
      label: "ANÚNCIOS",
      width: "100px",
      type: "select",
      options: ["sim", "nao"],
    },
    { key: "horario_compra", label: "HORÁRIO DE COMPRA", width: "130px", type: "time" },
    {
      key: "closer",
      label: "CLOSER",
      width: "100px",
      type: "select",
      options: ["antonio", "gabrielli", "vanessa", "jasson", "leonardo"],
    },
    { key: "tem_comentario_lbf", label: "COMENTÁRIO", width: "100px", type: "boolean" },
    { key: "motivo_perda_pv", label: "MOTIVO DE PERDA", width: "150px", type: "text" },
    { key: "fee", label: "FEE", width: "100px", type: "number" },
    { key: "fee_total", label: "MRR FEE", width: "100px", type: "number" },
    { key: "escopo_fechado", label: "ESCOPO FECHADO", width: "150px", type: "text" },
    { key: "data_fechamento", label: "DATA DE ASSINATURA", width: "150px", type: "date" },
  ]

  const handleCellEdit = (leadId: string, field: string, value: any) => {
    setLocalChanges((prev) => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        [field]: value,
      },
    }))
  }

  const handleSaveAllChanges = async () => {
    for (const [leadId, changes] of Object.entries(localChanges)) {
      await onUpdateLead(leadId, changes)
    }
    setLocalChanges({})
  }

  const getCellValue = (lead: Lead, field: string) => {
    const localValue = localChanges[lead.id]?.[field as keyof Lead]
    return localValue !== undefined ? localValue : (lead as any)[field]
  }

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return ""

    switch (type) {
      case "datetime-local":
        if (typeof value === "string" && value.includes("T")) {
          return value.slice(0, 16) // YYYY-MM-DDTHH:MM
        }
        return value || ""
      case "date":
        if (typeof value === "string" && value.includes("T")) {
          return value.split("T")[0]
        }
        return value || ""
      case "time":
        if (typeof value === "string" && value.includes("T")) {
          return value.split("T")[1]?.slice(0, 5) || ""
        }
        return value || ""
      case "number":
        return String(value || "")
      case "boolean":
        return value
      default:
        return String(value || "")
    }
  }

  const renderCell = (lead: Lead, column: any) => {
    const cellKey = `${lead.id}-${column.key}`
    const isEditing = editingCell === cellKey
    const value = getCellValue(lead, column.key)
    const hasChanges = localChanges[lead.id]?.[column.key as keyof Lead] !== undefined

    if (isEditing) {
      switch (column.type) {
        case "select":
          return (
            <Select
              value={formatValue(value, column.type)}
              onValueChange={(newValue) => {
                handleCellEdit(lead.id, column.key, newValue)
                setEditingCell(null)
              }}
              onOpenChange={(open) => !open && setEditingCell(null)}
            >
              <SelectTrigger className="h-7 text-xs border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {column.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )

        case "boolean":
          return (
            <Select
              value={value ? "true" : "false"}
              onValueChange={(newValue) => {
                handleCellEdit(lead.id, column.key, newValue === "true")
                setEditingCell(null)
              }}
              onOpenChange={(open) => !open && setEditingCell(null)}
            >
              <SelectTrigger className="h-7 text-xs border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">✅</SelectItem>
                <SelectItem value="false">❌</SelectItem>
              </SelectContent>
            </Select>
          )

        default:
          return (
            <Input
              type={column.type}
              value={formatValue(value, column.type)}
              onChange={(e) => handleCellEdit(lead.id, column.key, e.target.value)}
              onBlur={() => setEditingCell(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingCell(null)
                if (e.key === "Escape") setEditingCell(null)
              }}
              className="h-7 text-xs border-blue-500"
              autoFocus
            />
          )
      }
    }

    // Renderização normal da célula
    const displayValue = (() => {
      switch (column.type) {
        case "boolean":
          return value ? "✅" : "❌"
        case "date":
        case "datetime-local":
          if (!value) return ""
          try {
            return new Date(value).toLocaleDateString("pt-BR")
          } catch {
            return value
          }
        case "time":
          return value || ""
        case "number":
          if (!value) return ""
          return Number(value).toLocaleString("pt-BR")
        case "email":
          return String(value || "")
        default:
          return String(value || "")
      }
    })()

    return (
      <div
        className={`h-8 px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 flex items-center min-h-[32px] ${
          hasChanges ? "bg-yellow-50 border-l-2 border-l-yellow-400" : ""
        }`}
        onClick={() => setEditingCell(cellKey)}
        title={`Clique para editar • Valor: ${displayValue}`}
      >
        {column.key === "status" ? (
          <Badge className="text-xs" variant="outline">
            {displayValue}
          </Badge>
        ) : (
          <span className="truncate w-full">{displayValue}</span>
        )}
      </div>
    )
  }

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }))
  }

  const showAllColumns = () => {
    const allVisible = columns.reduce(
      (acc, col) => {
        acc[col.key] = true
        return acc
      },
      {} as Record<string, boolean>,
    )
    setVisibleColumns(allVisible)
  }

  const hideAllColumns = () => {
    const essentialColumns = ["nome_empresa", "status", "sdr", "arrematador"]
    const newVisible = columns.reduce(
      (acc, col) => {
        acc[col.key] = essentialColumns.includes(col.key)
        return acc
      },
      {} as Record<string, boolean>,
    )
    setVisibleColumns(newVisible)
  }

  const visibleColumnsArray = columns.filter((col) => visibleColumns[col.key])
  const hasUnsavedChanges = Object.keys(localChanges).length > 0

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">📊 Planilha Completa de Leads</h2>
            <p className="text-sm text-gray-500">
              Todas as colunas disponíveis • {visibleColumnsArray.length} de {columns.length} colunas visíveis
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <Button onClick={handleSaveAllChanges} className="bg-green-600 hover:bg-green-700 text-sm" size="sm">
                <Save className="w-4 h-4 mr-1" />
                Salvar Todas ({Object.keys(localChanges).length})
              </Button>
            )}
            <Button variant="outline" onClick={onRefresh} size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Controles de Colunas */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Button onClick={showAllColumns} variant="outline" size="sm" className="text-xs bg-transparent">
              <Eye className="w-3 h-3 mr-1" />
              Mostrar Todas
            </Button>
            <Button onClick={hideAllColumns} variant="outline" size="sm" className="text-xs bg-transparent">
              <EyeOff className="w-3 h-3 mr-1" />
              Essenciais
            </Button>
            <Button
              onClick={() => setLocalChanges({})}
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={!hasUnsavedChanges}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Descartar Alterações
            </Button>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Colunas:</span>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {columns.map((col) => (
                <Button
                  key={col.key}
                  variant={visibleColumns[col.key] ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleColumn(col.key)}
                  className="h-6 px-2 text-xs"
                >
                  {visibleColumns[col.key] ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  {col.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Planilha */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full border-collapse">
          {/* Header da Tabela */}
          <thead className="bg-red-600 text-white sticky top-0 z-10">
            <tr>
              {visibleColumnsArray.map((column) => (
                <th
                  key={column.key}
                  className="px-2 py-3 text-xs font-bold uppercase border-r border-red-500 text-center"
                  style={{ minWidth: column.width, width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Linhas de Dados */}
          <tbody>
            {leads.map((lead, index) => (
              <tr
                key={lead.id}
                className={`border-b border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
              >
                {visibleColumnsArray.map((column) => (
                  <td
                    key={`${lead.id}-${column.key}`}
                    className="border-r border-gray-200 p-0"
                    style={{ minWidth: column.width, width: column.width }}
                  >
                    {renderCell(lead, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>📋 {leads.length} leads exibidos</span>
            <span>
              👁️ {visibleColumnsArray.length}/{columns.length} colunas visíveis
            </span>
          </div>
          {hasUnsavedChanges && (
            <span className="text-yellow-600 font-medium">
              ⚠️ {Object.keys(localChanges).length} alterações não salvas
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
