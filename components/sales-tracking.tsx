import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lead } from "@/lib/supabase-operations"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface SalesTrackingProps {
  leads: Lead[]
}

export function SalesTracking({ leads }: SalesTrackingProps) {
  // Calculate sales by month
  const salesByMonth = leads.reduce((acc, lead) => {
    if (lead.venda && lead.data_assinatura && lead.valor_venda) {
      const date = new Date(lead.data_assinatura)
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`
      acc[monthYear] = (acc[monthYear] || 0) + lead.valor_venda
    }
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(salesByMonth)
    .map(([monthYear, totalSales]) => ({
      month: monthYear,
      "Total Vendas": totalSales,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Calculate sales by closer
  const salesByCloser = leads.reduce((acc, lead) => {
    if (lead.venda && lead.closer && lead.valor_venda) {
      acc[lead.closer] = (acc[lead.closer] || 0) + lead.valor_venda
    }
    return acc
  }, {} as Record<string, number>)

  const closerChartData = Object.entries(salesByCloser)
    .map(([closer, totalSales]) => ({
      closer,
      "Vendas por Closer": totalSales,
    }))
    .sort((a, b) => b["Vendas por Closer"] - a["Vendas por Closer"])

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="Total Vendas" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendas por Closer</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={closerChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="closer" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="Vendas por Closer" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
