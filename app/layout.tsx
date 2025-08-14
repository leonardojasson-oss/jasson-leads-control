import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Controle de Leads - Jasson Oliveira & Co",
  description: "Sistema de gerenciamento comercial e controle de leads",
  keywords: "leads, vendas, CRM, gestão comercial",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
