'use client'

import ChatPanel from '@/components/chat/ChatPanel'

const quickQuestions = [
  'T\u00ecnh h\u00ecnh doanh thu th\u00e1ng n\u00e0y?',
  'C\u00f4ng su\u1ea5t KTX hi\u1ec7n t\u1ea1i?',
  'Ch\u00ednh s\u00e1ch gi\u00e1 ph\u00f2ng?',
  'B\u00e1o c\u00e1o \u0111\u1ecbnh k\u1ef3?',
]

export default function DirectorChatbotPage() {
  return (
    <ChatPanel
      quickQuestions={quickQuestions}
    />
  )
}
