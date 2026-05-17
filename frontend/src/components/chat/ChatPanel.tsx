'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Button } from '@/components/ui/Button'
import {
  Send,
  User,
  Sparkles,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  MessageCircle,
  Square,
  Loader2,
  History,
  FileText,
  GraduationCap,
  HelpCircle,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: { title: string; similarity?: string }[]
  createdAt: string | Date
}

interface ChatSession {
  id: string
  title: string
  createdAt: string
  messages?: ChatMessage[]
  _count?: { messages: number }
}

interface ChatPanelProps {
  quickQuestions: string[]
  greetingTitle?: string
  greetingDescription?: string
}

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
}

/**
 * Chỉ hiển thị khi stream kết thúc mà thật sự không có ký tự nào.
 * Không dùng giọng “ngoài phạm vi KTX” — tránh flash gây bỏ cuộc khi model/RAG đang trả lời đúng sau vài giây.
 */
const ASSISTANT_EMPTY_FALLBACK_VI =
  'Chưa nhận được nội dung trả lời. Hãy **thử gửi lại** hoặc hỏi ngắn gọn hơn — câu hỏi tổng quan đôi khi cần vài giây để soạn.'

const SESSION_ICONS = [FileText, GraduationCap, HelpCircle, MessageCircle] as const

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

function formatSessionDate(iso: string | Date) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

/** Split SSE buffer into complete event blocks (terminated by blank line). */
function popSseEvents(buffer: string): { rest: string; events: Array<{ type: string; data: string }> } {
  const events: Array<{ type: string; data: string }> = []
  let rest = buffer
  while (true) {
    const sep = rest.indexOf('\n\n')
    if (sep === -1) break
    const block = rest.slice(0, sep)
    rest = rest.slice(sep + 2)
    let eventType = ''
    let data = ''
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) eventType = line.slice(6).trim()
      else if (line.startsWith('data:')) data = line.slice(5).trimStart()
    }
    if (eventType) events.push({ type: eventType, data })
  }
  return { rest, events }
}

/** react-markdown ignores raw HTML; LLMs often emit `<br>` — turn into real line breaks + remark-breaks for `\n`. */
function normalizeAssistantMarkdown(raw: string) {
  return raw.replace(/<br\s*\/?>/gi, '\n')
}

function AssistantMarkdown({ content }: { content: string }) {
  const md = normalizeAssistantMarkdown(content)
  return (
    <div
      className="overflow-x-auto max-w-full prose prose-sm max-w-none text-navy-800 font-body leading-relaxed
        prose-headings:font-sans prose-headings:text-navy-900 prose-headings:font-semibold
        prose-p:my-2.5 prose-p:text-[15px] prose-p:leading-[1.65]
        prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-li:leading-relaxed
        prose-strong:text-navy-900
        prose-code:text-primary-700 prose-code:bg-primary-50/90 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-navy-900 prose-pre:text-surface-50 prose-pre:rounded-xl prose-pre:text-[13px]
        prose-blockquote:border-l-primary-400 prose-blockquote:text-navy-600
        prose-table:text-[13px] prose-th:border prose-th:border-surface-300 prose-th:bg-surface-100 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-td:border prose-td:border-surface-300 prose-td:px-3 prose-td:py-2
        prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="break-all">
              {children}
            </a>
          ),
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  )
}

export default function ChatPanel({
  quickQuestions,
  greetingTitle,
  greetingDescription,
}: ChatPanelProps) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [creatingSession, setCreatingSession] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  /** Tránh race React batch: `done` đọc `prev` trước khi state cập nhật hết chunk cuối → ref là nguồn đúng. */
  const streamAccRef = useRef('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    void fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true)
      const res = await api.get('/chatbot/sessions', { params: { limit: 20 } })
      setSessions(asArray<ChatSession>(res.data.data))
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  const createNewSession = async () => {
    setCreatingSession(true)
    try {
      const res = await api.post('/chatbot/sessions', {})
      const newSession = res.data.data
      setSessions(prev => [newSession, ...prev])
      setActiveSessionId(newSession.id)
      setMessages([])
    } catch (err) {
      console.error('Failed to create session:', err)
    } finally {
      setCreatingSession(false)
    }
  }

  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId)
    setMessages([])
    try {
      const res = await api.get(`/chatbot/sessions/${sessionId}`)
      const session = res.data.data
      const sessionMessages = asArray<any>(session?.messages)
      if (sessionMessages.length) {
        setMessages(
          sessionMessages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: asArray<{ title: string; similarity?: string }>(m.sources),
            createdAt: m.createdAt,
          }))
        )
      }
    } catch (err) {
      console.error('Failed to load session:', err)
    }
  }

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.delete(`/chatbot/sessions/${sessionId}`)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const messageContent = input
    setInput('')
    setLoading(true)
    streamAccRef.current = ''

    const processEvent = (eventType: string, data: string) => {
      try {
          const parsed = JSON.parse(data)
          if (eventType === 'content' && typeof parsed.content === 'string') {
          streamAccRef.current += parsed.content
          const snapshot = streamAccRef.current
          setMessages(prev => {
            const next = [...prev]
            const last = next.length - 1
            if (last >= 0 && next[last].role === 'assistant') {
              next[last] = {
                ...next[last],
                content: snapshot,
              }
            }
            return next
          })
        } else if (eventType === 'done') {
          const sources = asArray<{ title: string; similarity?: string }>(parsed.sources)
          setMessages(prev => {
            const next = [...prev]
            const last = next.length - 1
            if (last >= 0 && next[last].role === 'assistant') {
              const raw = streamAccRef.current || next[last].content
              const content = raw.trim() ? raw : ASSISTANT_EMPTY_FALLBACK_VI
              next[last] = {
                ...next[last],
                content,
                sources,
              }
            }
            return next
          })
          streamAccRef.current = ''
          setLoading(false)
          void fetchSessions()
          } else if (eventType === 'error') {
            console.error('SSE error:', parsed.error)
            const message = typeof parsed.error === 'string' && parsed.error.trim()
              ? parsed.error.trim()
              : 'Không thể xử lý tin nhắn. Vui lòng thử lại.'
            setMessages(prev => {
              const next = [...prev]
              const last = next.length - 1
              if (last >= 0 && next[last].role === 'assistant') {
                next[last] = { ...next[last], content: message, sources: [] }
                return next
              }
              return [
                ...next,
                {
                  id: (Date.now() + 3).toString(),
                  role: 'assistant',
                  content: message,
                  sources: [],
                  createdAt: new Date(),
                },
              ]
            })
            streamAccRef.current = ''
            setLoading(false)
          }
      } catch {
        /* ignore */
      }
    }

    try {
      let sessionId = activeSessionId
      if (!sessionId) {
        const createRes = await api.post('/chatbot/sessions', {})
        sessionId = createRes.data.data.id
        setActiveSessionId(sessionId)
        setSessions(prev => [createRes.data.data, ...prev])
      }

      abortRef.current?.abort()
      const abortController = new AbortController()
      abortRef.current = abortController

      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${getApiBase()}/chatbot/sessions/${sessionId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ content: messageContent }),
        signal: abortController.signal,
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        sources: [],
        createdAt: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])

      const decoder = new TextDecoder()
      let carry = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        carry += decoder.decode(value, { stream: true })
        const { rest, events } = popSseEvents(carry)
        carry = rest
        for (const ev of events) {
          processEvent(ev.type, ev.data)
        }
      }

      const { events: tailEvents } = popSseEvents(carry + '\n\n')
      for (const ev of tailEvents) {
        processEvent(ev.type, ev.data)
      }

      // Nếu thiếu event `done` (lỗi mạng), vẫn đóng loading và ghi nội dung đã nhận từ ref
      if (streamAccRef.current !== '') {
        const snap = streamAccRef.current
        setMessages(prev => {
          const next = [...prev]
          const last = next.length - 1
          if (last >= 0 && next[last].role === 'assistant' && snap.trim()) {
            next[last] = { ...next[last], content: snap }
          }
          return next
        })
      }
      streamAccRef.current = ''
      setLoading(false)
    } catch (error: unknown) {
      const err = error as { name?: string }
      if (err.name === 'AbortError') {
        setMessages(prev => {
          const next = [...prev]
          const last = next.length - 1
          if (last >= 0 && next[last].role === 'assistant' && !next[last].content.trim()) {
            return next.slice(0, -1)
          }
          return next
        })
      } else {
        console.error('Chat error:', error)
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
            createdAt: new Date(),
          },
        ])
      }
      setLoading(false)
    } finally {
      abortRef.current = null
    }
  }, [input, loading, activeSessionId])

  const displayName = user?.fullName?.split(' ').pop() || 'bạn'
  const title = greetingTitle || `Xin chào, ${displayName}!`
  const description =
    greetingDescription ||
    'Bạn có thể hỏi về nội quy, thủ tục, thanh toán, lịch hẹn hoặc thông tin phòng ở — trợ lý sẽ trả lời phù hợp với tài khoản của bạn.'

  const headerSubtitle = 'Hỗ trợ sinh viên & cán bộ Đại học'
  const safeQuickQuestions = asArray<string>(quickQuestions)

  return (
    <div className="font-body min-h-[calc(100vh-6rem)] rounded-2xl border border-surface-200 bg-surface-100 shadow-[0_16px_48px_-24px_rgba(15,40,71,0.2)] overflow-hidden">
      <div className="flex h-[min(820px,calc(100vh-7rem))]">
        <aside
          className={`flex-shrink-0 flex flex-col border-r border-surface-200 bg-[#EEF1F6] transition-[width,opacity] duration-300 overflow-hidden ${
            sidebarOpen ? 'w-[min(100%,288px)] opacity-100' : 'w-0 opacity-0 border-r-0'
          }`}
        >
          <div className="w-[min(100%,288px)] h-full flex flex-col min-h-0">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-surface-300/60 bg-[#E8ECF3]">
              <History className="w-5 h-5 text-navy-600 shrink-0" aria-hidden />
              <span className="text-sm font-sans font-semibold text-navy-900 tracking-tight flex-1 min-w-0">
                Lịch sử trò chuyện
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void createNewSession()}
                loading={creatingSession}
                className="shrink-0 rounded-lg px-2"
                icon={<Plus className="w-4 h-4" />}
                aria-label="Cuộc trò chuyện mới"
              />
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-3">
              {sessionsLoading ? (
                <div className="space-y-2.5 animate-pulse px-0.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[4.5rem] rounded-xl bg-white/80 border border-surface-200" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-navy-500 text-center py-12 px-3 leading-relaxed">
                  Chưa có lịch sử. Gửi tin nhắn để bắt đầu hoặc bấm <strong className="text-navy-700">+</strong>.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {sessions.map((session, idx) => {
                    const SessionIcon = SESSION_ICONS[idx % SESSION_ICONS.length]
                    const active = activeSessionId === session.id
                    return (
                      <li key={session.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') loadSession(session.id)
                          }}
                          onClick={() => void loadSession(session.id)}
                          className={`group relative flex gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all shadow-sm ${
                            active
                              ? 'border-primary-500 bg-primary-50/90'
                              : 'border-surface-200 bg-white hover:border-surface-300 hover:shadow'
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              active ? 'bg-primary-600 text-white' : 'bg-surface-100 text-navy-500'
                            }`}
                          >
                            <SessionIcon className="h-5 w-5" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1 pr-7">
                            <p className="text-sm font-semibold text-navy-900 leading-snug line-clamp-2">
                              {session.title}
                            </p>
                            <p className="text-xs text-navy-500 mt-1">
                              ({formatSessionDate(session.createdAt)})
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label="Xóa cuộc trò chuyện"
                            onClick={e => void deleteSession(session.id, e)}
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-navy-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="flex flex-col gap-1 border-b border-navy-900/20 bg-navy-800 px-4 py-4 sm:px-5 sm:py-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(v => !v)}
                className="rounded-lg p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={sidebarOpen ? 'Thu gọn danh sách' : 'Mở danh sách'}
              >
                {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
              </button>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 shadow-md ring-2 ring-white/20">
                <Sparkles className="h-5 w-5 text-white" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 gap-y-1">
                  <h1 className="text-lg font-sans font-bold tracking-tight text-white sm:text-xl">
                    Trợ lý AI KTX
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/95">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                    Trực tuyến
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/65 sm:text-sm">{headerSubtitle}</p>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-5 sm:px-6">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-2 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50 ring-1 ring-primary-100">
                  <Sparkles className="h-10 w-10 text-primary-600" aria-hidden />
                </div>
                <h2 className="font-sans text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">{title}</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-navy-600">{description}</p>
                <p className="mb-3 mt-8 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                  Gợi ý nhanh
                </p>
                <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                  {safeQuickQuestions.map((question, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setInput(question)}
                      className="group flex max-w-[min(100%,18rem)] items-start gap-2 rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-left text-sm text-navy-800 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50/50 hover:shadow"
                    >
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary-500 opacity-80 group-hover:opacity-100" />
                      <span className="leading-snug">{question}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.map((message, msgIndex) => {
                  const isAwaitingFirstToken =
                    loading &&
                    message.role === 'assistant' &&
                    msgIndex === messages.length - 1 &&
                    !message.content.trim()

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 shadow-md ring-2 ring-white ${
                            isAwaitingFirstToken ? 'animate-pulse' : ''
                          }`}
                        >
                          <Sparkles className="h-5 w-5 text-white" aria-hidden />
                        </div>
                      )}

                      <div
                        className={`min-w-0 max-w-[min(100%,34rem)] rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 ${
                          message.role === 'user'
                            ? 'rounded-br-md bg-navy-800 text-white shadow-lg shadow-navy-900/15'
                            : 'rounded-bl-md border border-surface-200/90 bg-white text-navy-800 shadow-[0_4px_24px_-6px_rgba(15,40,71,0.14)]'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <p className="whitespace-pre-wrap font-body text-[15px] leading-relaxed">{message.content}</p>
                        ) : isAwaitingFirstToken ? (
                          <div
                            className="space-y-1 py-0.5"
                            role="status"
                            aria-live="polite"
                            aria-label="Trợ lý đang xử lý câu hỏi"
                          >
                            <div className="flex items-center gap-3 text-navy-600">
                              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-500" aria-hidden />
                              <span className="text-sm font-medium text-navy-800">Đang xử lý câu hỏi</span>
                            </div>
                            <p className="pl-8 text-xs leading-relaxed text-navy-500">
                              Đang tra cứu trong tài liệu và ngữ cảnh tài khoản của bạn. Thường mất vài giây — vui lòng đợi
                              trước khi gửi câu khác.
                            </p>
                          </div>
                        ) : !message.content.trim() ? (
                          <p className="whitespace-pre-wrap font-body text-[15px] leading-relaxed text-navy-700">
                            {ASSISTANT_EMPTY_FALLBACK_VI}
                          </p>
                        ) : (
                          <AssistantMarkdown content={message.content} />
                        )}
                        {message.role === 'assistant' && asArray(message.sources).length > 0 && (
                          <div className="mt-3 border-t border-surface-200 pt-3">
                            <p className="mb-2 text-[10px] font-sans font-semibold uppercase tracking-wider text-navy-400">
                              Nguồn tham khảo
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {asArray<{ title: string; similarity?: string }>(message.sources).map((source, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-lg border border-primary-100/80 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-800"
                                >
                                  {source.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 shadow-md ring-2 ring-white">
                          <User className="h-5 w-5 text-white" aria-hidden />
                        </div>
                      )}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <footer className="border-t border-surface-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
            <form
              onSubmit={e => {
                e.preventDefault()
                void handleSend()
              }}
            >
              <div className="rounded-xl border border-surface-300 bg-white p-3 shadow-sm transition-shadow focus-within:border-navy-300 focus-within:shadow-md focus-within:ring-2 focus-within:ring-navy-800/10">
                <label htmlFor="chat-composer" className="sr-only">
                  Nhập câu hỏi
                </label>
                <textarea
                  id="chat-composer"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void handleSend()
                    }
                  }}
                  placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
                  disabled={loading}
                  rows={3}
                  className="max-h-40 min-h-[5.5rem] w-full resize-none border-0 bg-transparent font-body text-[15px] leading-relaxed text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-0 disabled:opacity-60"
                />
                <div className="mt-2 flex items-center justify-between border-t border-surface-100 pt-2.5">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-navy-400 transition-colors hover:bg-surface-100 hover:text-navy-700"
                      title="Đính kèm (sắp có)"
                      aria-label="Đính kèm tệp"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-navy-400 transition-colors hover:bg-surface-100 hover:text-navy-700"
                      title="Gửi hình ảnh (sắp có)"
                      aria-label="Đính kèm hình ảnh"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {loading ? (
                      <button
                        type="button"
                        onClick={handleStop}
                        title="Dừng trả lời"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm font-semibold text-navy-700 shadow-sm transition-colors hover:bg-surface-50"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" />
                        <span className="hidden sm:inline">Dừng</span>
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-white shadow-md transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
                      aria-label="Gửi tin nhắn"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </footer>
        </div>
      </div>
    </div>
  )
}
