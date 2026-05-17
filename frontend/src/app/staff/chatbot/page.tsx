'use client'

import ChatPanel from '@/components/chat/ChatPanel'

const quickQuestions = [
  'Quy tr\u00ecnh duy\u1ec7t \u0111\u01a1n \u0111\u0103ng k\u00fd ph\u00f2ng?',
  'C\u00e1ch x\u1eed l\u00fd s\u1ef1 c\u1ed1 kh\u1ea9n c\u1ea5p?',
  'Quy tr\u00ecnh b\u00e0n giao ph\u00f2ng?',
  'X\u1eed l\u00fd vi ph\u1ea1m n\u1ed9i quy?',
]

export default function StaffChatbotPage() {
  return (
    <ChatPanel
      quickQuestions={quickQuestions}
    />
  )
}
