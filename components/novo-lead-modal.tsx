"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X, RefreshCw, Sparkles } from 'lucide-react'
import { leadOperations, type Lead, fetchLookups } from "@/lib/supabase-operations" // Importando fetchLookups

interface NovoLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (leadData: any) => void
  editingLead?: Lead | null
  saving?: boolean
}

export function NovoLeadModal({ isOpen, onClose, onSave, editingLead, saving = false }: NovoLeadModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [lookups, setLookups] = useState<any>({})
  const [loadingLookups, setLoadingLookups] = useState(true)
  const [autoFillData, setAutoFillData] = useState("")


  useEffect(() => {
    const loadLookups = async () => {
      setLoadingLookups(true)
      try {
        const fetchedLookups = await fetchLookups() // Chamando a função exportada diretamente
        setLookups(fetchedLookups)
      } catch (error) {
        console.error("Erro ao carregar lookups:", error)
      } finally {
        setLoadingLookups(false)
      }
    }
    loadLookups()
  }, [])

  useEffect(() => {
    if (!isOpen) {
      // Reset form when closing
      setFormData({
        nomeEmpresa: "",
        nomeFantazia: "",
        produtoMarketing: "",
        nicho: "",
        dataCompra: "",
        horarioCompra: "",
        valorVenda: "",
        venda: false,
        tipoLead: "",
        faturamento: "",
        canal: "",
        nivelUrgencia: "",
        regiao: "",
        cidade: "",
        nomeContato: "",
        cargoContato: "",
        email: "",
        emailCorporativo: false,
        sdr: "",
        closer: "",
        arrematador: "",
        anuncios: false,
        status: "",
        observacoes: "",
        dataUltimoContato: "",
        conseguiuContato: false,
        reuniaoAgendada: false,
        reuniaoRealizada: false,
        noShow: false,
        dataMarcacao: "",
        dataReuniao: "",
        dataAssinatura: "",
        fee: "",
        escopoFechadoValor: "",
        feeTotal: "",
      })
      setAutoFillData("")
    }

    if (editingLead && isOpen) {
      // Load editing data
      setFormData({
        nomeEmpresa: editingLead.nome_empresa || "",
        nomeFantazia: editingLead.nome_fantazia || "",
        produtoMarketing: editingLead.produto_marketing || "",
        nicho: editingLead.nicho || "",
        dataCompra: editingLead.data_compra || "",
        horarioCompra: editingLead.horario_compra || "",
        valorVenda: editingLead.valor_venda?.toString() || "",
        venda: editingLead.venda || false,
        tipoLead: editingLead.tipo_lead || "",
        faturamento: editingLead.faturamento || "",
        canal: editingLead.canal || "",
        nivelUrgencia: editingLead.nivel_urgencia || "",
        regiao: editingLead.regiao || "",
        cidade: editingLead.cidade || "",
        nomeContato: editingLead.nome_contato || "",
        cargoContato: editingLead.cargo_contato || "",
        email: editingLead.email || "",
        emailCorporativo: editingLead.email_corporativo || false,
        sdr: editingLead.sdr || "",
        closer: editingLead.closer || "",
        arrematador: editingLead.arrematador || "",
        anuncios: editingLead.anuncios || false,
        status: editingLead.status || "",
        observacoes: editingLead.observacoes || "",
        dataUltimoContato: editingLead.data_ultimo_contato || "",
        conseguiuContato: editingLead.cs || false,
        reuniaoAgendada: editingLead.rm || false,
        reuniaoRealizada: editingLead.rr || false,
        noShow: editingLead.ns || false,
        dataMarcacao: editingLead.data_marcacao || "",
        dataReuniao: editingLead.data_reuniao || "",
        dataAssinatura: editingLead.data_assinatura || "",
        fee: editingLead.fee?.toString() || "",
        escopoFechadoValor: editingLead.escopo_fechado_valor?.toString() || "",
        feeTotal: editingLead.fee_total?.toString() || "",
      })
    }
  }, [editingLead, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  // PARSER ESPECÍFICO PARA O FORMATO DOS DADOS
  const parseAutoFillData = (data: string) => {
    console.log("🔄 === INICIANDO PARSER ESPECÍFICO ===")
    console.log("📝 Dados recebidos:", data)

    if (!data || data.trim() === "") {
      console.log("❌ Dados vazios")
      return
    }

    const updates: any = {}

    try {
      // Nome da empresa - primeira linha
      const firstLine = data.split("\n")[0]?.trim()
      if (firstLine && !firstLine.includes("|") && !firstLine.includes(":")) {
        updates.nomeEmpresa = firstLine
        console.log("✅ Empresa encontrada:", firstLine)
      }

      // Produto de Marketing (assuming it maps to 'Produto' in the new schema)
      const produtoMatch = data.match(/Produto de Marketing\s*\|\s*([^\n]+)/i)
      if (produtoMatch) {
        updates.produtoMarketing = produtoMatch[1].trim()
        console.log("✅ Produto encontrado:", produtoMatch[1].trim())
      }

      // Data e hora
      const dataMatch = data.match(/(\d{2}\/\d{2}\/\d{4})\s*\|\s*(\d{2}:\d{2})/i)
      if (dataMatch) {
        const [, dataStr, horaStr] = dataMatch
        // Converter para formato YYYY-MM-DD e HH:MM:SS
        const [dia, mes, ano] = dataStr.split("/")
        updates.dataCompra = `${ano}-${mes}-${dia}`
        updates.horarioCompra = `${horaStr}:00` // Add seconds for HH:MM:SS format
        console.log("✅ Data/Hora encontrada:", updates.dataCompra, updates.horarioCompra)
      }

      // Faturamento
      const faturamentoMatch = data.match(/Faturamento:\s*([^\n]+)/i)
      if (faturamentoMatch) {
        updates.faturamento = faturamentoMatch[1].trim()
        console.log("✅ Faturamento encontrado:", faturamentoMatch[1].trim())
      }

      // Segmento/Nicho
      const segmentoMatch = data.match(/Segmento:\s*([^\n]+)/i)
      if (segmentoMatch) {
        const segmento = segmentoMatch[1].trim()
        // Mapear valores
        const nichoMap: { [key: string]: string } = {
          serviço: "Serviço",
          servico: "Serviço",
          varejo: "Varejo",
          industria: "Indústria",
          indústria: "Indústria",
          assessoria: "Assessoria",
          turismo: "Turismo",
          "e-commerce": "E-commerce",
          ecommerce: "E-commerce",
        }
        updates.nicho = nichoMap[segmento.toLowerCase()] || segmento
        console.log("✅ Nicho encontrado:", updates.nicho)
      }

      // Região/Cidade
      const regiaoMatch = data.match(/Região:\s*([^\n]+)/i)
      if (regiaoMatch) {
        const regiao = regiaoMatch[1].trim()
        if (regiao !== "-") {
          // Se tem barra, pegar a primeira parte como cidade
          if (regiao.includes("/")) {
            updates.cidade = regiao.split("/")[0].trim()
            updates.regiao = regiao.split("/")[1]?.trim()
          } else {
            updates.cidade = regiao
          }
          console.log("✅ Região/Cidade encontrada:", regiao)
        }
      }

      // Canal
      const canalMatch = data.match(/Canal:\s*([^\n]+)/i)
      if (canalMatch && canalMatch[1].trim() !== "-") {
        updates.canal = canalMatch[1].trim()
        console.log("✅ Canal encontrado:", canalMatch[1].trim())
      }

      // Nome do contato
      const contatoMatch = data.match(/Nome do contato:\s*([^\n]+)/i)
      if (contatoMatch) {
        updates.nomeContato = contatoMatch[1].trim()
        console.log("✅ Contato encontrado:", contatoMatch[1].trim())
      }

      // Email
      const emailMatch = data.match(/E-mail:\s*([^\n]+)/i)
      if (emailMatch) {
        updates.email = emailMatch[1].trim()
        console.log("✅ Email encontrado:", emailMatch[1].trim())
      }

      // Cargo
      const cargoMatch = data.match(/Cargo:\s*([^\n]+)/i)
      if (cargoMatch && cargoMatch[1].trim() !== "-") {
        updates.cargoContato = cargoMatch[1].trim()
        console.log("✅ Cargo encontrado:", cargoMatch[1].trim())
      }

      // Definir origem como LeadBroker por padrão (já que parece ser o formato padrão)
      updates.tipoLead = "LeadBroker"
      console.log("✅ Origem definida como LeadBroker")

      // Definir status padrão como Backlog
      updates.status = "BACKLOG"
      console.log("✅ Status definido como Backlog")

      console.log("📊 Atualizações encontradas:", updates)

      // Aplicar as atualizações ao formulário
      if (Object.keys(updates).length > 0) {
        setFormData((prev: any) => {
          const newData = { ...prev, ...updates }
          console.log("✅ Formulário atualizado:", newData)
          return newData
        })

        // Limpar o campo de auto-fill
        setAutoFillData("")
        console.log("✅ Campo de auto-fill limpo")

        // Mostrar quantos campos foram preenchidos
        console.log(`✅ ${Object.keys(updates).length} campos preenchidos automaticamente`)
      } else {
        console.log("⚠️ Nenhuma informação reconhecida")
      }
    } catch (error) {
      console.error("❌ Erro no parser:", error)
    }
  }

  const handleAutoFill = () => {
    console.log("🚀 === BOTÃO AUTO-FILL CLICADO ===")
    console.log("📝 Dados para processar:", autoFillData)

    if (autoFillData.trim()) {
      parseAutoFillData(autoFillData)
    } else {
      console.log("❌ Nenhum dado para processar")
    }
  }

  const handleSave = () => {
    console.log("💾 === SALVANDO LEAD ===")

    // Validação básica - CAMPOS OBRIGATÓRIOS
    const requiredFields = [
      "nomeEmpresa",
      "nicho",
      "nomeContato",
      "email",
      "sdr",
      "status",
    ]

    const missingFields = requiredFields.filter((field) => {
      const value = formData[field as keyof typeof formData]
      return !value || value === ""
    })

    if (missingFields.length > 0) {
      alert(`❌ Campos obrigatórios não preenchidos:\n${missingFields.join(", ")}`)
      return
    }

    console.log("✅ Validação passou, salvando...")
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">JO</span>
            </div>
            <DialogTitle className="text-xl font-semibold">{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* PREENCHIMENTO AUTOMÁTICO NO CABEÇALHO */}
          {!editingLead && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">✨ Preenchimento Automático</h3>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Cole os dados do lead abaixo e clique em "Preencher" para completar automaticamente os campos:
              </p>
              <div className="space-y-3">
                <Textarea
                  placeholder="Cole aqui os dados do lead do LeadBroker..."
                  value={autoFillData}
                  onChange={(e) => setAutoFillData(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleAutoFill}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!autoFillData.trim()}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Preencher Automaticamente
                  </Button>
                  <Button variant="outline" onClick={() => setAutoFillData("")} disabled={!autoFillData.trim()}>
                    <X className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-900 mb-4">📋 Informações Básicas *</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nomeEmpresa">Razão Social *</Label>
                <Input
                  id="nomeEmpresa"
                  placeholder="Digite a razão social da empresa"
                  value={formData.nomeEmpresa}
                  onChange={(e) => handleInputChange("nomeEmpresa", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nomeFantazia">Nome Fantasia</Label>
                <Input
                  id="nomeFantazia"
                  placeholder="Digite o nome fantasia"
                  value={formData.nomeFantazia}
                  onChange={(e) => handleInputChange("nomeFantazia", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="produtoMarketing">Produto de Marketing</Label>
                <Input
                  id="produtoMarketing"
                  placeholder="Digite o produto de marketing"
                  value={formData.produtoMarketing}
                  onChange={(e) => handleInputChange("produtoMarketing", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nicho">Nicho *</Label>
                <Select value={formData.nicho} onValueChange={(value) => handleInputChange("nicho", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.segmento?.map.values() || []).map((nicho: string) => (
                      <SelectItem key={nicho} value={nicho}>
                        {nicho}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataCompra">Data da Compra do Lead</Label>
                <Input
                  id="dataCompra"
                  type="date"
                  value={formData.dataCompra}
                  onChange={(e) => handleInputChange("dataCompra", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="horarioCompra">Horário da Compra do Lead</Label>
                <Input
                  id="horarioCompra"
                  type="time"
                  value={formData.horarioCompra}
                  onChange={(e) => handleInputChange("horarioCompra", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tipoLead">Origem do Lead</Label>
                <Select value={formData.tipoLead} onValueChange={(value) => handleInputChange("tipoLead", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.origem?.map.values() || []).map((origem: string) => (
                      <SelectItem key={origem} value={origem}>
                        {origem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Informações Complementares */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Informações Complementares</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="faturamento">Faturamento</Label>
                <Select value={formData.faturamento} onValueChange={(value) => handleInputChange("faturamento", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Faturamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.faturamento?.map.values() || []).map((faturamento: string) => (
                      <SelectItem key={faturamento} value={faturamento}>
                        {faturamento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="canal">Canal</Label>
                <Select value={formData.canal} onValueChange={(value) => handleInputChange("canal", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.canal?.map.values() || []).map((canal: string) => (
                      <SelectItem key={canal} value={canal}>
                        {canal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nivelUrgencia">Nível de Urgência</Label>
                <Select
                  value={formData.nivelUrgencia}
                  onValueChange={(value) => handleInputChange("nivelUrgencia", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.urgencia?.map.values() || []).map((urgencia: string) => (
                      <SelectItem key={urgencia} value={urgencia}>
                        {urgencia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="regiao">Região</Label>
                <Select value={formData.regiao} onValueChange={(value) => handleInputChange("regiao", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a Região" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.regiao?.map.values() || []).map((regiao: string) => (
                      <SelectItem key={regiao} value={regiao}>
                        {regiao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Select value={formData.cidade} onValueChange={(value) => handleInputChange("cidade", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a Cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.cidade?.map.values() || []).map((cidade: string) => (
                      <SelectItem key={cidade} value={cidade}>
                        {cidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anuncios"
                  checked={formData.anuncios}
                  onCheckedChange={(checked) => handleInputChange("anuncios", checked)}
                />
                <Label htmlFor="anuncios">Faz Anúncios?</Label>
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">👤 Informações de Contato *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeContato">Nome do Contato *</Label>
                <Input
                  id="nomeContato"
                  placeholder="Nome da pessoa de contato"
                  value={formData.nomeContato}
                  onChange={(e) => handleInputChange("nomeContato", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cargoContato">Cargo do Contato</Label>
                <Select value={formData.cargoContato} onValueChange={(value) => handleInputChange("cargoContato", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.cargo_contato?.map.values() || []).map((cargo: string) => (
                      <SelectItem key={cargo} value={cargo}>
                        {cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailCorporativo"
                  checked={formData.emailCorporativo}
                  onCheckedChange={(checked) => handleInputChange("emailCorporativo", checked)}
                />
                <Label htmlFor="emailCorporativo">E-mail Corporativo?</Label>
              </div>
            </div>
          </div>

          {/* Equipe e Processo */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-4">👥 Equipe e Processo *</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sdr">SDR *</Label>
                <Select value={formData.sdr} onValueChange={(value) => handleInputChange("sdr", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o SDR" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.vendedor?.map.values() || []).map((vendedor: string) => (
                      <SelectItem key={vendedor} value={vendedor}>
                        {vendedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="closer">Closer</Label>
                <Select value={formData.closer} onValueChange={(value) => handleInputChange("closer", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o closer" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.vendedor?.map.values() || []).map((vendedor: string) => (
                      <SelectItem key={vendedor} value={vendedor}>
                        {vendedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="arrematador">Arrematador</Label>
                <Select value={formData.arrematador} onValueChange={(value) => handleInputChange("arrematador", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o arrematador" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.vendedor?.map.values() || []).map((vendedor: string) => (
                      <SelectItem key={vendedor} value={vendedor}>
                        {vendedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Status e Acompanhamento */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">📈 Status e Acompanhamento *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(lookups.status?.map.values() || []).map((status: string) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataUltimoContato">Data do Último Contato</Label>
                <Input
                  id="dataUltimoContato"
                  type="date"
                  value={formData.dataUltimoContato}
                  onChange={(e) => handleInputChange("dataUltimoContato", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="conseguiuContato"
                  checked={formData.conseguiuContato}
                  onCheckedChange={(checked) => handleInputChange("conseguiuContato", checked)}
                />
                <Label htmlFor="conseguiuContato">Conseguiu Contato?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reuniaoAgendada"
                  checked={formData.reuniaoAgendada}
                  onCheckedChange={(checked) => handleInputChange("reuniaoAgendada", checked)}
                />
                <Label htmlFor="reuniaoAgendada">Reunião Agendada?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reuniaoRealizada"
                  checked={formData.reuniaoRealizada}
                  onCheckedChange={(checked) => handleInputChange("reuniaoRealizada", checked)}
                />
                <Label htmlFor="reuniaoRealizada">Reunião Realizada?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noShow"
                  checked={formData.noShow}
                  onCheckedChange={(checked) => handleInputChange("noShow", checked)}
                />
                <Label htmlFor="noShow">No-Show?</Label>
              </div>
            </div>
          </div>

          {/* Vendas e Financeiro */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">💰 Vendas e Financeiro</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="valorVenda">Valor da Venda (R$)</Label>
                <Input
                  id="valorVenda"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.valorVenda}
                  onChange={(e) => handleInputChange("valorVenda", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dataAssinatura">Data da Assinatura</Label>
                <Input
                  id="dataAssinatura"
                  type="date"
                  value={formData.dataAssinatura}
                  onChange={(e) => handleInputChange("dataAssinatura", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fee">Fee (R$)</Label>
                <Input
                  id="fee"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.fee}
                  onChange={(e) => handleInputChange("fee", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="escopoFechadoValor">Escopo Fechado (R$)</Label>
                <Input
                  id="escopoFechadoValor"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.escopoFechadoValor}
                  onChange={(e) => handleInputChange("escopoFechadoValor", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="feeTotal">Fee Total (R$)</Label>
                <Input
                  id="feeTotal"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.feeTotal}
                  onChange={(e) => handleInputChange("feeTotal", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dataMarcacao">Data da Marcação</Label>
                <Input
                  id="dataMarcacao"
                  type="date"
                  value={formData.dataMarcacao}
                  onChange={(e) => handleInputChange("dataMarcacao", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dataReuniao">Data da Reunião</Label>
                <Input
                  id="dataReuniao"
                  type="date"
                  value={formData.dataReuniao}
                  onChange={(e) => handleInputChange("dataReuniao", e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="venda"
                  checked={formData.venda}
                  onCheckedChange={(checked) => handleInputChange("venda", checked)}
                />
                <Label htmlFor="venda">Venda Concluída?</Label>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">📝 Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Digite observações sobre o lead..."
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end space-x-3 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : editingLead ? (
              "Atualizar"
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
