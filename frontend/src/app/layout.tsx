import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KTX - Hệ thống Quản lý Ký túc xá',
  description: 'Hệ thống quản lý ký túc xá sinh viên tích hợp AI Chatbot hỗ trợ 24/7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  )
}
