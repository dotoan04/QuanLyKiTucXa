import {
  canUseChatTool,
  getAllowedToolsForRole,
  getOpenRouterToolDefinitions,
} from './chatbot-tools.registry'
import { executeChatTool, extractSearchKnowledgeSources } from './chatbot-tools.executor'

describe('chatbot-tools.registry RBAC', () => {
  it('student may use search_knowledge and self-service DB tools only', () => {
    expect(canUseChatTool('student', 'search_knowledge')).toBe(true)
    expect(canUseChatTool('student', 'get_student_overview')).toBe(true)
    expect(canUseChatTool('student', 'get_organization_unpaid_invoices')).toBe(false)
    expect(canUseChatTool('student', 'get_organization_active_rooms')).toBe(false)
    expect(canUseChatTool('student', 'get_appointment_schedule')).toBe(false)
  })

  it('staff may use org tools and schedule', () => {
    expect(canUseChatTool('staff', 'get_organization_unpaid_invoices')).toBe(true)
    expect(canUseChatTool('staff', 'get_appointment_schedule')).toBe(true)
    expect(canUseChatTool('staff', 'get_student_overview')).toBe(false)
  })

  it('technician has schedule + search only', () => {
    const allowed = getAllowedToolsForRole('technician')
    expect(allowed).toEqual(['search_knowledge', 'get_appointment_schedule'])
  })

  it('admin has all tools', () => {
    expect(getAllowedToolsForRole('admin').length).toBe(7)
  })

  it('unknown role gets no tools', () => {
    expect(getAllowedToolsForRole('guest')).toEqual([])
  })

  it('OpenRouter defs only include allowed tool names', () => {
    const defs = getOpenRouterToolDefinitions(getAllowedToolsForRole('accountant'))
    expect(defs.every((d) => d.type === 'function')).toBe(true)
    expect(defs.map((d) => d.function.name).sort()).toEqual(
      [
        'search_knowledge',
        'get_appointment_schedule',
        'get_organization_unpaid_invoices',
      ].sort()
    )
  })
})

describe('chatbot-tools.executor', () => {
  it('rejects disallowed tool for student before hitting Prisma', async () => {
    const out = await executeChatTool(
      'get_organization_unpaid_invoices',
      {},
      { userId: 'u1', userRole: 'student', userQuestion: 'test' }
    )
    const j = JSON.parse(out) as { error?: string }
    expect(j.error).toBe('forbidden')
  })

  it('extractSearchKnowledgeSources parses tool JSON', () => {
    const src = extractSearchKnowledgeSources(
      JSON.stringify({
        source: 'vector_knowledge_base',
        passages: [{ id: 'a', title: 'T', similarity: 0.9 }],
      })
    )
    expect(src).toEqual([{ id: 'a', title: 'T', similarity: 0.9 }])
  })
})
