import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lead } from "@/lib/supabase-operations"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface DashboardAnalyticsProps {
  leads: Lead[]
}

export function DashboardAnalytics({ leads }: DashboardAnalyticsProps) {
  // Conversion Metrics
  const totalLeads = leads.length
  const leadsWithMeetingScheduled = leads.filter(lead => lead.rm).length
  const leadsWithMeetingHeld = leads.filter(lead => lead.rr).length
  const leadsWithProposalSent = leads.filter(lead => lead.status === "PROPOSTA ENVIADA").length
  const leadsWon = leads.filter(lead => lead.status === "GANHO").length

  const conversionRateMeetingScheduled = totalLeads > 0 ? (leadsWithMeetingScheduled / totalLeads) * 100 : 0
  const conversionRateMeetingHeld = leadsWithMeetingScheduled > 0 ? (leadsWithMeetingHeld / leadsWithMeetingScheduled) * 100 : 0
  const conversionRateProposalSent = leadsWithMeetingHeld > 0 ? (leadsWithProposalSent / leadsWithMeetingHeld) * 100 : 0
  const conversionRateWon = leadsWithProposalSent > 0 ? (leadsWon / leadsWithProposalSent) * 100 : 0

  // Revenue Generation Analysis
  const totalFeeMrr = leads.reduce((sum, lead) => sum + (lead.fee || 0), 0)
  const totalFeeOneTime = leads.reduce((sum, lead) => sum + (lead.escopo_fechado_valor || 0), 0)
  const totalFee = totalFeeMrr + totalFeeOneTime

  // Funnel Data
  const funnelData = [
    { name: "Total Leads", value: totalLeads, fill: "#8884d8" },
    { name: "Reunião Agendada", value: leadsWithMeetingScheduled, fill: "#82ca9d" },
    { name: "Reunião Realizada", value: leadsWithMeetingHeld, fill: "#ffc658" },
    { name: "Proposta Enviada", value: leadsWithProposalSent, fill: "#ff8042" },
    { name: "Ganho", value: leadsWon, fill: "#00c49f" },
  ]

  // Closer Performance Funnel
  const closerPerformance = leads.reduce((acc, lead) => {
    if (lead.closer) {
      acc[lead.closer] = acc[lead.closer] || { total: 0, won: 0 }
      acc[lead.closer].total++
      if (lead.status === "GANHO") {
        acc[lead.closer].won++
      }
    }
    return acc
  }, {} as Record<string, { total: number; won: number }>)

  const closerFunnelData = Object.entries(closerPerformance).map(([closer, data]) => ({
    name: closer,
    "Leads Atribuídos": data.total,
    "Leads Ganhos": data.won,
    "Taxa de Conversão": data.total > 0 ? (data.won / data.total) * 100 : 0,
  })).sort((a, b) => b["Taxa de Conversão"] - a["Taxa de Conversão"])

  const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF1919"];

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold">{conversionRateMeetingScheduled.toFixed(2)}%</p>
              <p className="text-sm text-gray-500">Leads para Reunião Agendada</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold">{conversionRateMeetingHeld.toFixed(2)}%</p>
              <p className="text-sm text-gray-500">Reunião Agendada para Realizada</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold">{conversionRateProposalSent.toFixed(2)}%</p>
              <p className="text-sm text-gray-500">Reunião Realizada para Proposta Enviada</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold">{conversionRateWon.toFixed(2)}%</p>
              <p className="text-sm text-gray-500">Proposta Enviada para Ganho</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Geração de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold">R$ {totalFeeMrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-gray-500">Total FEE MRR</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold">R$ {totalFeeOneTime.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-gray-500">Total FEE ONE TIME</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold">R$ {totalFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-gray-500">Total FEE Geral</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funil de Vendas Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Número de Leads" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance do Closer (Funil)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={closerFunnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => {
                if (name === "Taxa de Conversão") return `${value.toFixed(2)}%`
                return value
              }} />
              <Legend />
              <Bar dataKey="Leads Atribuídos" fill="#8884d8" />
              <Bar dataKey="Leads Ganhos" fill="#82ca9d" />
              <Bar dataKey="Taxa de Conversão" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Status dos Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(leads.reduce((acc, lead) => {
                  acc[lead.status] = (acc[lead.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }))}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {Object.keys(leads.reduce((acc, lead) => {
                  acc[lead.status] = (acc[lead.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
