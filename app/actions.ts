"use server"

import { supabase } from "@/lib/server-supabase" // Importe o cliente Supabase do servidor

export async function deleteImportedLeads() {
  if (!supabase) {
    return { success: false, message: "Erro: Supabase não configurado no servidor." }
  }

  try {
    // 1. Encontrar o ID da origem 'LeadBroker'
    const { data: originData, error: originError } = await supabase
      .from("origem")
      .select("id")
      .eq("nome", "LeadBroker")
      .maybeSingle()

    if (originError) {
      console.error("Erro ao buscar ID da origem 'LeadBroker':", originError)
      return { success: false, message: "Erro ao buscar ID da origem 'LeadBroker'." }
    }

    if (!originData) {
      console.error("Origem 'LeadBroker' não encontrada na tabela 'origem'.")
      return { success: false, message: "Erro: Origem 'LeadBroker' não encontrada. Certifique-se de que o script 'seed-normalized-data.sql' foi executado." }
    }

    const leadBrokerOriginId = originData.id

    // 2. Obter IDs dos leads associados à origem 'LeadBroker'
    const { data: leadsToDelete, error: leadsError } = await supabase
      .from("lead")
      .select("id, id_contato")
      .eq("id_origem", leadBrokerOriginId)

    if (leadsError) {
      console.error("Erro ao buscar leads para exclusão:", leadsError)
      return { success: false, message: "Erro ao buscar leads para exclusão." }
    }

    const leadIdsToDelete = leadsToDelete.map((l) => l.id)
    const contactIdsToDelete = leadsToDelete.map((l) => l.id_contato).filter(Boolean) as number[] // Filtrar nulos e garantir tipo

    if (leadIdsToDelete.length === 0) {
      return { success: true, message: "Nenhum lead importado encontrado para exclusão." }
    }

    // 3. Apagar registros das tabelas de associação que referenciam os leads importados
    // (Respeitando as chaves estrangeiras)
    const { error: vlError } = await supabase.from("vendedor_lead").delete().in("id_lead", leadIdsToDelete)
    if (vlError) console.error("Erro ao apagar de vendedor_lead:", vlError)

    const { error: lpError } = await supabase.from("lead_produto").delete().in("id_lead", leadIdsToDelete)
    if (lpError) console.error("Erro ao apagar de lead_produto:", lpError)

    const { error: comentarioError } = await supabase.from("comentario").delete().in("id_cliente", leadIdsToDelete)
    if (comentarioError) console.error("Erro ao apagar de comentario:", comentarioError)

    // 4. Apagar os leads da tabela principal 'lead'
    const { error: leadDeleteError } = await supabase.from("lead").delete().in("id", leadIdsToDelete)
    if (leadDeleteError) throw leadDeleteError // Erro crítico, relançar

    // 5. Apagar contatos que estão associados APENAS aos leads 'LeadBroker' que foram apagados
    // Primeiro, obtenha todos os IDs de contato que *ainda* estão ligados a *qualquer* lead (não LeadBroker)
    const { data: remainingLeadContacts, error: remainingContactsError } = await supabase
      .from("lead")
      .select("id_contato")
      .not("id_origem", "eq", leadBrokerOriginId) // Exclui leads que eram LeadBroker
      .not("id", "in", leadIdsToDelete) // Garante que não estamos contando contatos de leads que acabamos de deletar

    if (remainingContactsError) {
      console.error("Erro ao buscar contatos de leads restantes:", remainingContactsError)
      // Continuar sem apagar contatos se isso falhar
    } else {
      const remainingContactIds = new Set(remainingLeadContacts.map((lc) => lc.id_contato).filter(Boolean))
      // Filtra os IDs de contato dos leads deletados que NÃO estão em nenhum lead restante
      const contactsToDeleteExclusively = contactIdsToDelete.filter(
        (contactId) => !remainingContactIds.has(contactId),
      )

      if (contactsToDeleteExclusively.length > 0) {
        const { error: contactDeleteError } = await supabase
          .from("contato")
          .delete()
          .in("id", contactsToDeleteExclusively)
        if (contactDeleteError) console.error("Erro ao apagar contatos exclusivos:", contactDeleteError)
        else console.log(`Apagados ${contactsToDeleteExclusively.length} contatos exclusivos.`)
      }
    }

    console.log(`✅ Excluídos com sucesso ${leadIdsToDelete.length} leads importados e dados relacionados.`)
    return { success: true, message: `Total de ${leadIdsToDelete.length} leads importados e dados relacionados excluídos com sucesso.` }
  } catch (error: any) {
    console.error("❌ Erro durante a exclusão em massa de leads importados:", error)
    return { success: false, message: `Erro ao excluir leads importados: ${error.message}` }
  }
}
