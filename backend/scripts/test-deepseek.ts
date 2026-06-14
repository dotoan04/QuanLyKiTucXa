/**
 * DeepSeek V4 Flash connectivity smoke test.
 * Chạy: npx ts-node scripts/test-deepseek.ts   (hoặc: npm run test:deepseek)
 *
 * Yêu cầu .env có DEEPSEEK_API_KEY. Gửi 1 call non-stream tới deepseek-v4-flash
 * với thinking:{type:"disabled"} và in status/model/content/usage.
 * Verify nhanh key + model trước khi khởi động app.
 */
import 'dotenv/config'

const BASE = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '')
const API_KEY = process.env.DEEPSEEK_API_KEY?.trim()
const MODEL = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}
const log = (c: keyof typeof colors, m: string) => console.log(`${colors[c]}${m}${colors.reset}`)

async function main() {
  log('cyan', `\n🧪 DeepSeek V4 Flash smoke test`)
  log('cyan', `   base : ${BASE}`)
  log('cyan', `   model: ${MODEL}`)
  log('cyan', `   key  : ${API_KEY ? API_KEY.slice(0, 4) + '…' + API_KEY.slice(-3) : '(missing)'}\n`)

  if (!API_KEY) {
    log('red', '❌ DEEPSEEK_API_KEY chưa đặt trong .env — không thể test.')
    process.exit(1)
  }

  const start = Date.now()
  let res
  try {
    res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'Trả lời đúng một từ tiếng Việt.' },
          { role: 'user', content: 'Xin chào' },
        ],
        max_tokens: 16,
        temperature: 0,
        thinking: { type: 'disabled' },
      }),
    })
  } catch (e: any) {
    log('red', `❌ Network error: ${e?.message || e}`)
    process.exit(1)
  }

  const ms = Date.now() - start
  const raw = await res.text()
  let json: any = {}
  try {
    json = JSON.parse(raw)
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    log('red', `❌ HTTP ${res.status} (${ms}ms)`)
    console.log(raw.slice(0, 800))
    process.exit(1)
  }

  const content = json.choices?.[0]?.message?.content
  const usage = json.usage

  log('green', `✅ HTTP ${res.status} (${ms}ms)`)
  log('green', `   model   : ${json.model}`)
  log('green', `   content : ${JSON.stringify(content)}`)
  log('green', `   usage   : ${JSON.stringify(usage)}`)

  if (!content || !content.trim()) {
    log('yellow', `⚠️  content rỗng — có thể model đang ở thinking mode (kiểm tra thinking:{type:"disabled"}).`)
  }
  if (usage?.total_tokens == null) {
    log('yellow', `⚠️  usage.total_tokens thiếu.`)
  }

  console.log('')
  process.exit(0)
}

main().catch((e) => {
  log('red', `❌ Unhandled: ${e?.message || e}`)
  process.exit(1)
})
