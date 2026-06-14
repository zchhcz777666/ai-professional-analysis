import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI专业志愿分析 - 全国高校人工智能专业精准匹配',
  description: '基于真实录取数据，精准匹配全国高校人工智能专业，冲稳保三档分层，助你科学填报志愿',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50">
        {children}
      </body>
    </html>
  )
}
