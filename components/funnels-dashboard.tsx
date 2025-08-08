"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { type Lead } from "@/lib/supabase-operations"
import { BarChart3, Users } from 'lucide-react'

type StageCounts = {
  leads: number
  contato: number
  agendada: number
  realizada: number
  vendas: number
}

type Revenue = {
  mrr: number
  oneTime: number
  total: number
}

function formatBRL(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function pct(num: number, den: number) {
  if (den <= 0) return "0.0%"
  return `${((num / den) * 100).toFixed(1)}%`
}

function calcStages(leads: Lead[]): StageCounts {
  const leadsCount = leads.length
  const contato = leads.filter((l) => !!l.cs).length
  const agendada = leads.filter((l) => !!l.rm).length
  const realizada = leads.filter((l) => !!l.rr).length
  const vendas = leads.filter((l) => ["GANHO", "CONTRATO ASSINADO"].includes((l.status || "").toUpperCase())).length
  return { leads: leadsCount, contato, agendada, realizada, vendas }
}

function calcRevenue(leads: Lead[]): Revenue {
  const mrr = leads.reduce((s, l) => s + (Number(l.fee) || 0), 0)
  const oneTime = leads.reduce((s, l) => s + (Number(l.escopo_fechado_valor) || 0), 0)
  return { mrr, oneTime, total: mrr + oneTime }
}

function StageRow({
  label,
  value,
  percent,
  color,
}: {
  label: string
  value: number
  percent: number
  color: string
}) {
  // width proporcional ao percentual de leads
  const width = Math.max(8, Math.round(percent)) // largura mínima pra visualização
  return (
    <div className="relative my-1">
      <div className={`h-10 rounded-md ${color}`} style={{ width: `${width}%` }}>
        <div className="h-full w-full flex items-center justify-center text-white font-bold drop-shadow-sm">
          <span className="text-sm">{value}</span>
        </div>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{`${percent.toFixed(1)}%`}</Badge>
      </div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white/90 drop-shadow">{label}</div>
    </div>
  )
}

function Conversions({ s }: { s: StageCounts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <div className="rounded-md border bg-green-50">
        <div className="text-xs px-3 py-2 font-semibold text-green-800">📊 Conversões entre Etapas</div>
        <div className="px-3 pb-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-700">Lead → Contato:</span>
            <span className="font-semibold text-blue-600">{pct(s.contato, s.leads)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Contato → Agendada:</span>
            <span className="font-semibold text-green-600">{pct(s.agendada, s.contato)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Agendada → Realizada:</span>
            <span className="font-semibold text-amber-600">{pct(s.realizada, s.agendada)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Realizada → Venda:</span>
            <span className="font-semibold text-rose-600">{pct(s.vendas, s.realizada)}</span>
          </div>
        </div>
      </div>
      <div className="rounded-md border bg-blue-50">
        <div className="text-xs px-3 py-2 font-semibold text-blue-800">💰 Receita Gerada</div>
        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          <div className="rounded-md bg-white border p-3">
            <div className="text-xs text-gray-600">FEE MRR (Recorrente)</div>
            <div className="font-bold text-green-700">{formatBRL((s as any)._mrr || 0)}</div>
          </div>
          <div className="rounded-md bg-white border p-3">
            <div className="text-xs text-gray-600">FEE ONE TIME (Escopo)</div>
            <div className="font-bold text-blue-700">{formatBRL((s as any)._oneTime || 0)}</div>
          </div>
          <div className="col-span-2 text-xs text-gray-600 px-1">Total: <span className="font-semibold text-gray-900">{formatBRL((s as any)._total || 0)}</span></div>
        </div>
      </div>
    </div>
  )
}

function FunnelCard({
  title,
  leads,
}: {
  title: string
  leads: Lead[]
}) {
  const stages = useMemo(() => calcStages(leads), [leads])
  const revenue = useMemo(() => calcRevenue(leads), [leads])
  // acopla valores de receita no objeto stages para reaproveitar Conversions
  ;(stages as any)._mrr = revenue.mrr
  ;(stages as any)._oneTime = revenue.oneTime
  ;(stages as any)._total = revenue.total

  const total = Math.max(1, stages.leads)
  const colors = [
    "bg-cyan-500",
    "bg-teal-500",
    "bg-lime-500",
    "bg-orange-500",
    "bg-rose-500",
  ]
  const rightPerc = [
    (stages.leads / total) * 100,
    (stages.contato / total) * 100,
    (stages.agendada / total) * 100,
    (stages.realizada / total) * 100,
    (stages.vendas / total) * 100,
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-center">{title}</CardTitle>
        <div className="text-center text-xs text-gray-500">
          {stages.leads} {stages.leads === 1 ? "lead" : "leads"} • Funil de Conversão
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="px-2">
          <StageRow label="Leads" value={stages.leads} percent={rightPerc[0]} color={colors[0]} />
          <StageRow label="Contato" value={stages.contato} percent={rightPerc[1]} color={colors[1]} />
          <StageRow label="Agendada" value={stages.agendada} percent={rightPerc[2]} color={colors[2]} />
          <StageRow label="Realizada" value={stages.realizada} percent={rightPerc[3]} color={colors[3]} />
          <StageRow label="Vendas" value={stages.vendas} percent={rightPerc[4]} color={colors[4]} />
        </div>
        <Conversions s={stages} />
      </CardContent>
    </Card>
  )
}

function FunnelOverview({ leads }: { leads: Lead[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <span>🍥 Funil Geral</span>
        </CardTitle>
        <div className="text-center text-xs text-gray-500">
          {leads.length} {leads.length === 1 ? "lead" : "leads"} • Funil de Conversão
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="px-2">
          <FunnelBars leads={leads} />
        </div>
        <OverviewBottom leads={leads} />
      </CardContent>
    </Card>
  )
}

function FunnelBars({ leads }: { leads: Lead[] }) {
  const s = useMemo(() => calcStages(leads), [leads])
  const total = Math.max(1, s.leads)
  const colors = ["bg-cyan-500","bg-teal-500","bg-lime-500","bg-orange-500","bg-rose-500"]
  const labels = ["Leads","Contato","Agendada","Realizada","Vendas"]
  const values = [s.leads, s.contato, s.agendada, s.realizada, s.vendas]
  const perc = values.map(v => (v / total) * 100)

  return (
    <div>
      {values.map((v, i) => (
        <StageRow key={i} label={labels[i]} value={v} percent={perc[i]} color={colors[i]} />
      ))}
    </div>
  )
}

function OverviewBottom({ leads }: { leads: Lead[] }) {
  const s = useMemo(() => calcStages(leads), [leads])
  const r = useMemo(() => calcRevenue(leads), [leads])
  ;(s as any)._mrr = r.mrr
  ;(s as any)._oneTime = r.oneTime
  ;(s as any)._total = r.total

  return <Conversions s={s} />
}

function ClosersFunnels({ leads }: { leads: Lead[] }) {
  // agrupar por closer (inclui "Sem closer" quando vazio)
  const byCloser = useMemo(() => {
    const map = new Map<string, Lead[]>()
    leads.forEach(l => {
      const key = (l.closer && l.closer.trim()) ? l.closer.trim() : "Sem closer"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(l)
    })
    // somente closers com pelo menos 1 lead
    return Array.from(map.entries()).filter(([, arr]) => arr.length > 0).sort((a,b) => a[0].localeCompare(b[0]))
  }, [leads])

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-700" />
        Funis por Closer
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {byCloser.map(([closer, arr]) => (
          <FunnelCard key={closer} title={closer} leads={arr} />
        ))}
      </div>
    </div>
  )
}

function ComparativeTable({ leads }: { leads: Lead[] }) {
  const rows = useMemo(() => {
    const groups = new Map<string, Lead[]>()
    leads.forEach((l) => {
      const key = (l.closer && l.closer.trim()) ? l.closer.trim() : "Sem closer"
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(l)
    })
    return Array.from(groups.entries()).map(([closer, arr]) => {
      const s = calcStages(arr)
      const r = calcRevenue(arr)
      const taxa = s.leads > 0 ? (s.vendas / s.leads) * 100 : 0
      return {
        closer,
        ...s,
        mrr: r.mrr,
        oneTime: r.oneTime,
        taxa,
      }
    }).sort((a,b) => a.closer.localeCompare(b.closer))
  }, [leads])

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-700" />
          Comparativo de Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Closer</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Agendadas</TableHead>
              <TableHead>Realizadas</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>FEE MRR</TableHead>
              <TableHead>FEE ONE TIME</TableHead>
              <TableHead>Taxa Conversão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.closer}>
                <TableCell className="font-medium">{r.closer}</TableCell>
                <TableCell>{r.leads}</TableCell>
                <TableCell>{r.contato} <span className="text-[10px] text-gray-500">({pct(r.contato, r.leads)})</span></TableCell>
                <TableCell>{r.agendada} <span className="text-[10px] text-gray-500">({pct(r.agendada, r.contato)})</span></TableCell>
                <TableCell>{r.realizada} <span className="text-[10px] text-gray-500">({pct(r.realizada, r.agendada)})</span></TableCell>
                <TableCell>{r.vendas}</TableCell>
                <TableCell className="text-green-700">{formatBRL(r.mrr)}</TableCell>
                <TableCell className="text-blue-700">{formatBRL(r.oneTime)}</TableCell>
                <TableCell>
                  <Badge className="bg-rose-50 text-rose-600 border border-rose-200">{`${r.taxa.toFixed(1)}%`}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500">Sem dados para comparar.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function FunnelsDashboard({ leads }: { leads: Lead[] }) {
  return (
    <div className="grid gap-6">
      <FunnelOverview leads={leads} />
      <ClosersFunnels leads={leads} />
      <ComparativeTable leads={leads} />
    </div>
  )
}
