/**
 * API Test Script - KTX Backend
 * Chạy: npx ts-node scripts/test-api.ts
 *
 * Báo cáo HTML + Markdown: thư mục backend/reports/ (hoặc REPORT_OUTPUT_DIR)
 * Mở file .html trong trình duyệt để in / chụp màn hình đưa vào báo cáo.
 */

import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1'
const REPORT_DIR = process.env.REPORT_OUTPUT_DIR || path.join(__dirname, '..', 'reports')

interface TestResult {
  endpoint: string
  method: string
  status: number
  ok: boolean
  message?: string
  duration: number
  section?: string
}

/** Nhóm hiện tại (ghi vào báo cáo) */
let currentSection = 'Khác'
/** Nhãn thời gian hiển thị trên báo cáo */
let reportStartedAtLabel = ''

interface AuthTokens {
  admin?: string
  staff?: string
  accountant?: string
  technician?: string
  director?: string
  student?: string
}

interface ApiResponse {
  success?: boolean
  data?: any
  message?: string
  accessToken?: string
}

const results: TestResult[] = []
let tokens: AuthTokens = {}

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function setReportSection(title: string) {
  currentSection = title
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getSectionOrder(): string[] {
  const order: string[] = []
  for (const r of results) {
    const s = r.section || 'Khác'
    if (!order.includes(s)) order.push(s)
  }
  return order
}

function writeReportFiles(meta: { baseUrl: string; startedAt: string; passed: number; failed: number; total: number; avgMs: number }) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
  const baseName = `api-test-report-${stamp}`
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true })
  }
  const htmlPath = path.join(REPORT_DIR, `${baseName}.html`)
  const mdPath = path.join(REPORT_DIR, `${baseName}.md`)

  const successRate = meta.total ? ((meta.passed / meta.total) * 100).toFixed(1) : '0'
  const sectionOrder = getSectionOrder()

  // —— Markdown (dán vào Word / Google Docs) ——
  let md = `# Báo cáo kiểm thử API — Hệ thống Quản lý Ký túc xá\n\n`
  md += `| Thuộc tính | Giá trị |\n|------------|---------|\n`
  md += `| Thời gian chạy | ${meta.startedAt} |\n`
  md += `| Base URL | \`${meta.baseUrl}\` |\n`
  md += `| Tổng request | ${meta.total} |\n`
  md += `| Đạt (theo kỳ vọng) | **${meta.passed}** |\n`
  md += `| Không đạt | **${meta.failed}** |\n`
  md += `| Tỷ lệ đạt | **${successRate}%** |\n`
  md += `| Thời gian TB | ${meta.avgMs} ms |\n\n`

  md += `## Phân bố mã HTTP\n\n`
  const statusGroups = results.reduce((acc, r) => {
    const key = String(r.status || 'LỖI MẠNG')
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  for (const [code, n] of Object.entries(statusGroups).sort((a, b) => b[0].localeCompare(a[0]))) {
    md += `- **${code}**: ${n}\n`
  }
  md += `\n---\n\n`

  let rowIndex = 0
  for (const sec of sectionOrder) {
    const rows = results.filter((r) => (r.section || 'Khác') === sec)
    md += `## ${sec}\n\n`
    md += `| STT | Method | Endpoint | HTTP | ms | Kết quả | Ghi chú |\n|-----|--------|----------|------|-----|---------|--------|\n`
    for (const r of rows) {
      rowIndex++
      const note = r.message ? r.message.replace(/\|/g, '\\|').replace(/\n/g, ' ') : '—'
      md += `| ${rowIndex} | ${r.method} | \`${r.endpoint}\` | ${r.status} | ${r.duration} | ${r.ok ? '✅ Đạt' : '❌ Không đạt'} | ${note} |\n`
    }
    md += `\n`
  }

  if (meta.failed > 0) {
    md += `## Các case không đạt\n\n`
    for (const r of results.filter((x) => !x.ok)) {
      md += `- \`${r.method}\` \`${r.endpoint}\` → **${r.status}** ${r.message ? `— ${r.message}` : ''}\n`
    }
  }

  fs.writeFileSync(mdPath, md, 'utf8')

  // —— HTML (in / chụp màn hình) ——
  const tableRowsHtml: string[] = []
  rowIndex = 0
  for (const sec of sectionOrder) {
    const rows = results.filter((r) => (r.section || 'Khác') === sec)
    tableRowsHtml.push(`<tr class="section-row"><td colspan="7">${escapeHtml(sec)}</td></tr>`)
    for (const r of rows) {
      rowIndex++
      const badge = r.ok
        ? '<span class="badge ok">Đạt</span>'
        : '<span class="badge fail">Không đạt</span>'
      const statusClass =
        r.status >= 200 && r.status < 300 ? 's2' : r.status >= 400 && r.status < 500 ? 's4' : r.status >= 500 ? 's5' : 's0'
      tableRowsHtml.push(`<tr>
  <td class="num">${rowIndex}</td>
  <td><code class="method">${escapeHtml(r.method)}</code></td>
  <td><code class="ep">${escapeHtml(r.endpoint)}</code></td>
  <td><span class="http ${statusClass}">${r.status}</span></td>
  <td class="num">${r.duration}</td>
  <td>${badge}</td>
  <td class="note">${escapeHtml(r.message || '—')}</td>
</tr>`)
    }
  }

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Báo cáo kiểm thử API — KTX</title>
  <style>
    :root {
      --bg: #f4f6fb;
      --card: #fff;
      --text: #1a1d26;
      --muted: #5c6370;
      --primary: #1e3a5f;
      --accent: #2563eb;
      --ok: #059669;
      --fail: #dc2626;
      --border: #e2e8f0;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 2rem 1.5rem 3rem;
      line-height: 1.5;
    }
    .wrap { max-width: 1100px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, var(--primary) 0%, #2d4a7c 100%);
      color: #fff;
      padding: 1.75rem 2rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 24px rgba(30, 58, 95, 0.25);
    }
    header h1 { margin: 0 0 0.35rem; font-size: 1.5rem; font-weight: 700; }
    header p { margin: 0; opacity: 0.92; font-size: 0.95rem; }
    .meta { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; font-size: 0.875rem; }
    .meta span { background: rgba(255,255,255,0.12); padding: 0.35rem 0.75rem; border-radius: 8px; }
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .kpi {
      background: var(--card);
      border-radius: 10px;
      padding: 1.1rem 1.25rem;
      border: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .kpi .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
    .kpi .value { font-size: 1.65rem; font-weight: 700; color: var(--primary); margin-top: 0.25rem; }
    .kpi.ok .value { color: var(--ok); }
    .kpi.fail .value { color: var(--fail); }
    .bar-wrap {
      background: var(--card);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      border: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }
    .bar-wrap h2 { margin: 0 0 0.75rem; font-size: 1rem; color: var(--primary); }
    .bar-outer { height: 12px; background: var(--border); border-radius: 6px; overflow: hidden; }
    .bar-inner {
      height: 100%;
      background: linear-gradient(90deg, var(--ok), #34d399);
      border-radius: 6px;
      width: ${successRate}%;
      transition: width 0.4s ease;
    }
    .table-card {
      background: var(--card);
      border-radius: 12px;
      border: 1px solid var(--border);
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    th {
      text-align: left;
      padding: 0.75rem 0.65rem;
      background: #f8fafc;
      color: var(--muted);
      font-weight: 600;
      border-bottom: 2px solid var(--border);
    }
    td { padding: 0.55rem 0.65rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
    tr:hover td { background: #fafbfc; }
    tr.section-row td {
      background: #eef2ff;
      color: var(--primary);
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.65rem 0.75rem;
      border-bottom: 2px solid #c7d2fe;
    }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    code.method { color: var(--accent); font-weight: 600; }
    code.ep { font-size: 0.78rem; word-break: break-all; }
    .http { font-weight: 700; font-variant-numeric: tabular-nums; }
    .http.s2 { color: var(--ok); }
    .http.s4 { color: #ca8a04; }
    .http.s5, .http.s0 { color: var(--fail); }
    .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.72rem; font-weight: 600; }
    .badge.ok { background: #d1fae5; color: #065f46; }
    .badge.fail { background: #fee2e2; color: #991b1b; }
    .note { color: var(--muted); max-width: 280px; word-break: break-word; }
    footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.8rem;
      color: var(--muted);
    }
    @media print {
      body { background: #fff; padding: 0; }
      .wrap { max-width: 100%; }
      header { break-inside: avoid; }
      tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Báo cáo kiểm thử API</h1>
      <p>Hệ thống Quản lý Ký túc xá (KTX) — Smoke test tự động</p>
      <div class="meta">
        <span>⏱ ${escapeHtml(meta.startedAt)}</span>
        <span>🔗 ${escapeHtml(meta.baseUrl)}</span>
      </div>
    </header>
    <div class="kpis">
      <div class="kpi ok"><div class="label">Đạt</div><div class="value">${meta.passed}</div></div>
      <div class="kpi fail"><div class="label">Không đạt</div><div class="value">${meta.failed}</div></div>
      <div class="kpi"><div class="label">Tổng</div><div class="value">${meta.total}</div></div>
      <div class="kpi"><div class="label">Thời gian TB</div><div class="value">${meta.avgMs}<small style="font-size:0.5em;font-weight:500"> ms</small></div></div>
      <div class="kpi ok"><div class="label">Tỷ lệ đạt</div><div class="value">${successRate}%</div></div>
    </div>
    <div class="bar-wrap">
      <h2>Tỷ lệ case đạt kỳ vọng</h2>
      <div class="bar-outer"><div class="bar-inner"></div></div>
    </div>
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th class="num">STT</th>
            <th>Method</th>
            <th>Endpoint</th>
            <th>HTTP</th>
            <th class="num">ms</th>
            <th>Kết quả</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
${tableRowsHtml.join('\n')}
        </tbody>
      </table>
    </div>
    <footer>
      Tạo bởi <code>backend/scripts/test-api.ts</code> — In trang (Ctrl+P) hoặc chụp màn hình để đưa vào báo cáo.
    </footer>
  </div>
</body>
</html>`

  fs.writeFileSync(htmlPath, html, 'utf8')
  return { htmlPath, mdPath }
}

async function request(
  method: string,
  endpoint: string,
  token?: string,
  body?: any,
  expectedStatus?: number | number[]
): Promise<TestResult> {
  const start = Date.now()
  const url = `${BASE_URL}${endpoint}`

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const duration = Date.now() - start
    const expected = expectedStatus || [200, 201, 204]
    const statusArray = Array.isArray(expected) ? expected : [expected]
    const ok = statusArray.includes(res.status)

    let message = ''
    if (!ok) {
      try {
        const data = await res.json() as ApiResponse
        message = data.message || res.statusText
      } catch {
        message = res.statusText
      }
    }

    const result: TestResult = {
      endpoint,
      method,
      status: res.status,
      ok,
      message,
      duration,
      section: currentSection,
    }

    results.push(result)

    const statusColor = ok ? 'green' : 'red'
    log(statusColor, `  ${method.padEnd(6)} ${endpoint.padEnd(45)} ${res.status} (${duration}ms)${message ? ' - ' + message : ''}`)

    return result
  } catch (error: any) {
    const duration = Date.now() - start
    const result: TestResult = {
      endpoint,
      method,
      status: 0,
      ok: false,
      message: error.message,
      duration,
      section: currentSection,
    }
    results.push(result)
    log('red', `  ${method.padEnd(6)} ${endpoint.padEnd(45)} ERROR - ${error.message}`)
    return result
  }
}

async function login(role: string, email: string, password: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      const data = await res.json() as ApiResponse
      const token = data.data?.accessToken || data.accessToken
      if (token) {
        log('green', `  ✓ ${role}`)
        return token
      }
    }
  } catch {}
  log('gray', `  - ${role} (no account)`)
  return undefined
}

async function testHealthEndpoint() {
  setReportSection('1. Kiểm tra Health')
  log('yellow', '\n📋 Health Check')
  const start = Date.now()
  const res = await fetch(`${BASE_URL.replace('/api/v1', '')}/health`)
  const duration = Date.now() - start
  const ok = res.ok
  results.push({
    endpoint: '/health',
    method: 'GET',
    status: res.status,
    ok,
    duration,
    section: currentSection,
  })
  if (res.ok) {
    log('green', `  GET    /health                                     ${res.status}`)
  } else {
    log('red', `  GET    /health                                     ${res.status}`)
  }
}

async function testPublicEndpoints() {
  setReportSection('2. API công khai (Auth)')
  log('yellow', '\n📋 Public Endpoints (Auth)')

  await request('POST', '/auth/register', undefined, {
    email: `test_${Date.now()}@test.com`,
    password: 'Test123456',
    fullName: 'Test User',
    role: 'student',
  }, [200, 201, 400, 409])

  await request('POST', '/auth/login', undefined, {
    email: 'invalid@test.com',
    password: 'wrong',
  }, [400, 401])

  await request('POST', '/auth/refresh', undefined, {}, [200, 401])
}

async function testAuthEndpoints() {
  setReportSection('3. Xác thực (đã đăng nhập)')
  log('yellow', '\n📋 Auth Endpoints (Protected)')

  await request('GET', '/auth/me', tokens.admin)
  await request('PUT', '/auth/me', tokens.admin, { fullName: 'Admin Updated' })
  await request('GET', '/auth/users', tokens.admin)
  await request('GET', '/auth/users', tokens.student, undefined, [401, 403])
}

async function testRoomEndpoints() {
  setReportSection('4. Phòng & loại phòng')
  log('yellow', '\n📋 Room Endpoints')

  await request('GET', '/rooms', tokens.admin)
  await request('GET', '/rooms/available', tokens.admin)
  await request('GET', '/rooms/room-types', tokens.admin)
  await request('GET', '/rooms/my-room', tokens.student || tokens.admin)

  await request('POST', '/rooms/room-types', tokens.admin, {
    name: `Test Type ${Date.now()}`,
    capacity: 4,
    monthlyPrice: 500000,
    genderRestriction: 'mixed',
  }, [200, 201])
}

async function testStudentEndpoints() {
  setReportSection('5. Sinh viên')
  log('yellow', '\n📋 Student Endpoints')

  await request('GET', '/students', tokens.admin)
  await request('GET', '/students/me', tokens.student || tokens.admin)
  // PUT /students/me requires student role specifically
  await request('PUT', '/students/me', tokens.student, { phone: '0123456789' }, [200, 401, 403])
}

async function testContractEndpoints() {
  setReportSection('6. Hợp đồng')
  log('yellow', '\n📋 Contract Endpoints')

  await request('GET', '/contracts', tokens.admin)
  await request('GET', '/contracts/handover/pending', tokens.staff || tokens.admin)
}

async function testRegistrationEndpoints() {
  setReportSection('7. Đăng ký phòng')
  log('yellow', '\n📋 Registration Endpoints')

  await request('GET', '/registrations', tokens.admin)
  await request('GET', '/registrations/my', tokens.student || tokens.admin)
  // room-types requires student role
  await request('GET', '/registrations/room-types', tokens.student, undefined, [200, 401, 403])
  await request('GET', '/registrations/stats', tokens.admin)
}

async function testInvoiceEndpoints() {
  setReportSection('8. Hóa đơn')
  log('yellow', '\n📋 Invoice Endpoints')

  await request('GET', '/invoices', tokens.admin)
  await request('GET', '/invoices/my-invoices', tokens.student || tokens.admin)
  await request('GET', '/invoices/stats/summary', tokens.admin)
}

async function testIncidentEndpoints() {
  setReportSection('9. Sự cố')
  log('yellow', '\n📋 Incident Endpoints')

  await request('GET', '/incidents', tokens.admin)
  await request('GET', '/incidents/my-incidents', tokens.student || tokens.admin)
}

async function testNotificationEndpoints() {
  setReportSection('10. Thông báo')
  log('yellow', '\n📋 Notification Endpoints')

  await request('GET', '/notifications', tokens.admin)
  await request('GET', '/notifications/unread-count', tokens.admin)
}

async function testDashboardEndpoints() {
  setReportSection('11. Dashboard')
  log('yellow', '\n📋 Dashboard Endpoints')

  await request('GET', '/dashboard/stats', tokens.admin)
  await request('GET', '/dashboard/revenue', tokens.admin)
  await request('GET', '/dashboard/occupancy', tokens.admin)
}

async function testDirectorEndpoints() {
  setReportSection('12. Ban giám đốc')
  log('yellow', '\n📋 Director Endpoints')

  await request('GET', '/director/policies/room-types', tokens.director || tokens.admin)
  await request('GET', '/director/reports/periodic', tokens.director || tokens.admin)
}

async function testStaffEndpoints() {
  setReportSection('13. Nghiệp vụ nhân viên')
  log('yellow', '\n📋 Staff Modules')

  const token = tokens.staff || tokens.admin
  const accToken = tokens.accountant || tokens.admin

  await request('GET', '/reconciliation/reports', accToken)
  await request('GET', '/reconciliation/stats', accToken)
  await request('GET', '/violations', token)
  await request('GET', '/transfers', token)
  await request('GET', '/renewals/expiring', token)
  await request('GET', '/returns', token)
  await request('GET', '/temporary-leave', token)
  await request('GET', '/maintenance', token)
  await request('GET', '/meter-readings', token)
}

async function testFinancialReportEndpoints() {
  setReportSection('14. Báo cáo tài chính')
  log('yellow', '\n📋 Financial Reports')

  const token = tokens.accountant || tokens.admin
  await request('GET', '/financial-reports/stats', token)
  await request('POST', '/financial-reports/generate', token, {
    month: new Date().toISOString().slice(0, 7)
  })
}

async function testChatbotEndpoints() {
  setReportSection('15. Chatbot')
  log('yellow', '\n📋 Chatbot Endpoints')

  const token = tokens.student || tokens.admin
  await request('GET', '/chatbot/sessions', token)
  await request('POST', '/chatbot/sessions', token, {})
}

async function testSystemConfigEndpoints() {
  setReportSection('16. Cấu hình hệ thống')
  log('yellow', '\n📋 System Config')

  await request('GET', '/system-config', tokens.admin)
}

async function testAuditLogEndpoints() {
  setReportSection('17. Nhật ký kiểm toán')
  log('yellow', '\n📋 Audit Logs')

  await request('GET', '/audit-logs', tokens.admin)
  await request('GET', '/audit-logs', tokens.student, undefined, [401, 403])
}

async function testPdfEndpoints() {
  setReportSection('18. Xuất PDF')
  log('yellow', '\n📋 PDF Generation')

  await request('GET', '/pdf/deposit-receipt/test-id', tokens.admin, undefined, [400, 404, 500])
  await request('GET', '/pdf/contract/test-id', tokens.admin, undefined, [400, 404, 500])
}

async function testAppointmentEndpoints() {
  setReportSection('19. Lịch hẹn')
  log('yellow', '\n📋 Appointments')

  await request('GET', '/appointments', tokens.admin)
  // /appointments/my requires student role
  await request('GET', '/appointments/my', tokens.student, undefined, [200, 401, 403])
}

function printSummary() {
  log('blue', '\n' + '='.repeat(80))
  log('blue', '📊 TEST SUMMARY')
  log('blue', '='.repeat(80))

  const passed = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length
  const total = results.length
  const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / total)

  console.log('')
  log('green', `  ✅ Passed: ${passed}`)
  log('red', `  ❌ Failed: ${failed}`)
  log('cyan', `  📊 Total:   ${total}`)
  log('yellow', `  ⏱️  Avg Duration: ${avgDuration}ms`)
  console.log('')

  if (failed > 0) {
    log('red', '\n❌ Failed Tests:')
    results
      .filter(r => !r.ok)
      .forEach(r => {
        log('red', `   ${r.method} ${r.endpoint} - ${r.status} ${r.message || ''}`)
      })
  }

  // Group by status code
  const statusGroups = results.reduce((acc, r) => {
    const key = String(r.status || 'ERROR')
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  log('cyan', '\n📈 Status Code Distribution:')
  Object.entries(statusGroups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([status, count]) => {
      const color = status.startsWith('2') ? 'green' : status.startsWith('4') ? 'yellow' : 'red'
      log(color, `   ${status}: ${count}`)
    })

  // Success rate
  const successRate = ((passed / total) * 100).toFixed(1)
  console.log('')
  log('blue', `  🎯 Success Rate: ${successRate}%`)

  const { htmlPath, mdPath } = writeReportFiles({
    baseUrl: BASE_URL,
    startedAt: reportStartedAtLabel || new Date().toLocaleString('vi-VN'),
    passed,
    failed,
    total,
    avgMs: avgDuration,
  })

  console.log('')
  log('cyan', '📄 Báo cáo (mở HTML trong trình duyệt — in hoặc chụp màn hình):')
  log('cyan', `   ${htmlPath}`)
  log('cyan', `   ${mdPath}`)

  console.log('')
  log('blue', '='.repeat(80))

  process.exit(failed > 0 ? 1 : 0)
}

async function main() {
  reportStartedAtLabel = new Date().toLocaleString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  log('blue', '\n' + '='.repeat(80))
  log('blue', '🚀 KTX Backend API Test Suite')
  log('blue', '='.repeat(80))
  log('cyan', `\nBase URL: ${BASE_URL}`)
  log('cyan', `Time: ${reportStartedAtLabel}`)

  // Health check first
  await testHealthEndpoint()

  // Login as different roles
  log('cyan', '\n🔐 Logging in...')
  tokens.admin = await login('admin', 'admin@ktx.edu.vn', 'admin123')
  tokens.staff = await login('staff', 'staff@ktx.edu.vn', 'staff123')
  tokens.accountant = await login('accountant', 'accountant@ktx.edu.vn', 'accountant123')
  tokens.technician = await login('technician', 'technician@ktx.edu.vn', 'technician123')
  tokens.director = await login('director', 'director@ktx.edu.vn', 'director123')
  tokens.student = await login('student', 'student@ktx.edu.vn', 'student123')

  // Run all tests
  await testPublicEndpoints()
  await testAuthEndpoints()
  await testRoomEndpoints()
  await testStudentEndpoints()
  await testContractEndpoints()
  await testRegistrationEndpoints()
  await testInvoiceEndpoints()
  await testIncidentEndpoints()
  await testNotificationEndpoints()
  await testDashboardEndpoints()
  await testDirectorEndpoints()
  await testStaffEndpoints()
  await testFinancialReportEndpoints()
  await testChatbotEndpoints()
  await testSystemConfigEndpoints()
  await testAuditLogEndpoints()
  await testPdfEndpoints()
  await testAppointmentEndpoints()

  printSummary()
}

main().catch(console.error)
