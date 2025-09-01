"use client"

import { useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase-operations"
import type { Lead } from "@/app/page"

interface UseRealtimeLeadsSyncProps {
  selectFn: () => Lead[]
  mergeFn: (changes: Map<string, Partial<Lead>>) => void
}

export function useRealtimeLeadsSync({ selectFn, mergeFn }: UseRealtimeLeadsSyncProps) {
  const channelRef = useRef<any>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const batchIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const changesBufferRef = useRef<Map<string, Partial<Lead>>>(new Map())
  const lastSyncTimeRef = useRef<string>(new Date().toISOString())
  const localEditLocksRef = useRef<Map<string, Map<string, number>>>(new Map())
  const realtimeDisabledRef = useRef<boolean>(false)
  const realtimeFailureCountRef = useRef<number>(0)

  const setLocalEditLock = (leadId: string, field: string, durationMs = 1500) => {
    if (!localEditLocksRef.current.has(leadId)) {
      localEditLocksRef.current.set(leadId, new Map())
    }
    const leadLocks = localEditLocksRef.current.get(leadId)!
    leadLocks.set(field, Date.now() + durationMs)
  }

  const isFieldLocked = (leadId: string, field: string): boolean => {
    const leadLocks = localEditLocksRef.current.get(leadId)
    if (!leadLocks) return false
    const lockExpiry = leadLocks.get(field)
    if (!lockExpiry) return false
    if (Date.now() > lockExpiry) {
      leadLocks.delete(field)
      return false
    }
    return true
  }

  const processBatchedChanges = useCallback(() => {
    if (changesBufferRef.current.size === 0) return

    const currentLeads = selectFn()
    const filteredChanges = new Map<string, Partial<Lead>>()

    // Filtrar mudanças aplicando locks e validação de updated_at
    changesBufferRef.current.forEach((change, leadId) => {
      const currentLead = currentLeads.find((l) => l.id === leadId)
      if (!currentLead) {
        // Lead novo ou deletado, aplicar mudança completa
        filteredChanges.set(leadId, change)
        return
      }

      const filteredChange: Partial<Lead> = {}
      let hasValidChanges = false

      Object.entries(change).forEach(([field, value]) => {
        // Verificar se campo está sob lock local
        if (isFieldLocked(leadId, field)) {
          return // Pular campo locked
        }

        // Verificar updated_at para evitar aplicar mudanças antigas
        if (change.updated_at && currentLead.updated_at) {
          const changeTime = new Date(change.updated_at).getTime()
          const currentTime = new Date(currentLead.updated_at).getTime()
          if (changeTime <= currentTime) {
            return // Pular mudança mais antiga
          }
        }

        filteredChange[field as keyof Lead] = value
        hasValidChanges = true
      })

      if (hasValidChanges) {
        filteredChanges.set(leadId, filteredChange)
      }
    })

    // Aplicar mudanças filtradas se houver alguma
    if (filteredChanges.size > 0) {
      console.log("[v0] Aplicando", filteredChanges.size, "mudanças em batch")
      mergeFn(filteredChanges)
    }

    // Limpar buffer
    changesBufferRef.current.clear()
  }, [selectFn, mergeFn])

  const markFieldAsEditing = useCallback((leadId: string, field: string) => {
    setLocalEditLock(leadId, field, 1500)
  }, [])

  useEffect(() => {
    if (!supabase) {
      console.log("[v0] Supabase não configurado, sincronização desabilitada")
      return
    }

    console.log("[v0] Configurando sincronização apenas com polling...")

    // Setup polling
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from("leads")
            .select("*")
            .gte("updated_at", lastSyncTimeRef.current)
            .order("updated_at", { ascending: true })
            .limit(50)

          if (error) {
            console.error("[v0] Erro no polling:", error)
            return
          }

          if (data && data.length > 0) {
            console.log("[v0] Polling encontrou", data.length, "mudanças")

            // Acumular mudanças no buffer
            data.forEach((lead) => {
              changesBufferRef.current.set(lead.id, lead as Partial<Lead>)
            })

            // Atualizar último sync time
            const latestTime = Math.max(...data.map((l) => new Date(l.updated_at).getTime()))
            lastSyncTimeRef.current = new Date(latestTime + 1).toISOString()
          }
        } catch (error) {
          console.error("[v0] Exceção no polling:", error)
        }
      }, 3000) // Aumentar intervalo para 3s para reduzir carga
    }

    // Setup batch processing
    if (!batchIntervalRef.current) {
      batchIntervalRef.current = setInterval(() => {
        processBatchedChanges()
      }, 1000)
    }

    // Cleanup
    return () => {
      console.log("[v0] Limpando sincronização...")

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }

      if (batchIntervalRef.current) {
        clearInterval(batchIntervalRef.current)
        batchIntervalRef.current = null
      }

      changesBufferRef.current.clear()
      localEditLocksRef.current.clear()
    }
  }, []) // Remover todas as dependências para evitar re-execuções

  return {
    markFieldAsEditing,
  }
}
