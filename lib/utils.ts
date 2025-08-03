import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return "R$ 0,00"

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  if (isNaN(numValue)) return "R$ 0,00"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue)
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"

    return new Intl.DateTimeFormat("pt-BR").format(date)
  } catch {
    return "-"
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "-"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch {
    return "-"
  }
}
