"use client"

import { useEffect, useRef } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured, leadOperations, type Lead } from "@/lib/supabase-operations"

type Params =
  | {
      getLeads?: () => Lead[]
      setLeads?: (updater: (prev: Lead[]) => Lead[]) => void
      // compat c/ versão antiga:
      selectFn?: () => Lead[]
      mergeFn?: (updater: (prev: Lead[]) => Lead[]) => void
    }
  | undefined

/**
 * Realtime (canal único) + buffer/throttle 1s + fallback polling 1s + lock local 1,5s
 * Compatível com props novas (getLeads/setLeads) E antigas (selectFn/mergeFn).
 * Resiliente a erros de rede (sem logs ruidosos) e sem loops de render.
 */
export function useRealtimeLeadsSync(params?: Params) {
  // refs para funções passadas por props (com fallbacks seguros)
  const getRef = useRef<() => Lead[]>(() => [])
  const setRef = useRef<(updater: (prev: Lead[]) => Lead[]) => void>(() => {})

  useEffect(() => {
    const getLeads = params?.getLeads ?? params?.selectFn
    const setLeads = params?.setLeads ?? params?.mergeFn
    if (typeof getLeads === "function") getRef.current = getLeads
    if (typeof setLeads === "function") {
      // Para compatibilidade com mergeFn (API antiga), adaptar para nova API
      if (params?.mergeFn && !params?.setLeads) {
        setRef.current = (updater) => {
          const changes = new Map<string, Partial<Lead>>()
          const currentLeads = getRef.current()
          const newLeads = updater(currentLeads)

          // Detectar mudanças entre arrays
          newLeads.forEach((newLead) => {
            const oldLead = currentLeads.find((l) => l.id === newLead.id)
            if (!oldLead) {
              changes.set(newLead.id, newLead)
            } else {
              const diff: Partial<Lead> = {}
              let hasChanges = false
              Object.keys(newLead).forEach((key) => {
                if ((newLead as any)[key] !== (oldLead as any)[key]) {
                  ;(diff as any)[key] = (newLead as any)[key]
                  hasChanges = true
                }
              })
              if (hasChanges) {
                changes.set(newLead.id, diff)
              }
            }
          })

          if (changes.size > 0) {
            params.mergeFn!(changes)
          }
        }
      } else {
        setRef.current = setLeads
      }
    }
  }, [params?.getLeads, params?.selectFn, params?.setLeads, params?.mergeFn])

  const channelRef = useRef<RealtimeChannel | null>(null)
  const bufferRef = useRef<Map<string, Lead>>(new Map())
  const lastSeenRef = useRef<string | null>(null) // maior updated_at/created_at visto
  const connectedRef = useRef(false)
  const localLocksRef = useRef<Map<string, number>>(new Map()) // id -> expiresAt(ms)

  /** Trava um lead local por 1.5s após salvar p/ evitar "piscar" */
  const lockLeadDuringLocalSave = (id: string) => {
    localLocksRef.current.set(id, Date.now() + 1500)
  }

  // Aplica o buffer no máx. 1x/seg (throttle)
  useEffect(() => {
    const flush = setInterval(() => {
      if (bufferRef.current.size === 0) return
      const changes = Array.from(bufferRef.current.values())
      bufferRef.current.clear()

      setRef.current((prev) => {
        if (!changes.length) return prev
        const byId = new Map(prev.map((l) => [l.id, l]))
        let changed = false

        for (const remote of changes) {
          const lock = localLocksRef.current.get(remote.id) ?? 0
          if (Date.now() < lock) continue

          const current = byId.get(remote.id)
          if (!current) {
            byId.set(remote.id, remote)
            changed = true
            continue
          }

          const localTs = current.updated_at ?? current.created_at ?? ""
          const remoteTs = remote.updated_at ?? remote.created_at ?? ""
          if (remoteTs && localTs && remoteTs <= localTs) continue

          byId.set(remote.id, { ...current, ...remote })
          changed = true
        }

        if (!changed) return prev
        return Array.from(byId.values())
      })
    }, 1000)
    return () => clearInterval(flush)
  }, [])

  // Polling resiliente (1s) — pausa se canal conectado/aba oculta/offline
  useEffect(() => {
    let inFlight = false
    let abort: AbortController | null = null

    const poll = async () => {
      try {
        if (connectedRef.current) return
        if (typeof document !== "undefined" && document.visibilityState !== "visible") return
        if (typeof navigator !== "undefined" && "onLine" in navigator && !navigator.onLine) return
        if (inFlight) return

        inFlight = true
        if (abort) abort.abort()
        abort = new AbortController()

        // tentativa incremental via Supabase
        if (isSupabaseConfigured && supabase) {
          const last = lastSeenRef.current
          let q = supabase.from("leads").select("*")
          if (last) q = q.gte("updated_at", last)
          const { data, error } = await q.order("updated_at", { ascending: false }).limit(200).abortSignal(abort.signal)

          if (!error && data && data.length) {
            for (const r of data) {
              bufferRef.current.set(r.id, r)
              const ts = r.updated_at ?? r.created_at
              if (ts && (!lastSeenRef.current || ts > lastSeenRef.current)) lastSeenRef.current = ts
            }
            inFlight = false
            return
          }
          // se erro, cai no fallback silencioso abaixo
        }

        // fallback: usa fonte padrão + comparação rasa
        const remoteAll = await leadOperations.getAll()
        const local = getRef.current()
        const localById = new Map(local.map((l) => [l.id, l]))
        const remoteById = new Map(remoteAll.map((l) => [l.id, l]))

        const changed: Lead[] = []
        for (const [id, r] of remoteById) {
          const curr = localById.get(id)
          if (!curr) {
            changed.push(r)
            continue
          }
          const lt = curr.updated_at ?? curr.created_at ?? ""
          const rt = r.updated_at ?? r.created_at ?? ""
          if (rt && lt && rt > lt) {
            changed.push(r)
            continue
          }
          let diff = false
          for (const k in r) {
            // @ts-ignore
            if (r[k] !== (curr as any)[k]) {
              diff = true
              break
            }
          }
          if (diff) changed.push(r)
        }

        if (changed.length) {
          for (const r of changed) {
            bufferRef.current.set(r.id, r)
            const ts = r.updated_at ?? r.created_at
            if (ts && (!lastSeenRef.current || ts > lastSeenRef.current)) lastSeenRef.current = ts
          }
        }
      } catch {
        // silencioso
      } finally {
        inFlight = false
      }
    }

    const id = setInterval(poll, 1000)
    return () => {
      clearInterval(id)
      if (abort) abort.abort()
    }
  }, [])

  // Canal realtime único e estável (sem logs no callback)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    if (channelRef.current) return

    const ch = supabase
      .channel("leads:realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (payload: any) => {
        const row = payload.eventType === "DELETE" ? null : (payload.new as Lead | null)
        if (row) {
          bufferRef.current.set(row.id, row)
          const ts = row.updated_at ?? row.created_at
          if (ts && (!lastSeenRef.current || ts > lastSeenRef.current)) lastSeenRef.current = ts
        } else if (payload.old?.id) {
          bufferRef.current.set(payload.old.id as string, { id: payload.old.id, status: "REMOVIDO" } as any)
        }
      })

    ch.subscribe((status) => {
      connectedRef.current = status === "SUBSCRIBED"
      if (typeof window !== "undefined") {
        console.debug("[realtime] status:", status, "channels:", (supabase as any)?.getChannels?.()?.length)
      }
    })

    channelRef.current = ch
    return () => {
      try {
        if (channelRef.current) supabase.removeChannel(channelRef.current)
      } finally {
        channelRef.current = null
        connectedRef.current = false
      }
    }
  }, [])

  return { lockLeadDuringLocalSave }
}
