'use client'

import ChatPanel from '@/components/chat/ChatPanel'

const quickQuestions = [
  'H\u00f3a \u0111\u01a1n th\u00e1ng n\u00e0y l\u00e0 bao nhi\u00eau?',
  'Gi\u1edd m\u1edf c\u1eeda KTX l\u00e0 g\u00ec?',
  'C\u00e1ch \u0111\u0103ng k\u00fd ph\u00f2ng?',
  'Quy \u0111\u1ecbnh v\u1ec1 kh\u00e1ch \u0111\u1ebfn th\u0103m?',
]

export default function StudentChatbotPage() {
  return (
    <ChatPanel
      quickQuestions={quickQuestions}
    />
  )
}
