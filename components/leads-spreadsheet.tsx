"use client"

import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Settings, Filter, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import type { Lead } from "@/app/page"
import { normalizePersonName } from "@/lib/normalizers"

interface LeadsSpreadsheetProps {
  leads: Lead[]
  onUpdateLead: (id: string, updates: Partial<Lead>) => void
  onRefresh: () => void
}

export function LeadsSpreadsheet({ leads, onUpdateLead, onRefresh }: LeadsSpreadsheetProps) {
  console.log("[v0] LeadsSpreadsheet renderizando com", leads.length, "leads")

  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({})
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState<string>("")
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isManuallyEdited, setIsManuallyEdited] = useState<boolean>(false)
  const [editingPreset, setEditingPreset] = useState<string | null>(null)
  const [presetColumns, setPresetColumns] = useState<Record<string, string[]>>({})
  const [tempPresetColumns, setTempPresetColumns] = useState<string[]>([])
  const [dateFilterColumn, setDateFilterColumn] = useState<string>("")
  const [dateFilterStart, setDateFilterStart] = useState<string>("")
  const [dateFilterEnd, setDateFilterEnd] = useState<string>("")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)

  const dateFilterOptions = [
    { value: "data_reuniao", label: "DATA DA REUNIÃO" },
    { value: "data_ultimo_contato", label: "DATA ÚLTIMO CONTATO" },
    { value: "data_hora_compra", label: "DATA DA COMPRA" },
    { value: "data_marcacao", label: "DATA DA MARCAÇÃO" },
    { value: "data_assinatura", label: "DATA DE ASSINATURA" },
  ]

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
        "QUALI AGENDADA",
        "QUALIFICANDO",
        "REUNIÃO AGENDADA",
        "REUNIÃO REALIZADA",
        "DÚVIDAS E FECHAMENTO",
        "CONTRATO NA RUA",
        "GANHO",
        "FOLLOW UP",
        "FOLLOW INFINITO",
        "NO-SHOW",
        "DROPADO",
        "PERDIDO",
      ],
    },
    { key: "observacoes_sdr", label: "OBSERVAÇÕES SDR", width: "200px", type: "text", essential: true },
    { key: "tem_comentario_lbf", label: "COMENTÁRIO NO FORMS", width: "200px", type: "boolean", essential: true },
    { key: "link_bant", label: "LINK BANT", width: "180px", type: "text", essential: true },
    { key: "data_ultimo_contato", label: "DATA ÚLTIMO CONTATO", width: "150px", type: "date", essential: true },
    { key: "data_hora_compra", label: "DATA DA COMPRA", width: "150px", type: "datetime-local", essential: true },
    {
      key: "arrematador",
      label: "ARREMATANTE",
      width: "120px",
      type: "select",
      essential: true,
      options: [
        "alan",
        "antonio",
        "francisco",
        "gabrielli",
        "giselle",
        "leonardo",
        "vanessa",
        "guilherme",
        "marcelo",
        "allan",
        "matriz",
      ],
    },
    {
      key: "sdr",
      label: "SDR",
      width: "100px",
      type: "select",
      essential: true,
      options: ["antonio", "gabrielli", "vanessa", "guilherme"],
    },
    { key: "valor_pago_lead", label: "VALOR", width: "100px", type: "number", essential: true },
    {
      key: "tipo_lead",
      label: "ORIGEM",
      width: "120px",
      type: "select",
      essential: true,
      options: ["leadbroker", "indicacao", "blackbox", "recomendacao", "outbound", "evento", "networking"],
    },
    { key: "conseguiu_contato", label: "CS", width: "60px", type: "tristate" },
    { key: "reuniao_agendada", label: "RM", width: "60px", type: "tristate" },
    { key: "reuniao_realizada", label: "RR", width: "60px", type: "tristate" },
    { key: "data_marcacao", label: "DATA DA MARCAÇÃO", width: "150px", type: "date" },
    { key: "data_reuniao", label: "DATA DA REUNIÃO", width: "150px", type: "date" },
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
      options: ["alan", "francisco", "giselle", "leonardo", "guilherme", "marcelo", "Matriz"],
    },
    { key: "observacoes_closer", label: "OBSERVAÇÕES CLOSER", width: "200px", type: "text" },
    {
      key: "temperatura",
      label: "TEMPERATURA",
      width: "120px",
      type: "select",
      options: ["Frio", "Morno", "Quente"],
    },
    { key: "fee_mrr", label: "FEE MRR", width: "100px", type: "number" },
    { key: "escopo_fechado", label: "FEE ONE-TIME", width: "150px", type: "number" },
    {
      key: "produto",
      label: "PRODUTO",
      width: "150px",
      type: "select",
      options: [
        "E.C",
        "E.E",
        "Assessoria",
        "E.E + E.C",
        "Assessoria + E.C",
        "Assessoria + E.E",
        "MIV",
        "Site",
        "Social Media",
      ],
    },
    { key: "data_assinatura", label: "DATA DE ASSINATURA", width: "150px", type: "date" },
    {
      key: "motivo_perda_pv",
      label: "MOTIVO DE PERDA",
      width: "150px",
      type: "select",
      options: [
        "Parou de responder SDR",
        "Fora do ICP",
        "Sem verba",
        "Sem prioridade no momento",
        "Preferiu concorrente",
        "Parou de responder Closer",
        "Sem estrutura interna",
        "Preferiu internalizar",
      ],
    },
  ]

  useEffect(() => {
    const savedColumns = localStorage.getItem("leadsSpreadsheetColumns")
    if (savedColumns) {
      setVisibleColumns(JSON.parse(savedColumns))
    } else {
      const defaultVisible = columns.reduce(
        (acc, col) => {
          acc[col.key] = col.essential || false
          return acc
        },
        {} as Record<string, boolean>,
      )
      setVisibleColumns(defaultVisible)
    }

    const savedPresets = localStorage.getItem("leadsSpreadsheetPresets")
    if (savedPresets) {
      setPresetColumns(JSON.parse(savedPresets))
    }
  }, [])

  useLayoutEffect(() => {
    console.log("[v0] useLayoutEffect executado - leads.length:", leads.length)

    // Restaurar posição de scroll simples
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      scrollContainerRef.current.scrollLeft = scrollPositionRef.current
      console.log("[v0] Posição de scroll restaurada:", scrollPositionRef.current)
    }
  }, [leads.length])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      scrollPositionRef.current = container.scrollLeft
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const updateVisibleColumns = (newVisibleColumns: Record<string, boolean>) => {
    setVisibleColumns(newVisibleColumns)
    localStorage.setItem("leadsSpreadsheetColumns", JSON.stringify(newVisibleColumns))
  }

  const savePresetConfiguration = (presetKey: string, columns: string[]) => {
    const newPresetColumns = {
      ...presetColumns,
      [presetKey]: columns,
    }
    setPresetColumns(newPresetColumns)
    localStorage.setItem("leadsSpreadsheetPresets", JSON.stringify(newPresetColumns))
  }

  const handleCellEdit = async (leadId: string, field: string, value: any) => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollLeft
      console.log("[v0] Posição salva antes da edição:", scrollPositionRef.current)
    }

    let updates: Partial<Lead> = { [field]: value }

    if (field === "closer" || field === "sdr" || field === "arrematador") {
      updates[field] = normalizePersonName(value)
      console.log(`[v0] Nome normalizado: "${value}" → "${updates[field]}"`)
    }

    // Regra: Se CS = SIM → STATUS = "QUALIFICANDO"
    if (field === "conseguiu_contato" && value === true) {
      updates.status = "QUALIFICANDO"
      console.log("[v0] CS marcado como ✅ - STATUS alterado para QUALIFICANDO:", leadId)
    }
    // Regra: Se RM = SIM → STATUS = "REUNIÃO AGENDADA"
    else if (field === "reuniao_agendada" && value === true) {
      updates.status = "REUNIÃO AGENDADA"
      console.log("[v0] RM marcado como ✅ - STATUS alterado para REUNIÃO AGENDADA:", leadId)
    }
    // Regra: Se RR = SIM → STATUS = "REUNIÃO REALIZADA"
    else if (field === "reuniao_realizada" && value === true) {
      updates.status = "REUNIÃO REALIZADA"
      console.log("[v0] RR marcado como ✅ - STATUS alterado para REUNIÃO REALIZADA:", leadId)
    }
    // Regra: Se RR = NÃO → STATUS = "NO-SHOW"
    else if (field === "reuniao_realizada" && value === false) {
      updates.status = "NO-SHOW"
      console.log("[v0] RR marcado como ❌ - STATUS alterado para NO-SHOW:", leadId)
    }
    // Regra: Se DATA DE ASSINATURA for preenchida → STATUS = "GANHO"
    else if (field === "data_assinatura" && value && value.trim() !== "") {
      updates = {
        ...updates,
        data_reuniao: value,
        venda_via_jasson_co: true,
        status: "GANHO",
      }
      console.log("[v0] DATA DE ASSINATURA preenchida - STATUS alterado para GANHO:", {
        leadId,
        data_assinatura: value,
      })
    } else if (field === "motivo_perda" && value && value.trim() !== "") {
      updates.status = "PERDIDO"
      console.log("[v0] MOTIVO DE PERDA preenchido - STATUS alterado para PERDIDO:", {
        leadId,
        motivo_perda: value,
      })
    }

    try {
      onUpdateLead(leadId, updates)
      console.log("[v0] Lead atualizado com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao salvar lead:", error)
    }
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
        if (!value) return ""
        try {
          if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            // Para datas puras (YYYY-MM-DD), criar data no timezone local para evitar subtração de dia
            const [year, month, day] = value.split("-").map(Number)
            return new Date(year, month - 1, day).toLocaleDateString("pt-BR")
          }
          return new Date(value).toLocaleDateString("pt-BR")
        } catch {
          return value
        }
      case "time":
        if (typeof value === "string" && value.includes("T")) {
          return value.split("T")[1]?.slice(0, 5) || ""
        }
        return value || ""
      case "number":
        return String(value || "")
      case "boolean":
        return value ? "✅" : "❌"
      case "tristate":
        return value === true ? "true" : value === false ? "false" : ""
      case "text":
        return value || ""
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
              <SelectTrigger
                className="h-7 text-xs border-blue-500 text-center"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}
              >
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
        case "tristate":
          return (
            <Select
              value={value ? "true" : value === false ? "false" : "none"}
              onValueChange={(newValue) => {
                const finalValue = newValue === "true" ? true : newValue === "false" ? false : null
                handleCellEdit(lead.id, column.key, finalValue)
                setEditingCell(null)
              }}
              onOpenChange={(open) => !open && setEditingCell(null)}
            >
              <SelectTrigger
                className="h-7 text-xs border-blue-500 text-center"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Em branco</SelectItem>
                <SelectItem value="true">✅</SelectItem>
                {column.key === "reuniao_realizada" && <SelectItem value="false">❌</SelectItem>}
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
              className="h-7 text-xs border-blue-500 text-center"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}
              autoFocus
            />
          )
      }
    }

    const displayValue = (() => {
      switch (column.type) {
        case "boolean":
        case "tristate":
          if (column.key === "reuniao_realizada") {
            return value === true ? "✅" : value === false ? "❌" : ""
          }
          return value === true ? "✅" : ""
        case "date":
        case "datetime-local":
          if (!value) return ""
          try {
            if (column.type === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
              // Para datas puras (YYYY-MM-DD), criar data no timezone local para evitar subtração de dia
              const [year, month, day] = value.split("-").map(Number)
              return new Date(year, month - 1, day).toLocaleDateString("pt-BR")
            }
            return new Date(value).toLocaleDateString("pt-BR")
          } catch {
            return value
          }
        case "time":
          return value || ""
        case "number":
          if (!value) return ""
          if (column.key === "fee_mrr" || column.key === "escopo_fechado") {
            const numValue = Number(value)
            return isNaN(numValue) ? "" : numValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          }
          return Number(value).toLocaleString("pt-BR")
        case "email":
          return String(value || "")
        case "text":
          if (column.key === "link_bant" && value && typeof value === "string") {
            const isValidUrl = value.startsWith("http://") || value.startsWith("https://")
            if (isValidUrl) {
              return (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {value.length > 30 ? `${value.substring(0, 30)}...` : value}
                </a>
              )
            }
          }
          return value || ""
        default:
          return String(value || "")
      }
    })()

    const isFirstColumn = column.key === "nome_empresa"

    return (
      <div
        className={`h-8 px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 min-h-[32px]`}
        onClick={() => setEditingCell(cellKey)}
        title={`Clique para editar • Valor: ${displayValue}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isFirstColumn ? "flex-start" : "center",
          height: "32px",
        }}
      >
        {column.key === "status" ||
        column.key === "tem_comentario_lbf" ||
        column.key === "conseguiu_contato" ||
        column.key === "reuniao_agendada" ||
        column.key === "reuniao_realizada" ? (
          <Badge
            className="text-xs"
            variant="outline"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            {displayValue}
          </Badge>
        ) : (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isFirstColumn ? "flex-start" : "center",
              width: "100%",
              textAlign: isFirstColumn ? "left" : "center",
              height: "100%",
            }}
          >
            {displayValue}
          </span>
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
    setIsManuallyEdited(true)
  }

  const getUniqueValues = (columnKey: string): string[] => {
    const values = leads.map((lead) => {
      const value = getCellValue(lead, columnKey)
      const column = columns.find((col) => col.key === columnKey)

      if (value === null || value === undefined) {
        return ""
      } else if (column?.type === "boolean" || column?.type === "tristate") {
        if (columnKey === "reuniao_realizada") {
          return value === true ? "✅" : value === false ? "❌" : ""
        }
        return value ? "✅" : ""
      } else if (column?.type === "number" && (columnKey === "fee_mrr" || columnKey === "escopo_fechado")) {
        const numValue = Number(value)
        return isNaN(numValue) ? "" : numValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      } else if (column?.type === "date" || column?.type === "datetime-local") {
        if (!value) {
          return ""
        } else {
          try {
            if (column.type === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
              // Para datas puras (YYYY-MM-DD), criar data no timezone local para evitar subtração de dia
              const [year, month, day] = value.split("-").map(Number)
              return new Date(year, month - 1, day).toLocaleDateString("pt-BR")
            }
            return new Date(value).toLocaleDateString("pt-BR")
          } catch {
            return String(value)
          }
        }
      } else {
        return String(value)
      }
    })

    return [...new Set(values)].sort()
  }

  const updateColumnFilter = (columnKey: string, selectedValues: string[]) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: selectedValues,
    }))
  }

  const clearColumnFilter = (columnKey: string) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[columnKey]
      return newFilters
    })
  }

  const ColumnFilter = ({ column }: { column: any }) => {
    const uniqueValues = getUniqueValues(column.key)
    const activeFilters = columnFilters[column.key] || []
    const hasActiveFilter = activeFilters.length > 0
    const isOpen = openFilterDropdown === column.key

    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 hover:bg-red-500 ${hasActiveFilter ? "bg-red-500 text-white" : "text-white"}`}
          onClick={(e) => {
            e.stopPropagation()
            setOpenFilterDropdown(isOpen ? null : column.key)
          }}
        >
          <Filter className="h-3 w-3" />
        </Button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenFilterDropdown(null)} />
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-700">FILTRAR {column.label}</span>
                  {hasActiveFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearColumnFilter(column.key)}
                      className="h-6 px-2 text-xs"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {uniqueValues.map((value, index) => {
                    const isSelected = activeFilters.includes(value)
                    return (
                      <div key={index} className="flex items-center space-x-2 py-0 px-1 hover:bg-gray-100 p-1 rounded">
                        <Checkbox
                          id={`${column.key}-${index}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateColumnFilter(column.key, [...activeFilters, value])
                            } else {
                              updateColumnFilter(
                                column.key,
                                activeFilters.filter((v) => v !== value),
                              )
                            }
                          }}
                        />
                        <label
                          htmlFor={`${column.key}-${index}`}
                          className="text-xs cursor-pointer flex-1 truncate text-black bg-white"
                          title={value}
                        >
                          {value || "(Vazio)"}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="p-2 border-t bg-gray-50">
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateColumnFilter(column.key, uniqueValues)}
                    className="flex-1 h-7 text-xs bg-white hover:bg-gray-100 border-gray-300"
                    style={{ color: "#000000" }}
                  >
                    Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateColumnFilter(column.key, [])}
                    className="flex-1 h-7 text-xs bg-white hover:bg-gray-100 border-gray-300"
                    style={{ color: "#000000" }}
                  >
                    Nenhum
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const visibleColumnsArray = columns.filter((col) => visibleColumns[col.key])
  const filteredLeads = leads
    .filter((lead) => {
      // Column filters
      const passesColumnFilters = Object.entries(columnFilters).every(([columnKey, selectedValues]) => {
        if (selectedValues.length === 0) return true

        const value = getCellValue(lead, columnKey)
        const column = columns.find((col) => col.key === columnKey)

        let displayValue = ""
        if (value === null || value === undefined) {
          displayValue = ""
        } else if (column?.type === "boolean" || column?.type === "tristate") {
          if (columnKey === "reuniao_realizada") {
            displayValue = value === true ? "✅" : value === false ? "❌" : ""
          } else {
            displayValue = value ? "✅" : ""
          }
        } else if (column?.type === "number" && (columnKey === "fee_mrr" || columnKey === "escopo_fechado")) {
          const numValue = Number(value)
          displayValue = isNaN(numValue) ? "" : numValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        } else if (column?.type === "date" || column?.type === "datetime-local") {
          if (!value) {
            displayValue = ""
          } else {
            try {
              if (column.type === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                // Para datas puras (YYYY-MM-DD), criar data no timezone local para evitar subtração de dia
                const [year, month, day] = value.split("-").map(Number)
                return new Date(year, month - 1, day).toLocaleDateString("pt-BR")
              }
              return new Date(value).toLocaleDateString("pt-BR")
            } catch {
              return String(value)
            }
          }
        } else {
          displayValue = String(value)
        }

        return selectedValues.includes(displayValue)
      })

      // Date filter
      const passesDateFilter = (() => {
        if (!dateFilterColumn || !dateFilterStart || !dateFilterEnd) return true

        const leadDateValue = (lead as any)[dateFilterColumn]
        if (!leadDateValue) return false

        const leadDate = new Date(leadDateValue)

        // Criar datas no fuso horário local em vez de UTC
        const startDate = new Date(dateFilterStart + "T00:00:00")
        const endDate = new Date(dateFilterEnd + "T23:59:59.999")

        return leadDate >= startDate && leadDate <= endDate
      })()

      return passesColumnFilters && passesDateFilter
    })
    .sort((a, b) => {
      const dateA = a.data_hora_compra ? new Date(a.data_hora_compra).getTime() : 0
      const dateB = b.data_hora_compra ? new Date(b.data_hora_compra).getTime() : 0
      return dateB - dateA // Ordem decrescente (mais recente primeiro)
    })

  const applyDateFilter = () => {
    if (!dateFilterColumn) {
      alert("Por favor, selecione uma coluna para filtrar.")
      return
    }
    if (!dateFilterStart || !dateFilterEnd) {
      alert("Por favor, selecione as datas de início e fim.")
      return
    }
  }

  const clearDateFilter = () => {
    setDateFilterColumn("")
    setDateFilterStart("")
    setDateFilterEnd("")
  }

  const clearAllColumnFilters = () => {
    setColumnFilters({})
  }

  const presets = {
    all: {
      name: "Todas Colunas",
      emoji: "📋",
      columns: presetColumns.all || columns.map((col) => col.key),
    },
    complete: {
      name: "Funil Completo",
      emoji: "🎯",
      columns: presetColumns.complete || [
        "nome_empresa",
        "status",
        "observacoes_sdr",
        "tem_comentario_lbf",
        "link_bant",
        "data_ultimo_contato",
        "data_hora_compra",
        "sdr",
        "conseguiu_contato",
        "reuniao_agendada",
        "reuniao_realizada",
        "data_marcacao",
        "data_reuniao",
        "faturamento",
        "produto",
        "closer",
        "observacoes_closer",
        "temperatura",
        "fee_mrr",
        "escopo_fechado",
        "data_assinatura",
        "motivo_perda_pv",
      ],
    },
    sdr: {
      name: "Funil SDR",
      emoji: "📞",
      columns: presetColumns.sdr || [
        "nome_empresa",
        "status",
        "observacoes_sdr",
        "tem_comentario_lbf",
        "link_bant",
        "data_ultimo_contato",
        "data_hora_compra",
        "sdr",
        "conseguiu_contato",
        "reuniao_agendada",
        "reuniao_realizada",
        "data_marcacao",
        "data_reuniao",
        "faturamento",
        "cargo_contato",
        "produto",
      ],
    },
    closer: {
      name: "Funil Closer",
      emoji: "💰",
      columns: presetColumns.closer || [
        "nome_empresa",
        "status",
        "observacoes_sdr",
        "tem_comentario_lbf",
        "link_bant",
        "reuniao_realizada",
        "data_reuniao",
        "faturamento",
        "cargo_contato",
        "produto",
        "closer",
        "observacoes_closer",
        "temperatura",
        "fee_mrr",
        "escopo_fechado",
        "data_assinatura",
        "motivo_perda_pv",
      ],
    },
  }

  const applyPreset = (presetKey: keyof typeof presets) => {
    const preset = presets[presetKey]
    const newVisible = columns.reduce(
      (acc, col) => {
        acc[col.key] = preset.columns.includes(col.key)
        return acc
      },
      {} as Record<string, boolean>,
    )

    updateVisibleColumns(newVisible)
    setIsManuallyEdited(false)
  }

  const openPresetConfig = (presetKey: string) => {
    setEditingPreset(presetKey)
    const currentPreset = presets[presetKey as keyof typeof presets]
    setTempPresetColumns([...currentPreset.columns])
  }

  const savePresetFromModal = (presetKey: string, selectedColumns: string[]) => {
    savePresetConfiguration(presetKey, selectedColumns)
    setEditingPreset(null)
    setTempPresetColumns([])
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-gray-900">📊 Leads Inbound</h2>
            <span className="text-sm text-gray-500">
              {visibleColumnsArray.length}/{columns.length} colunas
            </span>
            {Object.keys(columnFilters).length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Filter className="w-3 h-3 mr-1" />
                {Object.keys(columnFilters).length} filtro(s) ativo(s)
              </Badge>
            )}
            {dateFilterColumn && dateFilterStart && dateFilterEnd && (
              <Badge variant="secondary" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Filtro de data ativo
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {Object.keys(columnFilters).length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setColumnFilters({})} className="h-8 bg-transparent">
                <Filter className="w-3 h-3 mr-1" />
                Limpar Filtros
              </Button>
            )}
            {Object.keys(columnFilters).some((key) => columnFilters[key].length > 0) && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-gray-600">Filtros ativos</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllColumnFilters}
                  className="h-7 text-xs bg-transparent"
                >
                  Limpar todos os filtros
                </Button>
              </div>
            )}
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
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">🎯 Presets de Visualização</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(presets).map(([key, preset]) => (
                        <div key={key} className="flex items-center space-x-1">
                          <Button
                            onClick={() => applyPreset(key as keyof typeof presets)}
                            variant="outline"
                            size="sm"
                            className="justify-start flex-1"
                          >
                            {preset.emoji} {preset.name}
                          </Button>
                          <Button
                            onClick={() => openPresetConfig(key)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            title={`Configurar ${preset.name}`}
                          >
                            ⚙️
                          </Button>
                        </div>
                      ))}
                    </div>
                    {isManuallyEdited && (
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        ⚠️ Configuração personalizada ativa. Use um preset para resetar.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 max-h-96 overflow-y-auto">
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        className="flex items-center space-x-2 py-0 px-1 hover:bg-gray-50 rounded leading-none"
                      >
                        <Checkbox
                          id={col.key}
                          checked={visibleColumns[col.key] || false}
                          onCheckedChange={() => toggleColumn(col.key)}
                        />
                        <label htmlFor={col.key} className="text-sm cursor-pointer flex-1 leading-none">
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(presets).map(([key, preset]) => (
                        <Button
                          key={key}
                          onClick={() => applyPreset(key as keyof typeof presets)}
                          variant="outline"
                          size="sm"
                          className="justify-center text-xs"
                        >
                          {preset.emoji} {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {editingPreset && (
              <Dialog open={!!editingPreset} onOpenChange={() => setEditingPreset(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Configurar {presets[editingPreset as keyof typeof presets]?.emoji}{" "}
                      {presets[editingPreset as keyof typeof presets]?.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Selecione as colunas que devem aparecer neste preset:</p>

                    <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 max-h-96 overflow-y-auto">
                      {columns.map((col) => (
                        <div
                          key={col.key}
                          className="flex items-center space-x-2 py-0 px-1 hover:bg-gray-50 rounded leading-none"
                        >
                          <Checkbox
                            id={`preset-${col.key}`}
                            checked={tempPresetColumns.includes(col.key)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTempPresetColumns([...tempPresetColumns, col.key])
                              } else {
                                setTempPresetColumns(tempPresetColumns.filter((k) => k !== col.key))
                              }
                            }}
                          />
                          <label htmlFor={`preset-${col.key}`} className="text-sm cursor-pointer flex-1 leading-none">
                            {col.label}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setEditingPreset(null)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => savePresetFromModal(editingPreset, tempPresetColumns)}>
                        Salvar Configuração
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="outline" onClick={onRefresh} size="sm" className="h-8 bg-transparent">
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtrar por período:</span>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Filtrar por:</label>
            <Select value={dateFilterColumn} onValueChange={setDateFilterColumn}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione uma coluna" />
              </SelectTrigger>
              <SelectContent>
                {dateFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">De:</label>
            <Input
              type="date"
              value={dateFilterStart}
              onChange={(e) => setDateFilterStart(e.target.value)}
              className="w-36"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Até:</label>
            <Input
              type="date"
              value={dateFilterEnd}
              onChange={(e) => setDateFilterEnd(e.target.value)}
              className="w-36"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={applyDateFilter} className="h-8">
              Aplicar Filtro
            </Button>
            <Button variant="outline" onClick={clearDateFilter} className="h-8 bg-transparent">
              Limpar Filtro
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="overflow-x-scroll"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#9CA3AF #E5E7EB",
            minHeight: "400px",
            maxHeight: "70vh",
            overflowY: "auto",
            scrollbarGutter: "stable",
          }}
        >
          <div style={{ minWidth: "100%", width: "max-content" }}>
            <table className="w-full" style={{ minWidth: "max-content" }}>
              <thead>
                <tr className="bg-red-600 text-white">
                  {visibleColumnsArray.map((column, index) => {
                    const isLeadColumn = column.key === "nome_empresa"
                    return (
                      <th
                        key={column.key}
                        className={`px-2 py-2 text-xs font-medium text-left border-r border-red-500 ${
                          isLeadColumn ? "sticky left-0 z-20 bg-red-600 shadow-lg" : ""
                        }`}
                        style={{
                          width: column.width,
                          minWidth: column.width,
                          maxWidth: column.width,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{column.label}</span>
                          <ColumnFilter column={column} />
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, leadIndex) => (
                  <tr key={lead.id} className={leadIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {visibleColumnsArray.map((column, columnIndex) => {
                      const isLeadColumn = column.key === "nome_empresa"
                      const rowBgColor = leadIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                      return (
                        <td
                          key={`${lead.id}-${column.key}`}
                          className={`border-r border-gray-200 ${
                            isLeadColumn ? `sticky left-0 z-10 ${rowBgColor} shadow-lg` : ""
                          }`}
                          style={{
                            width: column.width,
                            minWidth: column.width,
                            maxWidth: column.width,
                          }}
                        >
                          {renderCell(lead, column)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="p-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>
              📋 {filteredLeads.length} de {leads.length} leads
            </span>
            <span>👁️ {visibleColumnsArray.length} colunas visíveis</span>
            {Object.keys(columnFilters).length > 0 && <span className="text-blue-600">🔍 Filtros ativos</span>}
          </div>
          <span className="text-blue-600 font-medium">💾 Scroll inteligente ativo</span>
        </div>
      </div>
    </div>
  )
}
