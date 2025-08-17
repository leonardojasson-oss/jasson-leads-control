"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { X, RefreshCw, Sparkles } from "lucide-react"
import type { Lead } from "@/app/page"

interface NovoLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (leadData: any) => void
  editingLead?: Lead | null
  saving?: boolean
}

export function NovoLeadModal({ isOpen, onClose, onSave, editingLead, saving = false }: NovoLeadModalProps) {
  const [formData, setFormData] = useState({
    nomeEmpresa: "",
    produtoMarketing: "",
    nicho: "",
    dataHoraCompra: "",
    valorPagoLead: "",
    origemLead: "",
    faturamento: "",
    canal: "",
    nivelUrgencia: "",
    regiao: "",
    cidade: "",
    cnpj: "",
    nomeContato: "",
    cargoContato: "",
    email: "",
    emailCorporativo: false,
    telefone: "",
    sdr: "",
    closer: "",
    arrematador: "",
    anuncios: "",
    status: "",
    observacoes: "",
    dataUltimoContato: "",
    motivoPerdaPV: "",
    comentarioLead: "",
    temComentarioLBF: false,
    investimentoTrafego: "",
    ticketMedio: "",
    qtdLojas: "",
    qtdVendedores: "",
    conseguiuContato: false,
    reuniaoAgendada: false,
    reuniaoRealizada: false,
    valorProposta: "",
    valorVenda: "",
    dataVenda: "",
    dataFechamento: "",
    fee: "",
    escopoFechado: "",
    feeTotal: "",
    vendaViaJassonCo: false,
    comissaoSDR: "",
    comissaoCloser: "",
    statusComissao: "",
  })

  const [autoFillData, setAutoFillData] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nomeEmpresa: "",
        produtoMarketing: "",
        nicho: "",
        dataHoraCompra: "",
        valorPagoLead: "",
        origemLead: "",
        faturamento: "",
        canal: "",
        nivelUrgencia: "",
        regiao: "",
        cidade: "",
        cnpj: "",
        nomeContato: "",
        cargoContato: "",
        email: "",
        emailCorporativo: false,
        telefone: "",
        sdr: "",
        closer: "",
        arrematador: "",
        anuncios: "",
        status: "",
        observacoes: "",
        dataUltimoContato: "",
        motivoPerdaPV: "",
        comentarioLead: "",
        temComentarioLBF: false,
        investimentoTrafego: "",
        ticketMedio: "",
        qtdLojas: "",
        qtdVendedores: "",
        conseguiuContato: false,
        reuniaoAgendada: false,
        reuniaoRealizada: false,
        valorProposta: "",
        valorVenda: "",
        dataVenda: "",
        dataFechamento: "",
        fee: "",
        escopoFechado: "",
        feeTotal: "",
        vendaViaJassonCo: false,
        comissaoSDR: "",
        comissaoCloser: "",
        statusComissao: "",
      })
      setAutoFillData("")
    }

    if (editingLead && isOpen) {
      setFormData({
        nomeEmpresa: editingLead.nome_empresa || "",
        produtoMarketing: editingLead.produto_marketing || "",
        nicho: editingLead.nicho || "",
        dataHoraCompra: editingLead.data_hora_compra || "",
        valorPagoLead: editingLead.valor_pago_lead || "",
        origemLead: editingLead.tipo_lead || "",
        faturamento: editingLead.faturamento || "",
        canal: editingLead.canal || "",
        nivelUrgencia: editingLead.nivel_urgencia || "",
        regiao: editingLead.regiao || "",
        cidade: editingLead.cidade || "",
        cnpj: editingLead.cnpj || "",
        nomeContato: editingLead.nome_contato || "",
        cargoContato: editingLead.cargo_contato || "",
        email: editingLead.email || "",
        emailCorporativo: editingLead.email_corporativo === "sim" || editingLead.email_corporativo === true,
        telefone: editingLead.telefone || "",
        sdr: editingLead.sdr || "",
        closer: editingLead.closer || "",
        arrematador: editingLead.arrematador || "",
        anuncios: editingLead.anuncios || "",
        status: editingLead.status || "",
        observacoes: editingLead.observacoes || "",
        dataUltimoContato: editingLead.data_ultimo_contato || "",
        motivoPerdaPV: editingLead.motivo_perda_pv || "",
        comentarioLead: editingLead.comentario_lead || "",
        temComentarioLBF: editingLead.tem_comentario_lbf || false,
        investimentoTrafego: editingLead.investimento_trafego || "",
        ticketMedio: editingLead.ticket_medio || "",
        qtdLojas: editingLead.qtd_lojas || "",
        qtdVendedores: editingLead.qtd_vendedores || "",
        conseguiuContato: editingLead.conseguiu_contato || false,
        reuniaoAgendada: editingLead.reuniao_agendada || false,
        reuniaoRealizada: editingLead.reuniao_realizada || false,
        valorProposta: editingLead.valor_proposta || "",
        valorVenda: editingLead.valor_venda || "",
        dataVenda: editingLead.data_venda || "",
        dataFechamento: editingLead.data_fechamento || "",
        fee: editingLead.fee || "",
        escopoFechado: editingLead.escopo_fechado || "",
        feeTotal: editingLead.fee_total || "",
        vendaViaJassonCo: editingLead.venda_via_jasson_co || false,
        comissaoSDR: editingLead.comissao_sdr || "",
        comissaoCloser: editingLead.comissao_closer || "",
        statusComissao: editingLead.status_comissao || "",
      })
    }
  }, [editingLead, isOpen])

  useEffect(() => {
    if (formData.email) {
      const emailValue = formData.email.toLowerCase()
      const pessoalDomains = ["gmail", "yahoo", "icloud", "msn", "terra", "bol", "hotmail"]

      const isEmailCorporativo = !pessoalDomains.some((domain) => emailValue.includes(domain))

      setFormData((prev) => ({
        ...prev,
        emailCorporativo: isEmailCorporativo,
      }))
    }
  }, [formData.email])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const parseAutoFillData = (data: string) => {
    console.log("🔄 === INICIANDO PARSER ESPECÍFICO ===")
    console.log("📝 Dados recebidos:", data)

    if (!data || data.trim() === "") {
      console.log("❌ Dados vazios")
      return
    }

    const updates: any = {}

    try {
      const firstLine = data.split("\n")[0]?.trim()
      if (firstLine && !firstLine.includes("|") && !firstLine.includes(":")) {
        updates.nomeEmpresa = firstLine
        console.log("✅ Empresa encontrada:", firstLine)
      }

      const produtoMatch = data.match(/Produto de Marketing\s*\|\s*([^\n]+)/i)
      if (produtoMatch) {
        updates.produtoMarketing = produtoMatch[1].trim()
        console.log("✅ Produto encontrado:", produtoMatch[1].trim())
      }

      const dataMatch = data.match(/(\d{2}\/\d{2}\/\d{4})\s*\|\s*(\d{2}:\d{2})/i)
      if (dataMatch) {
        const [, dataStr, horaStr] = dataMatch
        const [dia, mes, ano] = dataStr.split("/")
        const dataFormatada = `${ano}-${mes}-${dia}T${horaStr}`
        updates.dataHoraCompra = dataFormatada
        console.log("✅ Data/Hora encontrada:", dataFormatada)
      }

      const valorMatch = data.match(/Valor pago:\s*R\$\s*([\d.,]+)/i)
      if (valorMatch) {
        const valor = valorMatch[1].replace(/\./g, "").replace(",", ".")
        updates.valorPagoLead = valor
        console.log("✅ Valor encontrado:", valor)
      }

      const faturamentoMatch = data.match(/Faturamento:\s*([^\n]+)/i)
      if (faturamentoMatch) {
        updates.faturamento = faturamentoMatch[1].trim()
        console.log("✅ Faturamento encontrado:", faturamentoMatch[1].trim())
      }

      const segmentoMatch = data.match(/Segmento:\s*([^\n]+)/i)
      if (segmentoMatch) {
        const segmento = segmentoMatch[1].trim()
        const nichoMap: { [key: string]: string } = {
          serviço: "Serviço",
          servico: "Serviço",
          varejo: "Varejo",
          industria: "Indústria",
          indústria: "Indústria",
          "e-commerce": "E-commerce",
          ecommerce: "E-commerce",
          "food service": "Food Service",
          educacao: "Educação",
          educação: "Educação",
          imobiliaria: "Imobiliária",
          imobiliária: "Imobiliária",
          saas: "SAAS",
          financas: "Finanças",
          finanças: "Finanças",
          franquia: "Franquia",
          telecom: "Telecom",
          "energia solar": "Energia Solar",
          turismo: "Turismo",
          outro: "Outro",
        }
        updates.nicho = nichoMap[segmento.toLowerCase()] || segmento
        console.log("✅ Nicho encontrado:", updates.nicho)
      }

      const regiaoMatch = data.match(/Região:\s*([^\n]+)/i)
      if (regiaoMatch) {
        const regiao = regiaoMatch[1].trim()
        if (regiao !== "-") {
          if (regiao.includes("/")) {
            updates.cidade = regiao.split("/")[0].trim()
            updates.regiao = regiao.split("/")[1]?.trim()
          } else {
            updates.cidade = regiao
          }
          console.log("✅ Região/Cidade encontrada:", regiao)
        }
      }

      const canalMatch = data.match(/Canal:\s*([^\n]+)/i)
      if (canalMatch && canalMatch[1].trim() !== "-") {
        const canalValue = canalMatch[1].trim().toLowerCase()

        const origemMap: { [key: string]: string } = {
          leadbroker: "leadbroker",
          "lead broker": "leadbroker",
          orgânico: "organico",
          organico: "organico",
          indicação: "indicacao",
          indicacao: "indicacao",
          facebook: "facebook",
          google: "google",
          linkedin: "linkedin",
        }

        updates.origemLead = origemMap[canalValue] || "leadbroker"
        console.log("✅ Origem do Lead encontrada:", updates.origemLead)
      }

      const cnpjMatch = data.match(/CNPJ:\s*([^\n]+)/i)
      if (cnpjMatch && cnpjMatch[1].trim() !== "-") {
        updates.cnpj = cnpjMatch[1].trim()
        console.log("✅ CNPJ encontrado:", cnpjMatch[1].trim())
      }

      const contatoMatch = data.match(/Nome do contato:\s*([^\n]+)/i)
      if (contatoMatch) {
        updates.nomeContato = contatoMatch[1].trim()
        console.log("✅ Contato encontrado:", contatoMatch[1].trim())
      }

      const emailMatch = data.match(/E-mail:\s*([^\n]+)/i)
      if (emailMatch) {
        updates.email = emailMatch[1].trim()
        console.log("✅ Email encontrado:", emailMatch[1].trim())
      }

      const cargoMatch = data.match(/Cargo:\s*([^\n]+)/i)
      if (cargoMatch) {
        const cargoValue = cargoMatch[1].trim()
        if (cargoValue === "-") {
          updates.cargoContato = "Não preenchido"
          console.log("✅ Cargo não preenchido, definido como 'Não preenchido'")
        } else {
          updates.cargoContato = cargoValue
          console.log("✅ Cargo encontrado:", cargoValue)
        }
      }

      const telefoneMatch = data.match(/Telefone:\s*([^\n]+)/i)
      if (telefoneMatch) {
        let telefone = telefoneMatch[1].trim()
        telefone = telefone.replace(/^\+55/, "").trim()
        updates.telefone = telefone
        console.log("✅ Telefone encontrado:", telefone)
      }

      const investimentoMatch = data.match(/Investimento em tráfego:\s*([^\n]+)/i)
      if (investimentoMatch && investimentoMatch[1].trim() !== "-") {
        updates.investimentoTrafego = investimentoMatch[1].trim()
        console.log("✅ Investimento encontrado:", investimentoMatch[1].trim())
      }

      const ticketMatch = data.match(/Ticket médio:\s*([^\n]+)/i)
      if (ticketMatch && ticketMatch[1].trim() !== "-") {
        updates.ticketMedio = ticketMatch[1].trim()
        console.log("✅ Ticket médio encontrado:", ticketMatch[1].trim())
      }

      const lojasMatch = data.match(/Qtd\.\s*de lojas:\s*([^\n]+)/i)
      if (lojasMatch && lojasMatch[1].trim() !== "-") {
        updates.qtdLojas = lojasMatch[1].trim()
        console.log("✅ Qtd lojas encontrada:", lojasMatch[1].trim())
      }

      const vendedoresMatch = data.match(/qtd\.\s*de vendedores:\s*([^\n]+)/i)
      if (vendedoresMatch && vendedoresMatch[1].trim() !== "-") {
        updates.qtdVendedores = vendedoresMatch[1].trim()
        console.log("✅ Qtd vendedores encontrada:", vendedoresMatch[1].trim())
      }

      const descricaoMatch = data.match(/Descrição do lead\s*\n\s*([^\n]*)/i)
      if (descricaoMatch) {
        const descricao = descricaoMatch[1].trim()
        if (descricao && descricao !== "-") {
          updates.comentarioLead = descricao
          updates.temComentarioLBF = true
          console.log("✅ Comentário do lead encontrado:", descricao)
        } else {
          updates.comentarioLead = ""
          updates.temComentarioLBF = false
          console.log("✅ Lead sem comentário (descrição vazia ou '-')")
        }
      }

      console.log("📊 Atualizações encontradas:", updates)

      if (Object.keys(updates).length > 0) {
        setFormData((prev) => {
          const newData = { ...prev, ...updates }
          console.log("✅ Formulário atualizado:", newData)
          return newData
        })

        setAutoFillData("")
        console.log("✅ Campo de auto-fill limpo")

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

    const requiredFields = [
      "nomeEmpresa",
      "produtoMarketing",
      "nicho",
      "dataHoraCompra",
      "valorPagoLead",
      "origemLead",
      "faturamento",
      "canal",
      "nomeContato",
      "email",
      "telefone",
      "sdr",
      "arrematador",
      "anuncios",
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
    onSave({
      ...formData,
      comentario_lead: formData.comentarioLead,
      tem_comentario_lbf: formData.comentarioLead ? true : false,
    })
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
          {!editingLead && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900 mb-4">✨ Preenchimento Automático</h3>
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

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-900 mb-4">📋 Informações Básicas *</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
                <Input
                  id="nomeEmpresa"
                  placeholder="Digite o nome da empresa"
                  value={formData.nomeEmpresa}
                  onChange={(e) => handleInputChange("nomeEmpresa", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="produtoMarketing">Produto de Marketing *</Label>
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
                    <SelectItem value="Serviço">Serviço</SelectItem>
                    <SelectItem value="Varejo">Varejo</SelectItem>
                    <SelectItem value="Indústria">Indústria</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Food Service">Food Service</SelectItem>
                    <SelectItem value="Educação">Educação</SelectItem>
                    <SelectItem value="Imobiliária">Imobiliária</SelectItem>
                    <SelectItem value="SAAS">SAAS</SelectItem>
                    <SelectItem value="Finanças">Finanças</SelectItem>
                    <SelectItem value="Franquia">Franquia</SelectItem>
                    <SelectItem value="Telecom">Telecom</SelectItem>
                    <SelectItem value="Energia Solar">Energia Solar</SelectItem>
                    <SelectItem value="Turismo">Turismo</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                    <SelectItem value="Não preenchido">Não preenchido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataHoraCompra">Data/Hora da Compra do Lead *</Label>
                <Input
                  id="dataHoraCompra"
                  type="datetime-local"
                  value={formData.dataHoraCompra}
                  onChange={(e) => handleInputChange("dataHoraCompra", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="valorPagoLead">Valor Pago no Lead (R$) *</Label>
                <Input
                  id="valorPagoLead"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.valorPagoLead}
                  onChange={(e) => handleInputChange("valorPagoLead", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="origemLead">Origem do Lead *</Label>
                <Select value={formData.origemLead} onValueChange={(value) => handleInputChange("origemLead", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leadbroker">LeadBroker</SelectItem>
                    <SelectItem value="organico">Orgânico</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="faturamento">Faturamento *</Label>
                <Input
                  id="faturamento"
                  placeholder="Ex: De 401 mil à 1 milhão"
                  value={formData.faturamento}
                  onChange={(e) => handleInputChange("faturamento", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="canal">Canal *</Label>
                <Input
                  id="canal"
                  placeholder="Digite o canal"
                  value={formData.canal}
                  onChange={(e) => handleInputChange("canal", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Informações Complementares</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="regiao">Região</Label>
                <Input
                  id="regiao"
                  placeholder="Digite a região"
                  value={formData.regiao}
                  onChange={(e) => handleInputChange("regiao", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Digite a cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange("cidade", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                />
              </div>
              <div className="col-span-full">
                <Label htmlFor="comentarioLead">Comentário do Lead</Label>
                <Textarea
                  id="comentarioLead"
                  placeholder="Comentário deixado pelo lead no formulário de cadastro..."
                  value={formData.comentarioLead}
                  onChange={(e) => handleInputChange("comentarioLead", e.target.value)}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Informação adicional fornecida pelo lead durante o cadastro
                </p>
              </div>
            </div>
          </div>

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
                <Select
                  value={formData.cargoContato}
                  onValueChange={(value) => handleInputChange("cargoContato", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Proprietário(a)">Proprietário(a)</SelectItem>
                    <SelectItem value="Sócio(a)">Sócio(a)</SelectItem>
                    <SelectItem value="CEO / Diretor(a) executivo(a)">CEO / Diretor(a) executivo(a)</SelectItem>
                    <SelectItem value="Diretor(a)">Diretor(a)</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                    <SelectItem value="Supervisor(a)">Supervisor(a)</SelectItem>
                    <SelectItem value="Coordenador(a)">Coordenador(a)</SelectItem>
                    <SelectItem value="Analista">Analista</SelectItem>
                    <SelectItem value="Assistente / Funcionário">Assistente / Funcionário</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                    <SelectItem value="Não preenchido">Não preenchido</SelectItem>
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
              <div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailCorporativo"
                    checked={formData.emailCorporativo}
                    onCheckedChange={(checked) => handleInputChange("emailCorporativo", checked)}
                  />
                  <Label htmlFor="emailCorporativo">E-mail Corporativo</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-4">👥 Equipe e Processo *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sdr">SDR *</Label>
                <Select value={formData.sdr} onValueChange={(value) => handleInputChange("sdr", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o SDR" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="antonio">Antônio</SelectItem>
                    <SelectItem value="gabrielli">Gabrielli</SelectItem>
                    <SelectItem value="vanessa">Vanessa</SelectItem>
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
                    <SelectItem value="alan">Alan</SelectItem>
                    <SelectItem value="francisco">Francisco</SelectItem>
                    <SelectItem value="giselle">Giselle</SelectItem>
                    <SelectItem value="leonardo">Leonardo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="arrematador">Arrematador *</Label>
                <Select value={formData.arrematador} onValueChange={(value) => handleInputChange("arrematador", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o arrematador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alan">Alan</SelectItem>
                    <SelectItem value="antonio">Antônio</SelectItem>
                    <SelectItem value="francisco">Francisco</SelectItem>
                    <SelectItem value="gabrielli">Gabrielli</SelectItem>
                    <SelectItem value="giselle">Giselle</SelectItem>
                    <SelectItem value="leonardo">Leonardo</SelectItem>
                    <SelectItem value="vanessa">Vanessa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="anuncios">Anúncios *</Label>
                <Select value={formData.anuncios} onValueChange={(value) => handleInputChange("anuncios", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">📈 Status e Acompanhamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BACKLOG">Backlog</SelectItem>
                    <SelectItem value="TENTANDO CONTATO">Tentando Contato</SelectItem>
                    <SelectItem value="CONTATO AGENDADO">Contato Agendado</SelectItem>
                    <SelectItem value="QUALIFICANDO">Qualificando</SelectItem>
                    <SelectItem value="REUNIÃO AGENDADA">Reunião Agendada</SelectItem>
                    <SelectItem value="REUNIÃO">Reunião</SelectItem>
                    <SelectItem value="REUNIÃO REALIZADA">Reunião Realizada</SelectItem>
                    <SelectItem value="DÚVIDAS E FECHAMENTO">Dúvidas e Fechamento</SelectItem>
                    <SelectItem value="CONTRATO NA RUA">Contrato na Rua</SelectItem>
                    <SelectItem value="GANHO">Ganho</SelectItem>
                    <SelectItem value="FOLLOW UP">Follow Up</SelectItem>
                    <SelectItem value="NO-SHOW">No-Show</SelectItem>
                    <SelectItem value="DROPADO">Dropado</SelectItem>
                    <SelectItem value="FOLLOW INFINITO">Follow Infinito</SelectItem>
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
          </div>

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
