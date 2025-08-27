import { createClient } from "@supabase/supabase-js"

// Create a separate client for realtime subscriptions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseRealtime = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export function subscribeLeadsRealtime(onLeadsChange: () => void) {
  const channel = supabaseRealtime
    .channel("realtime:leads")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "leads",
      },
      (payload) => {
        console.log("[v0] Realtime leads change:", payload)
        onLeadsChange()
      },
    )
    .subscribe()

  return () => {
    supabaseRealtime.removeChannel(channel)
  }
}

export function subscribeDashboardRealtime(onDashboardChange: () => void) {
  const channel = supabaseRealtime
    .channel("realtime:dashboard")
    .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (payload) => {
      console.log("[v0] Realtime dashboard leads change:", payload)
      onDashboardChange()
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "metas" }, (payload) => {
      console.log("[v0] Realtime dashboard metas change:", payload)
      onDashboardChange()
    })
    .subscribe()

  return () => supabaseRealtime.removeChannel(channel)
}

export async function updateLeadWithConcurrency(supabase: any, leadId: string, data: any, currentRowVersion: number) {
  const {
    data: updated,
    error,
    count,
  } = await supabase
    .from("leads")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("row_version", currentRowVersion)
    .select("*")
    .single()

  if (error || !updated) {
    console.log("[v0] Conflicting update detected for lead:", leadId)
    throw error ?? new Error("Conflicting update - lead was modified by another user")
  }

  return updated
}
