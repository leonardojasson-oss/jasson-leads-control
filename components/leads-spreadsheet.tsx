"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Settings, Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import type { Lead } from "@/app/page"

interface LeadsSpreadsheetProps {
  leads: Lead[]
  onUpdateLead: (id: string, updates: Partial<Lead>) => void
  onRefresh: () => void
}

export function LeadsSpreadsheet({ leads, onUpdateLead, onRefresh }: LeadsSpreadsheetProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({})
  const [tempValue, setTempValue] = useState<string>("")
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isUpdatingRef = useRef<boolean>(false)

  // TODAS as colunas da planilha
  const columns = [
    { key: "nome_empresa", label: "LEAD", width: "200px", type: "text", essential: true },
    {
      key: "status",
      label: "STATUS",
      width: "150px",
      type: "select",
      essential: true,
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
    { key: "observacoes", label: "OBSERVAÇÕES SDR", width: "200px", type: "text", essential: true },
    { key: "tem_comentario_lbf", label: "COMENTÁRIO NO FORMS", width: "200px", type: "boolean", essential: true },
    { key: "data_ultimo_contato", label: "DATA ÚLTIMO CONTATO", width: "150px", type: "date", essential: true },
    { key: "data_hora_compra", label: "DATA DA COMPRA", width: "150px", type: "datetime-local", essential: true },
    {
      key: "arrematador",
      label: "ARREMATANTE",
      width: "120px",
      type: "select",
      essential: true,
      options: ["alan", "antonio", "francisco", "gabrielli", "giselle", "leonardo", "vanessa"],
    },
    {
      key: "sdr",
      label: "SDR",
      width: "100px",
      type: "select",
      essential: true,
      options: ["antonio", "gabrielli", "vanessa"],
    },
    { key: "valor_pago_lead", label: "VALOR", width: "100px", type: "number", essential: true },
    {
      key: "tipo_lead",
      label: "ORIGEM",
      width: "120px",
      type: "select",
      essential: true,
      options: ["leadbroker", "organico", "indicacao", "facebook", "google", "linkedin"],
    },
    { key: "conseguiu_contato", label: "CS", width: "60px", type: "boolean" },
    { key: "reuniao_agendada", label: "RM", width: "60px", type: "boolean" },
    { key: "reuniao_realizada", label: "RR", width: "60px", type: "boolean" },
    { key: "ns", label: "NS", width: "60px", type: "boolean" },
    { key: "data_venda", label: "DATA DA MARCAÇÃO", width: "150px", type: "date" },
    { key: "data_fechamento", label: "DATA DA REUNIÃO", width: "150px", type: "date" },
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
      options: ["alan", "francisco", "giselle", "leonardo"],
    },
    { key: "observacoes_closer", label: "OBSERVAÇÕES CLOSER", width: "200px", type: "text" },
    { key: "fee_total", label: "FEE MRR", width: "100px", type: "number" },
    { key: "escopo_fechado", label: "FEE ONE-TIME", width: "150px", type: "number" },
    { key: "data_assinatura", label: "DATA DE ASSINATURA", width: "150px", type: "date" },
    { key: "motivo_perda_pv", label: "MOTIVO DE PERDA", width: "150px", type: "text" },
  ]

  // Load column preferences from localStorage
  useEffect(() => {
    const savedColumns = localStorage.getItem("leadsSpreadsheetColumns")
    if (savedColumns) {
      setVisibleColumns(JSON.parse(savedColumns))
    } else {
      // Default: show essential columns
      const defaultVisible = columns.reduce(
        (acc, col) => {
          acc[col.key] = col.essential || false
          return acc
        },
        {} as Record<string, boolean>,
      )
      setVisibleColumns(defaultVisible)
    }
  }, [])

  // Restore scroll position after leads update
  useEffect(() => {
    if (isUpdatingRef.current && scrollContainerRef.current && savedScrollPosition > 0) {
      const restoreScroll = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = savedScrollPosition
        }
      }

      // Multiple attempts to restore scroll
      restoreScroll()
      setTimeout(restoreScroll, 0)
      setTimeout(restoreScroll, 10)
      setTimeout(restoreScroll, 50)
      setTimeout(restoreScroll, 100)
      setTimeout(restoreScroll, 200)

      // Reset flag
      isUpdatingRef.current = false
    }
  }, [leads, savedScrollPosition])

  // Save column preferences to localStorage
  const updateVisibleColumns = (newVisibleColumns: Record<string, boolean>) => {
    setVisibleColumns(newVisibleColumns)
    localStorage.setItem("leadsSpreadsheetColumns", JSON.stringify(newVisibleColumns))
  }

  // Auto-save function with scroll position preservation
  const handleCellEdit = async (leadId: string, field: string, value: any) => {
    // Save current scroll position
    if (scrollContainerRef.current) {
      setSavedScrollPosition(scrollContainerRef.current.scrollLeft)
      isUpdatingRef.current = true
    }

    let updates: Partial<Lead> = { [field]: value }

    // Se a DATA DE ASSINATURA foi preenchida, automaticamente considerar que houve venda
    if (field === "data_assinatura" && value && value.trim() !== "") {
      updates = {
        ...updates,
        data_venda: value, // Usar a mesma data da assinatura como data da venda
        venda_via_jasson_co: true, // Marcar como venda via Jasson&Co
        status: "GANHO", // Atualizar status para GANHO
      }
      console.log("[v0] DATA DE ASSINATURA preenchida - marcando como venda automática:", {
        leadId,
        data_assinatura: value,
      })
    }

    // Save automatically when cell is edited
    await onUpdateLead(leadId, updates)
  }

  const getCellValue = (lead: Lead, field: string) => {
    return (lead as any)[field]
  }

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return ""

    switch (type) {
      case "datetime-local":
        if (typeof value === "string" && value.includes("T")) {
          return value.slice(0, 16)
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
    const isEditingThisCell = editingCell === cellKey
    const value = getCellValue(lead, column.key)

    if (isEditingThisCell) {
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
              value={isEditing ? tempValue : formatValue(value, column.type)}
              onChange={(e) => {
                setTempValue(e.target.value)
              }}
              onFocus={() => {
                setIsEditing(true)
                setTempValue(formatValue(value, column.type))
              }}
              onBlur={(e) => {
                handleCellEdit(lead.id, column.key, e.target.value)
                setEditingCell(null)
                setIsEditing(false)
                setTempValue("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCellEdit(lead.id, column.key, e.currentTarget.value)
                  setEditingCell(null)
                  setIsEditing(false)
                  setTempValue("")
                }
                if (e.key === "Escape") {
                  setEditingCell(null)
                  setIsEditing(false)
                  setTempValue("")
                }
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
          // Para colunas FEE, mostrar como moeda
          if (column.key === "fee_total" || column.key === "escopo_fechado") {
            const numValue = Number(value)
            return isNaN(numValue) ? "" : numValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          }
          return Number(value).toLocaleString("pt-BR")
        case "email":
          return String(value || "")
        default:
          return String(value || "")
      }
    })()

    const isFirstColumn = column.key === "nome_empresa"
    const alignmentClasses = isFirstColumn ? "justify-start" : "justify-center"

    return (
      <div
        className={`h-8 px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 flex items-center min-h-[32px] ${alignmentClasses}`}
        onClick={() => setEditingCell(cellKey)}
        title={`Clique para editar • Valor: ${displayValue}`}
      >
        {column.key === "status" || column.key === "tem_comentario_lbf" || column.key === "ns" ? (
          <Badge className="text-xs" variant="outline">
            {displayValue}
          </Badge>
        ) : (
          <span className={`truncate ${isFirstColumn ? "w-full" : "w-full text-center"}`}>{displayValue}</span>
        )}
      </div>
    )
  }

  const toggleColumn = (columnKey: string) => {
    const newVisible = {
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey],
    }
    updateVisibleColumns(newVisible)
  }

  const visibleColumnsArray = columns.filter((col) => visibleColumns[col.key])

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header Compacto */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-gray-900">📊 Planilha de Leads</h2>
            <span className="text-sm text-gray-500">
              {visibleColumnsArray.length}/{columns.length} colunas • Auto-save ativo
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 bg-transparent">
                  <Settings className="w-3 h-3 mr-1" />
                  Colunas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configurar Colunas Visíveis</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-green-700">✅ Colunas Essenciais</h4>
                      <div className="space-y-2">
                        {columns
                          .filter((col) => col.essential)
                          .map((col) => (
                            <div key={col.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={col.key}
                                checked={visibleColumns[col.key] || false}
                                onCheckedChange={() => toggleColumn(col.key)}
                              />
                              <label htmlFor={col.key} className="text-sm font-medium">
                                {col.label}
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-blue-700">📋 Colunas Adicionais</h4>
                      <div className="space-y-2">
                        {columns
                          .filter((col) => !col.essential)
                          .map((col) => (
                            <div key={col.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={col.key}
                                checked={visibleColumns[col.key] || false}
                                onCheckedChange={() => toggleColumn(col.key)}
                              />
                              <label htmlFor={col.key} className="text-sm">
                                {col.label}
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          const allVisible = columns.reduce(
                            (acc, col) => {
                              acc[col.key] = true
                              return acc
                            },
                            {} as Record<string, boolean>,
                          )
                          updateVisibleColumns(allVisible)
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Mostrar Todas
                      </Button>
                      <Button
                        onClick={() => {
                          const essentialOnly = columns.reduce(
                            (acc, col) => {
                              acc[col.key] = col.essential || false
                              return acc
                            },
                            {} as Record<string, boolean>,
                          )
                          updateVisibleColumns(essentialOnly)
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <EyeOff className="w-3 h-3 mr-1" />
                        Apenas Essenciais
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={onRefresh} size="sm" className="h-8 bg-transparent">
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Planilha */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto max-h-[600px] overflow-y-auto"
        onScroll={(e) => {
          // Continuously save scroll position
          setSavedScrollPosition(e.currentTarget.scrollLeft)
        }}
      >
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
      <div className="p-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>📋 {leads.length} leads</span>
            <span>👁️ {visibleColumnsArray.length} colunas visíveis</span>
          </div>
          <span className="text-green-600 font-medium">✅ Salvamento automático ativo</span>
        </div>
      </div>
    </div>
  )
}
