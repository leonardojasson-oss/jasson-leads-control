import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Lead } from "@/lib/supabase-operations"

interface LeadsListProps {
  leads: Lead[]
  onEditLead: (lead: Lead) => void
  onDeleteLead: (id: string | number) => void
}

export function LeadsList({ leads, onEditLead, onDeleteLead }: LeadsListProps) {
  const [expandedLeadId, setExpandedLeadId] = useState<string | number | null>(null)

  const toggleExpand = (id: string | number) => {
    setExpandedLeadId(expandedLeadId === id ? null : id)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>SDR</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Nenhum lead encontrado.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <>
                <TableRow key={lead.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpand(lead.id)}
                      aria-expanded={expandedLeadId === lead.id}
                      aria-controls={`details-${lead.id}`}
                    >
                      {expandedLeadId === lead.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{lead.nome_empresa}</TableCell>
                  <TableCell>{lead.nome_contato}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.sdr}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEditLead(lead)} className="mr-2">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteLead(lead.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedLeadId === lead.id && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-4 bg-gray-50" id={`details-${lead.id}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p>
                            <strong>Nome Fantasia:</strong> {lead.nome_fantazia || "N/A"}
                          </p>
                          <p>
                            <strong>Nicho:</strong> {lead.nicho || "N/A"}
                          </p>
                          <p>
                            <strong>Produto Marketing:</strong> {lead.produto_marketing || "N/A"}
                          </p>
                          <p>
                            <strong>Tipo Lead:</strong> {lead.tipo_lead || "N/A"}
                          </p>
                          <p>
                            <strong>Canal:</strong> {lead.canal || "N/A"}
                          </p>
                          <p>
                            <strong>Nível Urgência:</strong> {lead.nivel_urgencia || "N/A"}
                          </p>
                          <p>
                            <strong>Faturamento:</strong> {lead.faturamento || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Cargo Contato:</strong> {lead.cargo_contato || "N/A"}
                          </p>
                          <p>
                            <strong>Email Corporativo:</strong> {lead.email_corporativo ? "Sim" : "Não"}
                          </p>
                          <p>
                            <strong>Closer:</strong> {lead.closer || "N/A"}
                          </p>
                          <p>
                            <strong>Arrematador:</strong> {lead.arrematador || "N/A"}
                          </p>
                          <p>
                            <strong>Anúncios:</strong> {lead.anuncios ? "Sim" : "Não"}
                          </p>
                          <p>
                            <strong>Região:</strong> {lead.regiao || "N/A"}
                          </p>
                          <p>
                            <strong>Cidade:</strong> {lead.cidade || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Data Compra:</strong> {lead.data_compra || "N/A"}
                          </p>
                          <p>
                            <strong>Horário Compra:</strong> {lead.horario_compra || "N/A"}
                          </p>
                          <p>
                            <strong>Valor Venda:</strong>{" "}
                            {lead.valor_venda
                              ? `R$ ${lead.valor_venda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : "N/A"}
                          </p>
                          <p>
                            <strong>Venda:</strong> {lead.venda ? "Sim" : "Não"}
                          </p>
                          <p>
                            <strong>Observações:</strong> {lead.observacoes || "N/A"}
                          </p>
                          <p>
                            <strong>Último Contato:</strong> {lead.data_ultimo_contato || "N/A"}
                          </p>
                          <p>
                            <strong>CS:</strong> {lead.cs ? "Sim" : "Não"}
                          </p>
                          <p>
                            <strong>RM:</strong> {lead.rm ? "Sim" : "Não"}
                          </p>
                          <p>
                            <strong>RR:</strong> {lead.rr ? "Sim" : "Não"}
                          </p>
                          <p>
                            <strong>NS:</strong> {lead.ns ? "Sim" : "Não"}
                          </p>
                          <p>
                            <strong>Data Marcação:</strong> {lead.data_marcacao || "N/A"}
                          </p>
                          <p>
                            <strong>Data Reunião:</strong> {lead.data_reuniao || "N/A"}
                          </p>
                          <p>
                            <strong>Data Assinatura:</strong> {lead.data_assinatura || "N/A"}
                          </p>
                          <p>
                            <strong>FEE:</strong>{" "}
                            {lead.fee ? `R$ ${lead.fee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "N/A"}
                          </p>
                          <p>
                            <strong>Escopo Fechado:</strong>{" "}
                            {lead.escopo_fechado_valor
                              ? `R$ ${lead.escopo_fechado_valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : "N/A"}
                          </p>
                          <p>
                            <strong>FEE Total:</strong>{" "}
                            {lead.fee_total
                              ? `R$ ${lead.fee_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : "N/A"}
                          </p>
                          <p>
                            <strong>Criado em:</strong> {new Date(lead.created_at || "").toLocaleString() || "N/A"}
                          </p>
                          <p>
                            <strong>Atualizado em:</strong> {new Date(lead.updated_at || "").toLocaleString() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
