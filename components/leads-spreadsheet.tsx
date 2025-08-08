"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog" // Importado Dialog
import { Settings2, Save, X, Loader2, RefreshCw, CheckCircle, Eye, EyeOff, ColumnsIcon, FolderIcon } from 'lucide-react'
import { Lead, leadOperations, fetchLookups } from "@/lib/supabase-operations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface LeadsSpreadsheetProps {
  leads: Lead[]
  onUpdateLead: (id: string | number, updates: Partial<Lead>) => Promise<void>
  onRefresh: () => void
}

type ColumnKey = keyof Lead

interface ColumnConfig {
  key: ColumnKey
  label: string
  type: "text" | "number" | "boolean" | "date" | "time" | "select"
  lookupTable?:
    | "produto"
    | "segmento"
    | "origem"
    | "faturamento"
    | "canal"
    | "urgencia"
    | "regiao"
    | "cidade"
    | "cargo_contato"
    | "vendedor"
    | "status"
  options?: string[]
  hidden?: boolean
  editable?: boolean
}

// Colunas Essenciais conforme a imagem
const ESSENTIAL_COLUMNS_KEYS: ColumnKey[] = [
  "nome_empresa", // LEAD
  "status",
  "observacoes_sdr", // OBSERVAÇÕES SDR
  "data_ultimo_contato", // DATA ÚLTIMO CONTATO
  "data_compra", // DATA DA COMPRA
  "arrematador", // ARREMATANTE
  "sdr", // SDR
  "valor_venda", // VALOR
  "tipo_lead", // ORIGEM
]

// Catálogo completo de colunas, incluindo as novas e as adicionais
const ALL_COLUMNS: ColumnConfig[] = [
  { key: "nome_empresa", label: "Lead", type: "text", editable: true },
  { key: "status", label: "Status", type: "select", lookupTable: "status", editable: true },
  { key: "observacoes_sdr", label: "Observações SDR", type: "text", editable: true },
  { key: "data_ultimo_contato", label: "Data Último Contato", type: "date", editable: true },
  { key: "data_compra", label: "Data da Compra", type: "date", editable: true },
  { key: "arrematador", label: "Arrematante", type: "select", lookupTable: "vendedor", editable: true },
  { key: "sdr", label: "SDR", type: "select", lookupTable: "vendedor", editable: true },
  { key: "valor_venda", label: "Valor", type: "number", editable: true },
  { key: "tipo_lead", label: "Origem", type: "select", lookupTable: "origem", editable: true },

  // Colunas Adicionais
  { key: "cs", label: "CS", type: "boolean", editable: true },
  { key: "rm", label: "RM", type: "boolean", editable: true },
  { key: "rr", label: "RR", type: "boolean", editable: true },
  { key: "ns", label: "NS", type: "boolean", editable: true },
  { key: "data_marcacao", label: "Data da Marcação", type: "date", editable: true },
  { key: "data_reuniao", label: "Data da Reunião", type: "date", editable: true },
  { key: "faturamento", label: "Faturamento", type: "select", lookupTable: "faturamento", editable: true },
  { key: "nicho", label: "Segmento", type: "select", lookupTable: "segmento", editable: true },
  { key: "cidade", label: "Cidade", type: "select", lookupTable: "cidade", editable: true },
  { key: "regiao", label: "Região", type: "select", lookupTable: "regiao", editable: true },
  { key: "cargo_contato", label: "Cargo", type: "select", lookupTable: "cargo_contato", editable: true },
  { key: "email", label: "Email", type: "text", editable: true },
  { key: "produto_marketing", label: "Produto", type: "select", lookupTable: "produto", editable: true },
  { key: "anuncios", label: "Anúncios", type: "boolean", editable: true },
  { key: "horario_compra", label: "Horário de Compra", type: "time", editable: true },
  { key: "closer", label: "Closer", type: "select", lookupTable: "vendedor", editable: true },
  { key: "observacoes_closer", label: "Observação Closer", type: "text", editable: true }, // Novo campo
  { key: "fee", label: "FEE MRR", type: "number", editable: true },
  { key: "escopo_fechado_valor", label: "FEE ONE-TIME", type: "number", editable: true },
  { key: "data_assinatura", label: "Data de Assinatura", type: "date", editable: true },
  { key: "motivo_perda", label: "Motivo de Perda", type: "text", editable: true }, // Novo campo

  // Campos de sistema (não editáveis, geralmente ocultos)
  { key: "nome_fantazia", label: "Nome Fantasia", type: "text", editable: true, hidden: true },
  { key: "venda", label: "Venda", type: "boolean", editable: true, hidden: true },
  { key: "fee_total", label: "FEE Total", type: "number", editable: true, hidden: true },
  { key: "created_at", label: "Criado Em", type: "text", editable: false, hidden: true },
  { key: "updated_at", label: "Atualizado Em", type: "text", editable: false, hidden: true },
]

const LOCAL_STORAGE_COLUMNS_KEY = "leads-spreadsheet-columns-v2"

export function LeadsSpreadsheet({ leads, onUpdateLead, onRefresh }: LeadsSpreadsheetProps) {
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
    if (typeof window !== "undefined") {
      const savedColumns = localStorage.getItem(LOCAL_STORAGE_COLUMNS_KEY)
      if (savedColumns) return JSON.parse(savedColumns)
    }
    return ESSENTIAL_COLUMNS_KEYS
  })
  const [editingCell, setEditingCell] = useState<{ leadId: string | number; columnKey: ColumnKey } | null>(null)
  const [cellValue, setCellValue] = useState<any>("")
  const [savingCell, setSavingCell] = useState(false)
  const [lookups, setLookups] = useState<any>({})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const fetchedLookups = await fetchLookups()
        setLookups(fetchedLookups)
      } catch (error) {
        console.error("Erro ao carregar lookups para planilha:", error)
      }
    }
    loadLookups()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_COLUMNS_KEY, JSON.stringify(visibleColumns))
    }
  }, [visibleColumns])

  const handleColumnVisibilityChange = (key: ColumnKey, isVisible: boolean) => {
    setVisibleColumns((prev) => {
      if (isVisible) {
        // Adiciona respeitando a ordem do catálogo
        const newColumns = ALL_COLUMNS.filter((col) => prev.includes(col.key) || col.key === key).map((col) => col.key)
        return newColumns as ColumnKey[]
      } else {
        return prev.filter((col) => col !== key)
      }
    })
  }

  const getColumnConfig = useCallback((key: ColumnKey) => ALL_COLUMNS.find((col) => col.key === key), [])

  const handleCellClick = (lead: Lead, column: ColumnConfig) => {
    if (column.editable) {
      setEditingCell({ leadId: lead.id, columnKey: column.key })
      setCellValue((lead as any)[column.key] ?? "")
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleCellValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCellValue(e.target.value)
  }
  const handleSelectCellValueChange = (value: string) => setCellValue(value)
  const handleCheckboxCellValueChange = (checked: boolean) => setCellValue(checked)

  const handleSaveCell = async () => {
    if (!editingCell) return
    setSavingCell(true)
    const { leadId, columnKey } = editingCell
    const columnConfig = getColumnConfig(columnKey)

    let valueToSave: any = cellValue
    if (columnConfig?.type === "number") {
      const n = Number.parseFloat(String(valueToSave))
      valueToSave = Number.isNaN(n) ? null : n
    } else if (columnConfig?.type === "boolean") {
      valueToSave = Boolean(valueToSave)
    } else if (valueToSave === "") {
      valueToSave = null
    }

    try {
      await onUpdateLead(leadId, { [columnKey]: valueToSave } as Partial<Lead>)
      setEditingCell(null)
      setCellValue("")
    } catch (error) {
      console.error("Erro ao salvar célula:", error)
      alert("Erro ao salvar célula. Verifique o console para mais detalhes.")
    } finally {
      setSavingCell(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setCellValue("")
  }

  const formatDateBR = (value?: string) => {
    if (!value) return "—"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString("pt-BR")
  }

  const formatValor = (value?: number) => {
    if (!value) return "—"
    return Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const statusClass = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "BACKLOG":
        return "bg-gray-200 text-gray-800"
      case "TENTANDO CONTATO":
        return "bg-blue-200 text-blue-800"
      case "REUNIAO AGENDADA":
        return "bg-purple-200 text-purple-800"
      case "REUNIAO REALIZADA":
        return "bg-indigo-200 text-indigo-800"
      case "PROPOSTA ENVIADA":
        return "bg-yellow-200 text-yellow-800"
      case "NEGOCIACAO":
        return "bg-orange-200 text-orange-800"
      case "CONTRATO ASSINADO":
        return "bg-green-200 text-green-800"
      case "GANHO":
        return "bg-green-500 text-white"
      case "DROPADO":
        return "bg-red-200 text-red-800"
      case "FOLLOW INFINITO":
        return "bg-pink-200 text-pink-800"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const renderCellContent = (lead: Lead, column: ColumnConfig) => {
    const value = (lead as any)[column.key]

    if (editingCell?.leadId === lead.id && editingCell.columnKey === column.key) {
      if (column.type === "boolean") {
        return <Checkbox checked={!!cellValue} onCheckedChange={handleCheckboxCellValueChange} disabled={savingCell} />
      } else if (column.type === "select" && column.lookupTable) {
        const options = Array.from(lookups[column.lookupTable]?.map ? lookups[column.lookupTable].map : new Map().values())
        return (
          <Select onValueChange={handleSelectCellValueChange} value={cellValue ?? ""} disabled={savingCell}>
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder={`Selecione ${column.label}`} />
            </SelectTrigger>
            <SelectContent>
              {Array.from(options as any[]).map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      } else {
        return (
          <Input
            ref={inputRef}
            type={
              column.type === "number" ? "number" : column.type === "date" ? "date" : column.type === "time" ? "time" : "text"
            }
            value={cellValue ?? ""}
            onChange={handleCellValueChange}
            onBlur={handleSaveCell}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveCell()
              else if (e.key === "Escape") handleCancelEdit()
            }}
            className="h-8 w-full"
            disabled={savingCell}
          />
        )
      }
    }

    // Exibição (não editando)
    if (column.key === "status") {
      return <Badge className={`${statusClass(value as string)} font-medium`}>{value || "—"}</Badge>
    }
    if (column.key === "valor_venda" || column.key === "fee" || column.key === "escopo_fechado_valor") {
      return formatValor(value as number)
    }
    if (column.type === "boolean") {
      return value ? "Sim" : "Não"
    }
    if (column.type === "date") {
      return formatDateBR(value as string)
    }
    return (value as any) || "—"
  }

  const visibleConfigs = visibleColumns
    .map((k) => ALL_COLUMNS.find((c) => c.key === k))
    .filter(Boolean) as ColumnConfig[]

  const essentialColumnsConfig = ALL_COLUMNS.filter((col) => ESSENTIAL_COLUMNS_KEYS.includes(col.key))
  const additionalColumnsConfig = ALL_COLUMNS.filter((col) => !ESSENTIAL_COLUMNS_KEYS.includes(col.key))

  const visibleCount = visibleConfigs.length
  const totalSelectable = ALL_COLUMNS.length

  const handleShowAllColumns = () => {
    setVisibleColumns(ALL_COLUMNS.map(col => col.key));
  };

  const handleShowEssentialColumns = () => {
    setVisibleColumns(ESSENTIAL_COLUMNS_KEYS);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-4 py-3 flex items-center justify-between border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="text-xl">📊</div>
          <div>
            <div className="text-lg font-bold text-gray-900">Planilha de Leads</div>
            <div className="text-xs text-gray-500">
              {visibleCount}/{totalSelectable} colunas • <span className="text-green-600 font-medium">Auto-save ativo</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white">
                <Settings2 className="w-4 h-4 mr-2" />
                Colunas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[700px] p-6 max-h-[80vh] overflow-y-auto">
              <DialogHeader className="flex flex-row justify-between items-center mb-4">
                <DialogTitle className="text-lg font-semibold">Configurar Colunas Visíveis</DialogTitle>
                {/* O botão de fechar é adicionado automaticamente pelo DialogContent */}
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-bold text-green-600 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" /> Colunas Essenciais
                  </p>
                  <div className="grid gap-2">
                    {essentialColumnsConfig.map((column) => (
                      <div key={column.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${column.key}`}
                          checked={visibleColumns.includes(column.key)}
                          onCheckedChange={(checked) => handleColumnVisibilityChange(column.key, !!checked)}
                        />
                        <label htmlFor={`col-${column.key}`} className="text-sm leading-none">
                          {column.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-600 mb-2 flex items-center">
                    <FolderIcon className="w-4 h-4 mr-1" /> Colunas Adicionais
                  </p>
                  <div className="grid gap-2">
                    {additionalColumnsConfig.map((column) => (
                      <div key={column.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${column.key}`}
                          checked={visibleColumns.includes(column.key)}
                          onCheckedChange={(checked) => handleColumnVisibilityChange(column.key, !!checked)}
                        />
                        <label htmlFor={`col-${column.key}`} className="text-sm leading-none">
                          {column.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-6 border-t pt-4">
                <Button variant="outline" size="sm" onClick={handleShowAllColumns}>
                  <Eye className="w-4 h-4 mr-2" />
                  Mostrar Todas
                </Button>
                <Button variant="outline" size="sm" onClick={handleShowEssentialColumns}>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Apenas Essenciais
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={onRefresh} className="bg-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Barra de estado de salvamento */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-600 bg-gray-50/50">
        <div className="flex items-center gap-2">
          {savingCell && (
            <span className="inline-flex items-center text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </span>
          )}
        </div>
        <div className="hidden md:flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          Salvamento automático ativo
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader className="bg-red-600">
            <TableRow>
              {visibleConfigs.map((column) => (
                <TableHead
                  key={column.key}
                  className="text-white uppercase text-xs font-bold tracking-wide"
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleConfigs.length} className="text-center py-8 text-gray-500">
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  {visibleConfigs.map((column) => (
                    <TableCell
                      key={`${lead.id}-${column.key}`}
                      className={`relative ${column.editable ? "cursor-pointer hover:bg-gray-50" : ""}`}
                      onClick={() => handleCellClick(lead, column)}
                    >
                      {renderCellContent(lead, column)}

                      {editingCell?.leadId === lead.id && editingCell.columnKey === column.key && column.editable && (
                        <div className="absolute top-1 right-1 flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:bg-green-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveCell()
                            }}
                            disabled={savingCell}
                          >
                            <Save className="h-3 w-3" />
                            <span className="sr-only">Salvar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelEdit()
                            }}
                            disabled={savingCell}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Cancelar</span>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé */}
      <div className="px-4 py-3 flex items-center justify-between border-t bg-white text-sm">
        <div className="text-gray-600">
          {leads.length} {leads.length === 1 ? "lead" : "leads"} • {visibleCount} colunas visíveis
        </div>
        <div className="md:hidden inline-flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          Salvamento automático ativo
        </div>
      </div>
    </div>
  )
}
