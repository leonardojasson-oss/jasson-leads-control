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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings2, Save, X, Loader2 } from 'lucide-react'
import { Lead, leadOperations, fetchLookups } from "@/lib/supabase-operations" // Importando fetchLookups diretamente
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LeadsSpreadsheetProps {
leads: Lead[]
onUpdateLead: (id: string | number, updates: Partial<Lead>) => Promise<void>
onRefresh: () => void
}

type ColumnKey = keyof Lead | "actions"

interface ColumnConfig {
key: ColumnKey
label: string
type: "text" | "number" | "boolean" | "date" | "time" | "select" | "actions"
lookupTable?: keyof typeof leadOperations._fetchLookups extends infer U ? U extends string ? U : never : never // Dynamically infer lookup table names
options?: string[] // For select type, if not from lookup
hidden?: boolean
editable?: boolean
}

const ALL_COLUMNS: ColumnConfig[] = [
{ key: "nome_empresa", label: "Nome Empresa", type: "text", editable: true },
{ key: "nome_fantazia", label: "Nome Fantasia", type: "text", editable: true },
{ key: "produto_marketing", label: "Produto Marketing", type: "select", lookupTable: "produto", editable: true },
{ key: "nicho", label: "Nicho", type: "select", lookupTable: "segmento", editable: true },
{ key: "data_compra", label: "Data Compra", type: "date", editable: true },
{ key: "horario_compra", label: "Horário Compra", type: "time", editable: true },
{ key: "valor_venda", label: "Valor Venda", type: "number", editable: true },
{ key: "venda", label: "Venda", type: "boolean", editable: true },
{ key: "tipo_lead", label: "Tipo Lead", type: "select", lookupTable: "origem", editable: true },
{ key: "faturamento", label: "Faturamento", type: "select", lookupTable: "faturamento", editable: true },
{ key: "canal", label: "Canal", type: "select", lookupTable: "canal", editable: true },
{ key: "nivel_urgencia", label: "Nível Urgência", type: "select", lookupTable: "urgencia", editable: true },
{ key: "regiao", label: "Região", type: "select", lookupTable: "regiao", editable: true },
{ key: "cidade", label: "Cidade", type: "select", lookupTable: "cidade", editable: true },
{ key: "nome_contato", label: "Nome Contato", type: "text", editable: true },
{ key: "cargo_contato", label: "Cargo Contato", type: "select", lookupTable: "cargo_contato", editable: true },
{ key: "email", label: "Email", type: "text", editable: true },
{ key: "email_corporativo", label: "Email Corporativo", type: "boolean", editable: true },
{ key: "sdr", label: "SDR", type: "select", lookupTable: "vendedor", editable: true },
{ key: "closer", label: "Closer", type: "select", lookupTable: "vendedor", editable: true },
{ key: "arrematador", label: "Arrematador", type: "select", lookupTable: "vendedor", editable: true },
{ key: "anuncios", label: "Anúncios", type: "boolean", editable: true },
{ key: "status", label: "Status", type: "select", lookupTable: "status", editable: true },
{ key: "observacoes", label: "Observações", type: "text", editable: true },
{ key: "data_ultimo_contato", label: "Último Contato", type: "date", editable: true },
{ key: "cs", label: "CS", type: "boolean", editable: true },
{ key: "rm", label: "RM", type: "boolean", editable: true },
{ key: "rr", label: "RR", type: "boolean", editable: true },
{ key: "ns", label: "NS", type: "boolean", editable: true },
{ key: "data_marcacao", label: "Data Marcação", type: "date", editable: true },
{ key: "data_reuniao", label: "Data Reunião", type: "date", editable: true },
{ key: "data_assinatura", label: "Data Assinatura", type: "date", editable: true },
{ key: "fee", label: "FEE", type: "number", editable: true },
{ key: "escopo_fechado_valor", label: "Escopo Fechado", type: "number", editable: true },
{ key: "fee_total", label: "FEE Total", type: "number", editable: true },
{ key: "created_at", label: "Criado Em", type: "text", editable: false },
{ key: "updated_at", label: "Atualizado Em", type: "text", editable: false },
{ key: "actions", label: "Ações", type: "actions", editable: false },
]

const LOCAL_STORAGE_COLUMNS_KEY = "leads-spreadsheet-columns-v1"

export function LeadsSpreadsheet({ leads, onUpdateLead, onRefresh }: LeadsSpreadsheetProps) {
const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
  if (typeof window !== "undefined") {
    const savedColumns = localStorage.getItem(LOCAL_STORAGE_COLUMNS_KEY)
    if (savedColumns) {
      return JSON.parse(savedColumns)
    }
  }
  // Default visible columns
  return [
    "nome_empresa",
    "nome_contato",
    "email",
    "sdr",
    "status",
    "valor_venda",
    "data_assinatura",
    "actions",
  ]
})
const [editingCell, setEditingCell] = useState<{
  leadId: string | number
  columnKey: ColumnKey
} | null>(null)
const [cellValue, setCellValue] = useState<any>("")
const [savingCell, setSavingCell] = useState(false)
const [lookups, setLookups] = useState<any>({})
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  const loadLookups = async () => {
    try {
      const fetchedLookups = await fetchLookups() // Chamando fetchLookups diretamente
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
      // Add column, maintaining order from ALL_COLUMNS
      const newColumns = ALL_COLUMNS.filter((col) => prev.includes(col.key) || col.key === key).map((col) => col.key)
      return newColumns
    } else {
      // Remove column
      return prev.filter((col) => col !== key)
    }
  })
}

const getColumnConfig = useCallback(
  (key: ColumnKey) => ALL_COLUMNS.find((col) => col.key === key),
  []
)

const handleCellClick = (lead: Lead, column: ColumnConfig) => {
  if (column.editable) {
    setEditingCell({ leadId: lead.id, columnKey: column.key })
    setCellValue(lead[column.key as keyof Lead] || "")
    setTimeout(() => inputRef.current?.focus(), 0)
  }
}

const handleCellValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  setCellValue(e.target.value)
}

const handleSelectCellValueChange = (value: string) => {
  setCellValue(value)
}

const handleCheckboxCellValueChange = (checked: boolean) => {
  setCellValue(checked)
}

const handleSaveCell = async () => {
  if (!editingCell) return

  setSavingCell(true)
  const { leadId, columnKey } = editingCell
  const columnConfig = getColumnConfig(columnKey)

  let valueToSave: any = cellValue
  if (columnConfig?.type === "number") {
    valueToSave = Number.parseFloat(valueToSave)
    if (isNaN(valueToSave)) valueToSave = null
  } else if (columnConfig?.type === "boolean") {
    valueToSave = Boolean(valueToSave)
  } else if (valueToSave === "") {
    valueToSave = null // Treat empty strings as null for DB
  }

  try {
    await onUpdateLead(leadId, { [columnKey]: valueToSave })
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

const renderCellContent = (lead: Lead, column: ColumnConfig) => {
  const value = lead[column.key as keyof Lead]

  if (editingCell?.leadId === lead.id && editingCell.columnKey === column.key) {
    if (column.type === "boolean") {
      return (
        <Checkbox
          checked={cellValue as boolean}
          onCheckedChange={handleCheckboxCellValueChange}
          disabled={savingCell}
        />
      )
    } else if (column.type === "select" && column.lookupTable) {
      const options = Array.from(lookups[column.lookupTable]?.map.values() || [])
      return (
        <Select onValueChange={handleSelectCellValueChange} value={cellValue} disabled={savingCell}>
          <SelectTrigger className="w-full h-8">
            <SelectValue placeholder={`Selecione ${column.label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option: string) => (
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
          type={column.type === "number" ? "number" : column.type === "date" ? "date" : column.type === "time" ? "time" : "text"}
          value={cellValue}
          onChange={handleCellValueChange}
          onBlur={handleSaveCell} // Save on blur
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSaveCell()
            } else if (e.key === "Escape") {
              handleCancelEdit()
            }
          }}
          className="h-8 w-full"
          disabled={savingCell}
        />
      )
    }
  }

  // Display formatted values
  if (column.key === "valor_venda" || column.key === "fee" || column.key === "escopo_fechado_valor" || column.key === "fee_total") {
    return value ? `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "N/A"
  }
  if (column.type === "boolean") {
    return value ? "Sim" : "Não"
  }
  if (column.key === "created_at" || column.key === "updated_at") {
    return value ? new Date(value as string).toLocaleString() : "N/A"
  }

  return (value as React.ReactNode) || "N/A"
}

return (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="p-4 flex justify-between items-center border-b">
      <h2 className="text-xl font-bold">Planilha de Leads</h2>
      <div className="flex items-center space-x-2">
        {savingCell && (
          <div className="flex items-center text-sm text-gray-500">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Salvando...
          </div>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="w-4 h-4 mr-2" />
              Colunas
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <div className="grid gap-2">
              <p className="text-sm font-medium">Mostrar Colunas</p>
              {ALL_COLUMNS.filter(col => col.key !== "actions").map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${column.key}`}
                    checked={visibleColumns.includes(column.key)}
                    onCheckedChange={(checked) =>
                      handleColumnVisibilityChange(column.key, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`col-${column.key}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            {visibleColumns.map((key) => {
              const column = getColumnConfig(key)
              return column ? <TableHead key={key}>{column.label}</TableHead> : null
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-gray-500">
                Nenhum lead encontrado.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                {visibleColumns.map((key) => {
                  const column = getColumnConfig(key)
                  if (!column) return null

                  return (
                    <TableCell
                      key={`${lead.id}-${key}`}
                      className={`relative ${column.editable ? "cursor-pointer hover:bg-gray-100" : ""}`}
                      onClick={() => handleCellClick(lead, column)}
                    >
                      {renderCellContent(lead, column)}
                      {editingCell?.leadId === lead.id && editingCell.columnKey === key && column.editable && (
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
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
)
}
