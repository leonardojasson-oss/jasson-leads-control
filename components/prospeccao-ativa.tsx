"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Filter, Settings, RefreshCw, Calendar, Search } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { Lead } from "@/lib/supabase-operations"
import { normalizePersonName } from "@/lib/normalizers"
import { maskPhone, unmaskPhone, isValidPhone, formatPhoneDisplay } from "@/lib/phone-utils"

interface ProspeccaoAtivaProps {
  leads: Lead[]
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>
  onRefresh: () => void
  onAddLead?: (leadData: any) => Promise<void>
}

export function ProspeccaoAtiva({ leads, onUpdateLead, onRefresh, onAddLead }: ProspeccaoAtivaProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingCell, setEditingCell] = useState<{ leadId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({})
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [activePreset, setActivePreset] = useState("todas")
  const [configuringPreset, setConfiguringPreset] = useState<string | null>(null)
  const [presetConfigurations, setPresetConfigurations] = useState<Record<string, string[]>>({})
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [dateFilterColumn, setDateFilterColumn] = useState<string>("")
  const [dateFilterStart, setDateFilterStart] = useState<string>("")
  const [dateFilterEnd, setDateFilterEnd] = useState<string>("")

  const [closerOptions, setCloserOptions] = useState<Array<{ key: string; label: string }>>([])
  const [sdrOptions, setSdrOptions] = useState<Array<{ key: string; label: string }>>([])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { createBrowserClient } = await import("@supabase/ssr")
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        // Fetch closer options
        const { data: closerData } = await supabase.from("v_closer_options").select("key, label").order("label")

        if (closerData) {
          setCloserOptions(closerData)
        }

        // Fetch SDR options
        const { data: sdrData } = await supabase.from("v_sdr_options").select("key, label").order("label")

        if (sdrData) {
          setSdrOptions(sdrData)
        }
      } catch (error) {
        console.error("[v0] Erro ao buscar opções de filtro:", error)
      }
    }

    fetchFilterOptions()
  }, [])

  const columns = [
    { key: "nome_empresa", label: "LEAD", width: "200px", type: "text", essential: true },
    { key: "telefone", label: "TELEFONE", width: "200px", type: "phone", essential: true },
    {
      key: "status",
      label: "STATUS",
      width: "150px",
      type: "select",
      essential: true,
      options: [
        "BACKLOG",
        "TENTANDO CONTATO",
        "FOLLOW INFINITO",
        "REUNIÃO AGENDADA",
        "REUNIÃO REALIZADA",
        "PROPOSTA ENVIADA",
        "CONTRATO ASSINADO",
        "DROPADO",
        "PERDIDO",
        "DESQUALIFICADO",
      ],
    },
    { key: "observacoes_sdr", label: "OBSERVAÇÕES SDR", width: "200px", type: "text", essential: true },
    { key: "link_bant", label: "LINK BANT", width: "180px", type: "text", essential: true },
    { key: "data_ultimo_contato", label: "DATA ÚLTIMO CONTATO", width: "150px", type: "date", essential: true },
    {
      key: "sdr",
      label: "SDR",
      width: "100px",
      type: "select",
      essential: true,
      options: ["antonio", "gabrielli", "vanessa", "guilherme"],
    },
    {
      key: "tipo_lead",
      label: "ORIGEM",
      width: "120px",
      type: "select",
      essential: true,
      options: ["Outbound", "Indicação", "Recomendação", "Evento", "Networking"],
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
    {
      key: "closer",
      label: "CLOSER",
      width: "100px",
      type: "select",
      options: ["Antonio", "Alan", "Giselle", "Guilherme", "Leonardo", "Marcelo", "Matriz"],
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
      options: ["E.C", "E.E", "Assessoria", "E.E + E.C", "Assessoria + E.E", "MIV", "Site", "Social Media"],
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
        "Preço alto",
        "Não tem urgência",
        "Não é decisor",
        "Concorrente",
        "Interno",
        "Não respondeu closer",
        "Não compareceu reunião",
        "Outros",
      ],
    },
    // Adicionando campos de data para filtro
    { key: "data_hora_compra", label: "DATA DA COMPRA", width: "150px", type: "date" },
  ]

  const defaultPresets = {
    todas: {
      name: "Todas Colunas",
      icon: "📋",
      columns: columns.map((col) => col.key),
    },
    sdr: {
      name: "Funil SDR",
      icon: "📞",
      columns: [
        "nome_empresa",
        "status",
        "observacoes_sdr",
        "data_ultimo_contato",
        "sdr",
        "tipo_lead",
        "conseguiu_contato",
        "data_marcacao",
        "nicho",
        "cidade",
        "regiao",
        "cargo_contato",
        "email",
      ],
    },
    completo: {
      name: "Funil Completo",
      icon: "🎯",
      columns: [
        "nome_empresa",
        "status",
        "observacoes_sdr",
        "link_bant",
        "data_ultimo_contato",
        "sdr",
        "tipo_lead",
        "conseguiu_contato",
        "reuniao_agendada",
        "reuniao_realizada",
        "data_marcacao",
        "data_reuniao",
        "faturamento",
        "nicho",
        "cidade",
        "regiao",
        "cargo_contato",
        "email",
        "anuncios",
        "closer",
        "observacoes_closer",
        "temperatura",
      ],
    },
    closer: {
      name: "Funil Closer",
      icon: "💰",
      columns: [
        "nome_empresa",
        "status",
        "closer",
        "observacoes_closer",
        "temperatura",
        "fee_mrr",
        "escopo_fechado",
        "produto",
        "data_assinatura",
        "motivo_perda_pv",
        "faturamento",
        "nicho",
        "cidade",
        "regiao",
      ],
    },
  }

  useEffect(() => {
    const savedConfigurations = localStorage.getItem("prospeccao-ativa-presets")
    if (savedConfigurations) {
      setPresetConfigurations(JSON.parse(savedConfigurations))
    } else {
      const defaultConfigs: Record<string, string[]> = {}
      Object.entries(defaultPresets).forEach(([key, preset]) => {
        // Para o preset "todas", sempre usar todas as colunas disponíveis
        if (key === "todas") {
          defaultConfigs[key] = columns.map((col) => col.key)
        } else {
          defaultConfigs[key] = preset.columns
        }
      })
      setPresetConfigurations(defaultConfigs)
    }

    setTimeout(() => {
      applyPreset("todas")
    }, 0)
  }, [])

  useEffect(() => {
    if (Object.keys(presetConfigurations).length > 0) {
      localStorage.setItem("prospeccao-ativa-presets", JSON.stringify(presetConfigurations))
    }
  }, [presetConfigurations])

  const applyPreset = (presetKey: string) => {
    const presetColumns =
      presetConfigurations[presetKey] || defaultPresets[presetKey as keyof typeof defaultPresets]?.columns || []
    const newVisibility: Record<string, boolean> = {}
    columns.forEach((col) => {
      newVisibility[col.key] = presetColumns.includes(col.key)
    })
    setVisibleColumns(newVisibility)
    setActivePreset(presetKey)
  }

  const savePresetConfiguration = (presetKey: string, selectedColumns: string[]) => {
    setPresetConfigurations((prev) => ({
      ...prev,
      [presetKey]: selectedColumns,
    }))
    setConfiguringPreset(null)
  }

  const openPresetConfiguration = (presetKey: string) => {
    setConfiguringPreset(presetKey)
  }

  useEffect(() => {
    const initialVisibility: Record<string, boolean> = {}
    columns.forEach((col) => {
      initialVisibility[col.key] = col.essential || false
    })
    setVisibleColumns(initialVisibility)
  }, [])

  const getUniqueValues = (columnKey: string) => {
    if (columnKey === "closer" && closerOptions.length > 0) {
      return closerOptions.map((opt) => opt.label)
    }

    if (columnKey === "sdr" && sdrOptions.length > 0) {
      return sdrOptions.map((opt) => opt.label)
    }

    const column = columns.find((col) => col.key === columnKey)
    if (column?.type === "select" && column.options) {
      return column.options.sort()
    }

    const values = leads.map((lead) => {
      const value = lead[columnKey as keyof Lead]
      if (value === null || value === undefined) return ""
      if (typeof value === "boolean") return value ? "Sim" : "Não"
      // Normalizando valores de telefone para obter valores únicos
      if (columnKey === "telefone" && value) {
        return unmaskPhone(String(value))
      }
      return String(value)
    })
    return [...new Set(values)].sort()
  }

  const updateColumnFilter = (columnKey: string, values: string[]) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: values,
    }))
  }

  const clearColumnFilter = (columnKey: string) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[columnKey]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setColumnFilters({})
    clearDateFilter() // Limpa também o filtro de data
  }

  // Opções de filtro de data (mesmo do Inbound)
  const dateFilterOptions = [
    { value: "data_reuniao", label: "DATA DA REUNIÃO" },
    { value: "data_ultimo_contato", label: "DATA ÚLTIMO CONTATO" },
    { value: "data_hora_compra", label: "DATA DA COMPRA" },
    { value: "data_marcacao", label: "DATA DA MARCAÇÃO" },
    { value: "data_assinatura", label: "DATA DE ASSINATURA" },
  ]

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
  const filteredLeads = leads.filter((lead) => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const searchDigits = unmaskPhone(searchTerm)
      const telefone = String(lead.telefone || "")

      const matchesSearch =
        Object.values(lead).some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(searchLower),
        ) || telefone.includes(searchDigits)

      if (!matchesSearch) return false
    }

    for (const [columnKey, filterValues] of Object.entries(columnFilters)) {
      if (filterValues.length === 0) continue

      if (columnKey === "closer" || columnKey === "sdr") {
        const leadKeyValue = (lead as any)[`${columnKey}_key`]
        if (!leadKeyValue) return false

        // Map selected labels to keys
        let selectedKeys: string[] = []
        if (columnKey === "closer") {
          selectedKeys = filterValues
            .map((label) => {
              const option = closerOptions.find((opt) => opt.label === label)
              return option?.key || ""
            })
            .filter(Boolean)
        } else if (columnKey === "sdr") {
          selectedKeys = filterValues
            .map((label) => {
              const option = sdrOptions.find((opt) => opt.label === label)
              return option?.key || ""
            })
            .filter(Boolean)
        }

        if (!selectedKeys.includes(leadKeyValue)) {
          return false
        }
        continue
      }

      const leadValue = lead[columnKey as keyof Lead]
      let displayValue = ""

      if (leadValue === null || leadValue === undefined) {
        displayValue = ""
      } else if (typeof leadValue === "boolean") {
        displayValue = leadValue ? "Sim" : "Não"
      } else if (columnKey === "telefone" && leadValue) {
        // Normalizando para comparação no filtro
        displayValue = unmaskPhone(String(leadValue))
      } else {
        displayValue = String(leadValue)
      }

      if (!filterValues.includes(displayValue)) {
        return false
      }
    }

    if (dateFilterColumn && dateFilterStart && dateFilterEnd) {
      const leadDateValue = (lead as any)[dateFilterColumn]
      if (!leadDateValue) return false

      const leadDate = new Date(leadDateValue)
      const startDate = new Date(dateFilterStart + "T00:00:00")
      const endDate = new Date(dateFilterEnd + "T23:59:59.999")

      if (!(leadDate >= startDate && leadDate <= endDate)) {
        return false
      }
    }

    return true
  })

  const [isNovoLeadOpen, setIsNovoLeadOpen] = useState(false)
  const [novoLeadData, setNovoLeadData] = useState({
    lead: "",
    nome: "",
    status: "",
    observacoes: "",
    sdr: "",
    origem: "",
    segmento: "",
    cidade: "",
    regiao: "",
    cargo: "",
    email: "",
    telefone: "",
    anuncios: "",
    closer: "",
  })

  const handleCellEdit = (leadId: string, field: string, currentValue: any) => {
    setEditingCell({ leadId, field })
    if (field === "telefone") {
      setEditValue(maskPhone(String(currentValue || "")))
    } else {
      setEditValue(String(currentValue || ""))
    }
  }

  const handleSaveCell = async () => {
    if (!editingCell) return

    const { leadId, field } = editingCell
    let processedValue: any = editValue

    if (field === "telefone") {
      const digits = unmaskPhone(editValue)
      if (digits && !isValidPhone(digits)) {
        alert("Telefone inválido. Deve conter 10 ou 11 dígitos.")
        setEditingCell(null)
        setEditValue("")
        return
      }
      processedValue = digits // Salvar apenas dígitos
    }

    // Processar valores booleanos para campos tristate
    if (field === "conseguiu_contato" || field === "reuniao_agendada" || field === "reuniao_realizada") {
      if (editValue === "Sim") processedValue = true
      else if (editValue === "Não") processedValue = false
      else processedValue = null
    }

    const updates = { [field]: processedValue }

    try {
      await onUpdateLead(leadId, updates)
      setEditingCell(null)
      setEditValue("")
    } catch (error) {
      console.error("Erro ao salvar:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  // Funções de filtro de data (mesmo do Inbound)
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

  const renderCell = (lead: Lead, column: any) => {
    const value = lead[column.key as keyof Lead]
    const isEditing = editingCell?.leadId === lead.id && editingCell?.field === column.key
    const isObservacoesSdr = column.key === "observacoes_sdr"

    if (isEditing) {
      if (column.type === "phone") {
        return (
          <div className="p-1">
            <Input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(maskPhone(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const digits = unmaskPhone(editValue)
                  if (digits && !isValidPhone(digits)) {
                    alert("Telefone inválido. Deve conter 10 ou 11 dígitos.")
                    return
                  }
                  handleSaveCell()
                }
                if (e.key === "Escape") handleCancelEdit()
              }}
              onBlur={handleSaveCell}
              className="h-7 text-xs border-gray-300"
              placeholder="(11) 9XXXX-XXXX"
              autoFocus
            />
          </div>
        )
      } else if (column.type === "select") {
        return (
          <div className="p-1">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveCell}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveCell()
                if (e.key === "Escape") handleCancelEdit()
              }}
              className="w-full h-7 text-xs border border-gray-300 rounded px-1 bg-white text-black"
              autoFocus
            >
              <option value="">Selecione...</option>
              {column.options?.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )
      } else if (column.type === "tristate") {
        return (
          <div className="p-1">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveCell}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveCell()
                if (e.key === "Escape") handleCancelEdit()
              }}
              className="w-full h-7 text-xs border border-gray-300 rounded px-1 bg-white text-black"
              autoFocus
            >
              <option value="">-</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>
          </div>
        )
      } else {
        return (
          <div className="p-1">
            <Input
              type={column.type === "date" ? "date" : column.type === "email" ? "email" : "text"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveCell()
                if (e.key === "Escape") handleCancelEdit()
              }}
              onBlur={handleSaveCell}
              className="h-7 text-xs border-gray-300"
              autoFocus
            />
          </div>
        )
      }
    }

    // Renderização normal da célula
    let displayValue = ""
    if (value === null || value === undefined) {
      displayValue = "-"
    } else if (typeof value === "boolean") {
      displayValue = value ? "Sim" : "Não"
    } else if (column.type === "date" && value) {
      displayValue = new Date(value as string).toLocaleDateString("pt-BR")
    } else if (column.type === "phone") {
      if (!value || value === "") {
        displayValue = "—"
      } else {
        const formattedPhone = formatPhoneDisplay(value as string)
        const digits = unmaskPhone(value as string)
        return (
          <div
            className="p-2 cursor-pointer hover:bg-gray-100 text-xs min-h-[32px] flex items-center"
            onClick={() => handleCellEdit(lead.id, column.key, value)}
          >
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <span title={`Telefone: ${digits}`}>{formattedPhone}</span>
              {digits && (
                <a
                  href={`tel:+55${digits}`}
                  className="text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                  title="Ligar para este número"
                >
                  📞
                </a>
              )}
            </div>
          </div>
        )
      }
    } else {
      displayValue = String(value)
    }

    const cellClasses = isObservacoesSdr
      ? "p-2 cursor-pointer hover:bg-gray-100 text-xs whitespace-normal break-words overflow-visible leading-snug flex items-start"
      : "p-2 cursor-pointer hover:bg-gray-100 text-xs min-h-[32px] flex items-center"

    return (
      <div className={cellClasses} onClick={() => handleCellEdit(lead.id, column.key, value)}>
        {displayValue}
      </div>
    )
  }

  const handleNovoLead = async () => {
    console.log("[v0] Iniciando handleNovoLead")
    console.log("[v0] novoLeadData:", novoLeadData)

    if (!onAddLead) {
      console.log("[v0] onAddLead não está disponível")
      return
    }

    const camposObrigatorios = [
      { campo: "lead", nome: "LEAD" },
      { campo: "nome", nome: "NOME" },
      { campo: "sdr", nome: "SDR" },
      { campo: "origem", nome: "ORIGEM" },
      { campo: "segmento", nome: "SEGMENTO" },
      { campo: "cidade", nome: "CIDADE" },
      { campo: "regiao", nome: "REGIÃO" },
      { campo: "cargo", nome: "CARGO" },
      { campo: "email", nome: "E-MAIL" },
      { campo: "telefone", nome: "TELEFONE" },
      { campo: "anuncios", nome: "ANÚNCIOS" },
    ]

    const camposVazios = camposObrigatorios.filter((item) => !novoLeadData[item.campo as keyof typeof novoLeadData])
    console.log("[v0] Campos vazios:", camposVazios)

    if (camposVazios.length > 0) {
      console.log("[v0] Validação falhou - campos obrigatórios vazios")
      alert(`Os seguintes campos são obrigatórios: ${camposVazios.map((item) => item.nome).join(", ")}`)
      return
    }

    const telefoneDigits = unmaskPhone(novoLeadData.telefone)
    if (!isValidPhone(telefoneDigits)) {
      alert("Telefone inválido. Deve conter 10 ou 11 dígitos.")
      return
    }

    console.log("[v0] Validação passou, tentando salvar...")

    try {
      await onAddLead({
        nome_empresa: novoLeadData.lead,
        nome_contato: novoLeadData.nome,
        status: "BACKLOG",
        observacoes_sdr: novoLeadData.observacoes,
        sdr: normalizePersonName(novoLeadData.sdr),
        tipo_lead: novoLeadData.origem,
        nicho: novoLeadData.segmento,
        cidade: novoLeadData.cidade,
        regiao: novoLeadData.regiao,
        cargo_contato: novoLeadData.cargo,
        email: novoLeadData.email,
        telefone: telefoneDigits,
        anuncios: novoLeadData.anuncios,
        closer: normalizePersonName(novoLeadData.closer),
        canal: "prospeccao_ativa",
      })

      console.log("[v0] Lead salvo com sucesso")
      setIsNovoLeadOpen(false)
      setNovoLeadData({
        lead: "",
        nome: "",
        status: "",
        observacoes: "",
        sdr: "",
        origem: "",
        segmento: "",
        cidade: "",
        regiao: "",
        cargo: "",
        email: "",
        telefone: "",
        anuncios: "",
        closer: "",
      })
      onRefresh()
    } catch (error) {
      console.error("[v0] Erro ao adicionar lead:", error)
      alert("Erro ao salvar o lead. Verifique o console para mais detalhes.")
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-gray-900">🎯 Prospecção Ativa</h2>
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
              <Button variant="outline" size="sm" onClick={clearAllFilters} className="h-8 bg-transparent">
                <Filter className="w-3 h-3 mr-1" />
                Limpar Filtros
              </Button>
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
                  <DialogTitle>Colunas</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-red-600">🎯</span>
                      <h4 className="font-medium text-gray-900">Presets de Visualização</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(defaultPresets).map(([key, preset]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Button
                            variant={activePreset === key ? "default" : "outline"}
                            size="sm"
                            onClick={() => applyPreset(key)}
                            className={`flex items-center justify-start space-x-2 h-10 flex-1 ${
                              activePreset === key
                                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                            }`}
                          >
                            <span>{preset.icon}</span>
                            <span className="font-medium">{preset.name}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPresetConfiguration(key)}
                            className="h-10 w-10 p-0 hover:bg-gray-100"
                            title={`Configurar ${preset.name}`}
                          >
                            <Settings className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                      {columns.map((column) => (
                        <div key={column.key} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`column-${column.key}`}
                            checked={visibleColumns[column.key] || false}
                            onCheckedChange={(checked) => {
                              setVisibleColumns((prev) => ({
                                ...prev,
                                [column.key]: checked as boolean,
                              }))
                              setActivePreset("custom")
                            }}
                          />
                          <label
                            htmlFor={`column-${column.key}`}
                            className="text-sm cursor-pointer flex-1 text-gray-700 font-medium"
                          >
                            {column.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-center space-x-3">
                      {Object.entries(defaultPresets).map(([key, preset]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset(key)}
                          className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-gray-300"
                        >
                          <span>{preset.icon}</span>
                          <span>{preset.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isNovoLeadOpen} onOpenChange={setIsNovoLeadOpen}>
              <DialogTrigger asChild>
                <Button className="h-8 bg-orange-600 hover:bg-orange-700">+ Novo Lead PA</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Lead - Prospecção Ativa</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lead">LEAD *</Label>
                    <Input
                      id="lead"
                      value={novoLeadData.lead}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, lead: e.target.value })}
                      placeholder="Nome da empresa"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nome">NOME *</Label>
                    <Input
                      id="nome"
                      value={novoLeadData.nome}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, nome: e.target.value })}
                      placeholder="Nome do contato"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="observacoes">OBSERVAÇÕES</Label>
                    <Textarea
                      id="observacoes"
                      value={novoLeadData.observacoes}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, observacoes: e.target.value })}
                      placeholder="Observações sobre o lead"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sdr">SDR *</Label>
                    <select
                      id="sdr"
                      value={novoLeadData.sdr}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, sdr: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    >
                      <option value="">Selecione...</option>
                      {sdrOptions.map((option) => (
                        <option key={option.key} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="origem">ORIGEM *</Label>
                    <Select
                      value={novoLeadData.origem}
                      onValueChange={(value) => setNovoLeadData({ ...novoLeadData, origem: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Outbound">Outbound</SelectItem>
                        <SelectItem value="Indicação">Indicação</SelectItem>
                        <SelectItem value="Recomendação">Recomendação</SelectItem>
                        <SelectItem value="Evento">Evento</SelectItem>
                        <SelectItem value="Networking">Networking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="segmento">SEGMENTO *</Label>
                    <Input
                      id="segmento"
                      value={novoLeadData.segmento}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, segmento: e.target.value })}
                      placeholder="Segmento da empresa"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cidade">CIDADE *</Label>
                    <Input
                      id="cidade"
                      value={novoLeadData.cidade}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, cidade: e.target.value })}
                      placeholder="Cidade"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="regiao"> REGIÃO *</Label>
                    <Input
                      id="regiao"
                      value={novoLeadData.regiao}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, regiao: e.target.value })}
                      placeholder="Região"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargo">CARGO *</Label>
                    <Input
                      id="cargo"
                      value={novoLeadData.cargo}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, cargo: e.target.value })}
                      placeholder="Cargo do contato"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-MAIL *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={novoLeadData.email}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, email: e.target.value })}
                      placeholder="email@empresa.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">TELEFONE *</Label>
                    <Input
                      id="telefone"
                      type="text"
                      value={maskPhone(novoLeadData.telefone)}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, telefone: unmaskPhone(e.target.value) })}
                      placeholder="(11) 9XXXX-XXXX"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="anuncios">ANÚNCIOS *</Label>
                    <Input
                      id="anuncios"
                      value={novoLeadData.anuncios}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, anuncios: e.target.value })}
                      placeholder="Informações sobre anúncios"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="closer">CLOSER</Label>
                    <select
                      id="closer"
                      value={novoLeadData.closer}
                      onChange={(e) => setNovoLeadData({ ...novoLeadData, closer: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="">Selecione...</option>
                      {closerOptions.map((option) => (
                        <option key={option.key} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setIsNovoLeadOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleNovoLead} className="bg-orange-600 hover:bg-orange-700">
                    Salvar Lead
                  </Button>
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

      {/* Barra de busca com ícone (mesmo do Inbound) */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por empresa, contato, produto, nicho, SDR ou Closer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label="Buscar leads"
            />
          </div>
        </div>
      </div>

      {/* Barra de filtro por período (mesmo do Inbound) */}
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

      {configuringPreset && (
        <Dialog open={!!configuringPreset} onOpenChange={() => setConfiguringPreset(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Configurar {defaultPresets[configuringPreset as keyof typeof defaultPresets]?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Selecione as colunas que devem aparecer quando este preset for aplicado:
              </p>
              <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {columns.map((column) => {
                  const currentPresetColumns =
                    presetConfigurations[configuringPreset] ||
                    defaultPresets[configuringPreset as keyof typeof defaultPresets]?.columns ||
                    []

                  return (
                    <div key={column.key} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`preset-${configuringPreset}-${column.key}`}
                        checked={currentPresetColumns.includes(column.key)}
                        onCheckedChange={(checked) => {
                          const currentColumns =
                            presetConfigurations[configuringPreset] ||
                            defaultPresets[configuringPreset as keyof typeof defaultPresets]?.columns ||
                            []

                          let newColumns: string[]
                          if (checked) {
                            newColumns = [...currentColumns, column.key]
                          } else {
                            newColumns = currentColumns.filter((col) => col !== column.key)
                          }

                          setPresetConfigurations((prev) => ({
                            ...prev,
                            [configuringPreset]: newColumns,
                          }))
                        }}
                      />
                      <label
                        htmlFor={`preset-${configuringPreset}-${column.key}`}
                        className="text-sm cursor-pointer flex-1 text-gray-700 font-medium"
                      >
                        {column.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setConfiguringPreset(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const currentColumns =
                    presetConfigurations[configuringPreset] ||
                    defaultPresets[configuringPreset as keyof typeof defaultPresets]?.columns ||
                    []
                  savePresetConfiguration(configuringPreset, currentColumns)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Salvar Configuração
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="overflow-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#9CA3AF #E5E7EB",
            minHeight: "400px",
            maxHeight: "70vh",
            scrollbarGutter: "stable",
          }}
        >
          <div style={{ minWidth: "100%", width: "max-content" }}>
            <table className="w-full" style={{ minWidth: "max-content" }}>
              <thead className="bg-red-600 text-white sticky top-0 z-30">
                <tr>
                  {visibleColumnsArray.map((column) => {
                    const isLeadColumn = column.key === "nome_empresa"
                    return (
                      <th
                        key={column.key}
                        className={`px-2 py-3 text-xs font-bold uppercase border-r border-red-500 text-center relative ${
                          isLeadColumn ? "sticky left-0 z-[35] bg-red-600 shadow-[2px_0_4px_rgba(0,0,0,0.1)]" : ""
                        }`}
                        style={{ minWidth: column.width, width: column.width }}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span className="flex-1">{column.label}</span>
                          <ColumnFilter column={column} />
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead, index) => {
                  const rowBgColor = index % 2 === 0 ? "bg-white" : "bg-gray-25"
                  return (
                    <tr key={lead.id} className={`border-b border-gray-200 hover:bg-gray-50 ${rowBgColor}`}>
                      {visibleColumnsArray.map((column) => {
                        const isLeadColumn = column.key === "nome_empresa"
                        return (
                          <td
                            key={`${lead.id}-${column.key}`}
                            className={`border-r border-gray-200 p-0 ${
                              isLeadColumn
                                ? `sticky left-0 z-[25] ${rowBgColor} shadow-[2px_0_4px_rgba(0,0,0,0.1)]`
                                : ""
                            }`}
                            style={{ minWidth: column.width, width: column.width }}
                          >
                            {renderCell(lead, column)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
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
