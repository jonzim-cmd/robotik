import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Robotik',
  description: 'Robotik-Tool für Unterricht und mehr',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body>{children}</body>
    </html>
  )
}
