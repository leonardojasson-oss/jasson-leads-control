import { createClient } from "@supabase/supabase-js"
import { normalizePersonName } from "../lib/normalizers"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function backfillNormalizeNames() {
  console.log("[v0] 🔄 Iniciando backfill de normalização de nomes...")

  try {
    // Buscar todos os leads
    const { data: leads, error } = await supabase.from("leads").select("id, closer, sdr, arrematador")

    if (error) {
      console.error("[v0] ❌ Erro ao buscar leads:", error)
      return
    }

    console.log(`[v0] 📊 Total de leads encontrados: ${leads?.length || 0}`)

    let updatedCount = 0
    let errorCount = 0

    // Processar cada lead
    for (const lead of leads || []) {
      const updates: any = {}
      let needsUpdate = false

      // Normalizar closer
      if (lead.closer) {
        const normalized = normalizePersonName(lead.closer)
        if (normalized !== lead.closer) {
          updates.closer = normalized
          needsUpdate = true
          console.log(`[v0] 🔄 Closer: "${lead.closer}" → "${normalized}"`)
        }
      }

      // Normalizar SDR
      if (lead.sdr) {
        const normalized = normalizePersonName(lead.sdr)
        if (normalized !== lead.sdr) {
          updates.sdr = normalized
          needsUpdate = true
          console.log(`[v0] 🔄 SDR: "${lead.sdr}" → "${normalized}"`)
        }
      }

      // Normalizar arrematador
      if (lead.arrematador) {
        const normalized = normalizePersonName(lead.arrematador)
        if (normalized !== lead.arrematador) {
          updates.arrematador = normalized
          needsUpdate = true
          console.log(`[v0] 🔄 Arrematador: "${lead.arrematador}" → "${normalized}"`)
        }
      }

      // Atualizar se necessário
      if (needsUpdate) {
        const { error: updateError } = await supabase.from("leads").update(updates).eq("id", lead.id)

        if (updateError) {
          console.error(`[v0] ❌ Erro ao atualizar lead ${lead.id}:`, updateError)
          errorCount++
        } else {
          updatedCount++
        }
      }
    }

    console.log(`[v0] ✅ Backfill concluído!`)
    console.log(`[v0] 📊 Leads atualizados: ${updatedCount}`)
    console.log(`[v0] ❌ Erros: ${errorCount}`)
  } catch (error) {
    console.error("[v0] ❌ Erro durante backfill:", error)
  }
}

backfillNormalizeNames()
