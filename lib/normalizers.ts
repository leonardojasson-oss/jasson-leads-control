const OFFICIAL_NAMES = [
  "Leonardo",
  "Alan",
  "Antonio",
  "Marcelo",
  "Gibran",
  "Giselle",
  "Guilherme",
  "Vinícius",
  "Francisco",
  "Matriz",
]

const OFFICIAL_LOOKUP = new Map(OFFICIAL_NAMES.map((n) => [n.toLocaleLowerCase("pt-BR"), n]))

/**
 * Converte string para Title Case usando locale pt-BR
 * @param s - String a ser convertida
 * @returns String em Title Case
 */
function toTitleCaseBR(s: string): string {
  return s
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((w) => w.charAt(0).toLocaleUpperCase("pt-BR") + w.slice(1))
    .join(" ")
}

/**
 * Normaliza nomes de pessoas do comercial (Closers, SDRs, Arrematadores)
 * para a grafia oficial padronizada em Title Case.
 *
 * @param input - Nome a ser normalizado
 * @returns Nome normalizado na grafia oficial ou em Title Case se não encontrado
 */
export function normalizePersonName(input?: string | null): string {
  if (!input) return ""

  const lowerInput = input.trim().toLocaleLowerCase("pt-BR")
  if (lowerInput === "vinicius") return "Vinícius"

  const t = toTitleCaseBR(input)

  // Verificar se existe na lista oficial
  const mapped = OFFICIAL_LOOKUP.get(t.toLocaleLowerCase("pt-BR"))
  return mapped ?? t
}

/**
 * Normaliza um array de nomes para UI (dropdowns, filtros, etc.)
 * Remove duplicatas e mapeia para grafia oficial
 *
 * @param names - Array de nomes a serem normalizados
 * @returns Array de nomes únicos e normalizados, ordenados alfabeticamente
 */
export function normalizeNamesForUI(names: (string | null | undefined)[]): string[] {
  const normalized = Array.from(new Set(names.map((n) => normalizePersonName(n)).filter(Boolean)))

  return normalized
    .map((n) => OFFICIAL_NAMES.find((o) => o.toLowerCase() === n.toLowerCase()) ?? n)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
}

/**
 * Lista oficial de nomes padronizados
 */
export { OFFICIAL_NAMES }

/**
 * Normaliza uma string para uso como chave de comparação (key).
 * Remove acentos, converte para lowercase e normaliza espaços.
 * Reproduz a lógica do SQL normalize_key do Supabase.
 *
 * @param s - String a ser normalizada
 * @returns String normalizada para uso como chave
 */
export function normalizeKey(s: string): string {
  if (!s) return ""
  // Remove diacríticos (acentos)
  const noDiacritics = s.normalize("NFD").replace(/\p{Diacritic}/gu, "")
  // Normaliza espaços e converte para lowercase
  return noDiacritics.replace(/\s+/g, " ").trim().toLowerCase()
}
