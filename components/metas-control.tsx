"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Settings, TrendingUp, Target, Users, Calendar, DollarSign } from "lucide-react"
import type { Lead } from "@/app/page"

interface MetasControlProps {
  leads: Lead[]
}

export function MetasControl({ leads }: MetasControlProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("mes-atual")
  const [metas, setMetas] = useState({
    "100-200k": 0,
    "200-400k": 0,
    "400k-1kk": 0,
    "1-4kk": 0,
    "4-16kk": 0,
    "16-40kk": 0,
  })

  // Load metas from localStorage on component mount
  useEffect(() => {
    const savedMetas = localStorage.getItem("leadsMetas")
    if (savedMetas) {
      setMetas(JSON.parse(savedMetas))
    }
  }, [])

  // Save metas to localStorage whenever they change
  const updateMetas = (newMetas: typeof metas) => {
    setMetas(newMetas)
    localStorage.setItem("leadsMetas", JSON.stringify(newMetas))
  }

  const getFilteredLeads = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return leads.filter((lead) => {
      if (!lead.data_hora_compra) return false

      const leadDate = new Date(lead.data_hora_compra)
      const leadMonth = leadDate.getMonth()
      const leadYear = leadDate.getFullYear()

      switch (selectedPeriod) {
        case "mes-atual":
          return leadMonth === currentMonth && leadYear === currentYear
        case "mes-passado":
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
          return leadMonth === lastMonth && leadYear === lastMonthYear
        case "ultimos-30-dias":
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return leadDate >= thirtyDaysAgo
        case "ultimos-90-dias":
          const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          return leadDate >= ninetyDaysAgo
        default:
          return true
      }
    })
  }

  const getFaturamentoTier = (faturamento: string | null): string => {
    if (!faturamento) return "sem-info"

    const valor = faturamento.toLowerCase()
    if (valor.includes("100") && valor.includes("200")) return "100-200k"
    if (valor.includes("200") && valor.includes("400")) return "200-400k"
    if (valor.includes("400") && (valor.includes("1") || valor.includes("1000"))) return "400k-1kk"
    if (valor.includes("1") && valor.includes("4")) return "1-4kk"
    if (valor.includes("4") && valor.includes("16")) return "4-16kk"
    if (valor.includes("16") && valor.includes("40")) return "16-40kk"

    return "outros"
  }

  const filteredLeads = getFilteredLeads()

  // Calcular leads por tier
  const leadsPorTier = filteredLeads.reduce(
    (acc, lead) => {
      const tier = getFaturamentoTier(lead.faturamento)
      acc[tier] = (acc[tier] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calcular leads por arrematador e tier
  const leadsPorArrematador = filteredLeads.reduce(
    (acc, lead) => {
      const arrematador = lead.arrematador || "sem-arrematador"
      const tier = getFaturamentoTier(lead.faturamento)

      if (!acc[arrematador]) {
        acc[arrematador] = {}
      }
      acc[arrematador][tier] = (acc[arrematador][tier] || 0) + 1
      return acc
    },
    {} as Record<string, Record<string, number>>,
  )

  const tierLabels = {
    "100-200k": "100-200k",
    "200-400k": "200-400k",
    "400k-1kk": "400k-1kk",
    "1-4kk": "1-4kk",
    "4-16kk": "4-16kk",
    "16-40kk": "16-40kk",
  }

  const arrematadores = ["alan", "antonio", "gabrielli", "jasson", "vanessa", "william"]

  const totalLeadsComprados = Object.values(leadsPorTier).reduce((sum, count) => sum + count, 0)
  const totalMeta = Object.values(metas).reduce((sum, meta) => sum + meta, 0)

  const calcularIdealPorDia = (meta: number) => {
    const now = new Date()
    const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return meta > 0 ? (meta / diasNoMes).toFixed(1) : "0"
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Controle de Metas</h1>
              <p className="text-red-100">Meta/Mês Compra de Leads</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Settings className="w-4 h-4 mr-2" />
                  Config
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Configurar Metas Mensais</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {Object.entries(tierLabels).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        type="number"
                        value={metas[key as keyof typeof metas]}
                        onChange={(e) =>
                          updateMetas({
                            ...metas,
                            [key]: Number.parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Meta mensal"
                      />
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Total: {Object.values(metas).reduce((sum, meta) => sum + meta, 0)} leads/mês
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes-atual">Mês Atual</SelectItem>
                <SelectItem value="mes-passado">Mês Passado</SelectItem>
                <SelectItem value="ultimos-30-dias">Últimos 30 Dias</SelectItem>
                <SelectItem value="ultimos-90-dias">Últimos 90 Dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comprado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeadsComprados}</div>
            <p className="text-xs text-muted-foreground">leads no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeta}</div>
            <p className="text-xs text-muted-foreground">leads/mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMeta > 0 ? Math.round((totalLeadsComprados / totalMeta) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">da meta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ideal/Dia</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calcularIdealPorDia(totalMeta)}</div>
            <p className="text-xs text-muted-foreground">leads/dia</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Acompanhamento por Tier de Faturamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Tier de Faturamento</th>
                  <th className="text-center p-3 font-semibold">Meta</th>
                  <th className="text-center p-3 font-semibold">Comprado</th>
                  <th className="text-center p-3 font-semibold">Performance</th>
                  <th className="text-center p-3 font-semibold">Ideal/Dia</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tierLabels).map(([key, label]) => {
                  const meta = metas[key as keyof typeof metas]
                  const comprado = leadsPorTier[key] || 0
                  const performance = meta > 0 ? Math.round((comprado / meta) * 100) : 0
                  const idealPorDia = calcularIdealPorDia(meta)

                  return (
                    <tr key={key} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{label}</td>
                      <td className="p-3 text-center">{meta}</td>
                      <td className="p-3 text-center font-semibold">{comprado}</td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={performance >= 100 ? "default" : performance >= 80 ? "secondary" : "destructive"}
                        >
                          {performance}%
                        </Badge>
                      </td>
                      <td className="p-3 text-center text-sm text-gray-600">{idealPorDia}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights Inteligentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Insights Inteligentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">✅ Pontos Fortes</h4>
              <ul className="text-sm space-y-1">
                {Object.entries(tierLabels).map(([key, label]) => {
                  const meta = metas[key as keyof typeof metas]
                  const comprado = leadsPorTier[key] || 0
                  const performance = meta > 0 ? (comprado / meta) * 100 : 0
                  return performance >= 100 ? (
                    <li key={key} className="text-green-600">
                      • {label}: {Math.round(performance)}% da meta atingida
                    </li>
                  ) : null
                })}
                {Object.entries(tierLabels).every(([key]) => {
                  const meta = metas[key as keyof typeof metas]
                  const comprado = leadsPorTier[key] || 0
                  return meta === 0 || (comprado / meta) * 100 < 100
                }) && <li className="text-gray-500">Configure metas para ver insights</li>}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-red-700">⚠️ Pontos de Atenção</h4>
              <ul className="text-sm space-y-1">
                {Object.entries(tierLabels).map(([key, label]) => {
                  const meta = metas[key as keyof typeof metas]
                  const comprado = leadsPorTier[key] || 0
                  const performance = meta > 0 ? (comprado / meta) * 100 : 0
                  return performance < 80 && meta > 0 ? (
                    <li key={key} className="text-red-600">
                      • {label}: Apenas {Math.round(performance)}% da meta
                    </li>
                  ) : null
                })}
                {Object.entries(tierLabels).every(([key]) => {
                  const meta = metas[key as keyof typeof metas]
                  const comprado = leadsPorTier[key] || 0
                  const performance = meta > 0 ? (comprado / meta) * 100 : 0
                  return performance >= 80 || meta === 0
                }) && <li className="text-gray-500">Todas as metas estão em bom andamento!</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance dos Arrematadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Leads Comprados por Arrematador</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2 font-semibold">Arrematador</th>
                  {Object.values(tierLabels).map((label) => (
                    <th key={label} className="text-center p-2 font-semibold text-xs">
                      {label}
                    </th>
                  ))}
                  <th className="text-center p-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {arrematadores.map((arrematador) => {
                  const arrematadorData = leadsPorArrematador[arrematador] || {}
                  const total = Object.values(arrematadorData).reduce((sum, count) => sum + count, 0)

                  return (
                    <tr key={arrematador} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium capitalize">{arrematador}</td>
                      {Object.keys(tierLabels).map((tier) => (
                        <td key={tier} className="p-2 text-center">
                          {arrematadorData[tier] || 0}
                        </td>
                      ))}
                      <td className="p-2 text-center font-semibold">{total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
