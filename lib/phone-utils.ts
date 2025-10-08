/**
 * Utilitários para formatação e validação de telefones brasileiros
 */

/**
 * Remove todos os caracteres não numéricos de um telefone
 */
export function unmaskPhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

/**
 * Aplica máscara brasileira em um número de telefone
 * (99) 9999-9999 para 10 dígitos
 * (99) 99999-9999 para 11 dígitos
 */
export function maskPhone(phone: string): string {
  if (!phone) return ""

  const digits = unmaskPhone(phone)

  if (digits.length === 0) return ""

  if (digits.length <= 10) {
    // (99) 9999-9999
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2")
  } else {
    // (99) 99999-9999
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2")
  }
}

/**
 * Valida se um telefone brasileiro é válido (10 ou 11 dígitos)
 */
export function isValidPhone(phone: string): boolean {
  const digits = unmaskPhone(phone)
  return digits.length === 10 || digits.length === 11
}

/**
 * Formata um telefone para exibição com máscara
 * Retorna "—" se vazio
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone || phone.trim() === "") return "—"
  return maskPhone(phone)
}
