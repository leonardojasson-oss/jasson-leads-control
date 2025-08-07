import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lead } from "@/lib/supabase-operations"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CommissionControlProps {
  leads: Lead[]
}

export function CommissionControl({ leads }: CommissionControlProps) {
  // Calculate commissions by closer
  const commissionsByCloser = leads.reduce((acc, lead) => {
    if (lead.closer && lead.fee_total) {
      acc[lead.closer] = (acc[lead.closer] || 0) + lead.fee_total
    }
    return acc
  }, {} as Record<string, number>)

  const closerCommissionData = Object.entries(commissionsByCloser)
    .map(([closer, totalCommission]) => ({
      closer,
      "Comissão Total": totalCommission,
    }))
    .sort((a, b) => b["Comissão Total"] - a["Comissão Total"])

  // Calculate commissions by SDR
  const commissionsBySDR = leads.reduce((acc, lead) => {
    if (lead.sdr && lead.fee_total) {
      acc[lead.sdr] = (acc[lead.sdr] || 0) + lead.fee_total
    }
    return acc
  }, {} as Record<string, number>)

  const sdrCommissionData = Object.entries(commissionsBySDR)
    .map(([sdr, totalCommission]) => ({
      sdr,
      "Comissão Total": totalCommission,
    }))
    .sort((a, b) => b["Comissão Total"] - a["Comissão Total"])

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Comissões por Closer</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Closer</TableHead>
                <TableHead className="text-right">Comissão Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closerCommissionData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-gray-500">
                    Nenhuma comissão para Closers.
                  </TableCell>
                </TableRow>
              ) : (
                closerCommissionData.map((data) => (
                  <TableRow key={data.closer}>
                    <TableCell className="font-medium">{data.closer}</TableCell>
                    <TableCell className="text-right">
                      R$ {data["Comissão Total"].toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comissões por SDR</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SDR</TableHead>
                <TableHead className="text-right">Comissão Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdrCommissionData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-gray-500">
                    Nenhuma comissão para SDRs.
                  </TableCell>
                </TableRow>
              ) : (
                sdrCommissionData.map((data) => (
                  <TableRow key={data.sdr}>
                    <TableCell className="font-medium">{data.sdr}</TableCell>
                    <TableCell className="text-right">
                      R$ {data["Comissão Total"].toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
