import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toast"
import { ServiceWorkerRegister } from "@/components/sw-register"

export const metadata: Metadata = {
  title: "Conexión - Equipo de Voluntarios",
  description: "Gestión de voluntarios para la iglesia Conexión",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Conexión",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <ToastProvider>
          <ServiceWorkerRegister />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
