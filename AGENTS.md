# AGENTS.md - Hệ Thống Quản Lý Ký Túc Xá

## Project Overview

Full-stack Dormitory Management System (KTX) with AI Chatbot support.

- **Backend**: Express.js + TypeScript + Prisma ORM + PostgreSQL
- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS + Zustand
- **AI/Chatbot**: RAG pipeline with ChromaDB vector store + OpenRouter API
- **Infrastructure**: Docker Compose (PostgreSQL, Redis, ChromaDB)

### User Roles
- `admin`: Full system administration
- `staff`: Daily operations (contracts, incidents, registrations)
- `accountant`: Invoice and reconciliation operations
- `technician`: Incident handling and maintenance operations
- `director`: Executive dashboard, policy approval, periodic reports
- `student`: Student self-service portal

---

## Essential Commands

### Backend (`backend/`)

```bash
# Development
npm run dev              # Start dev server with hot reload (port 3001)

# Build & Production
npm run build            # Compile TypeScript to dist/
npm run start            # Run production build

# Database (Prisma)
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:studio    # Open Prisma Studio GUI
npm run prisma:seed      # Seed database

# Quality
npm run lint             # ESLint check
npm run test             # Jest tests
npm run test:api         # Smoke test API + báo cáo HTML/Markdown (reports/)
```

### Frontend (`frontend/`)

```bash
# Development
npm run dev              # Start Next.js dev server with Turbopack (port 3000)

# Build & Production
npm run build            # Build for production
npm run start            # Start production server

# Quality
npm run lint             # Next.js ESLint
```

### Docker (root directory)

```bash
docker-compose up -d     # Start all services (postgres, redis, chromadb, backend, frontend)
docker-compose down      # Stop all services
docker-compose logs -f   # Follow logs
```

### Database Setup (first time)

```bash
cd backend
cp .env.example .env     # Configure environment variables
npm install
npm run prisma:migrate   # Create database schema
npm run prisma:seed      # Seed initial data
npm run dev              # Start server
```

---

## Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── index.ts              # App entry point
│   ├── app.ts                # Express app setup + routes mount
│   ├── common/
│   │   ├── middlewares/      # auth, error, not-found
│   │   ├── types/            # Shared TypeScript types
│   │   ├── utils/            # app-error, response, email, async-handler
│   │   └── validators/       # Zod validation schemas
│   └── modules/
│       ├── auth/             # Authentication & user management
│       ├── rooms/            # Room & room type CRUD
│       ├── students/         # Student profile management
│       ├── contracts/        # Contracts + registration requests + handovers
│       ├── invoices/         # Monthly billing + payments
│       ├── incidents/        # Incident/maintenance tickets
│       ├── chatbot/          # AI chatbot + RAG pipeline
│       ├── notifications/    # User notifications
│       ├── dashboard/        # Stats, revenue, occupancy reports
│       ├── director/         # Director-only: policies, periodic reports (UC22/UC23)
│       ├── registrations/    # Room registration requests
│       ├── returns/          # Room return workflow (UC03)
│       ├── renewals/         # Contract renewal (UC02)
│       ├── temporary-leave/  # Temporary absence registration (UC08)
│       ├── transfers/        # Room transfer requests (UC11)
│       ├── violations/       # Violation records (UC12)
│       ├── reconciliation/   # Payment reconciliation (UC15)
│       ├── system-config/    # Key-value system settings (UC25)
│       ├── audit-log/        # Audit trail viewer (UC26)
│       └── maintenance/      # Scheduled maintenance (UC19/UC20)
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Migration files
│   └── seed.ts               # Seed data
├── .env                      # Environment config (not in git)
├── .env.example              # Template for .env
├── package.json
└── tsconfig.json
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (admin)/          # Admin layout wrapper
│   │   ├── admin/            # Admin pages: contracts, rooms, students, invoices, incidents, knowledge, settings
│   │   ├── (staff)/          # Staff layout wrapper
│   │   ├── staff/            # Staff pages: contracts, incidents
│   │   ├── director/         # Director pages: dashboard, policies, periodic reports
│   │   ├── (student)/        # Student layout wrapper
│   │   ├── student/          # Student pages: contract, invoices, incidents, chatbot
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   ├── chatbot/          # Public chatbot page
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home (redirects by role)
│   ├── components/
│   │   ├── ui/               # Reusable UI components (Button, Card, Modal, DataTable, etc.)
│   │   └── layout/           # Layout components (Sidebar, Header)
│   ├── stores/
│   │   └── auth.store.ts     # Zustand auth state management
│   ├── lib/
│   │   └── api.ts            # Axios instance with interceptors
│   ├── hooks/                # Custom React hooks
│   └── proxy.ts              # Route protection middleware
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Director Module (new)

```
backend/src/modules/director/
├── director.routes.ts        # Director-only endpoints
├── director.controller.ts    # Policy/report handlers
└── director.service.ts       # Business logic for UC22/UC23
```

### Knowledge Base

```
knowledge-base/
├── noi-qui-ktx.md            # Dormitory rules
├── quy-trinh-dang-ky-phong.md # Room registration process
├── huong-dan-thanh-toan.md   # Payment instructions
├── huong-dan-bao-su-co.md    # Incident reporting guide
├── bang-gia-phong.md         # Room pricing
└── faq.md                    # Frequently asked questions
```

---

## API Reference

Base URL: `/api/v1`

### Authentication (`/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new student | Public |
| POST | `/login` | Login | Public |
| POST | `/refresh` | Refresh access token | Public |
| POST | `/logout` | Logout | Auth |
| GET | `/me` | Get current user | Auth |
| PUT | `/me` | Update profile | Auth |
| PUT | `/change-password` | Change password | Auth |
| POST | `/forgot-password` | Request reset email | Public |
| POST | `/reset-password` | Reset with token | Public |
| GET | `/users` | List all users | Admin/Staff |
| POST | `/users` | Create user account | Admin |
| PUT | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Deactivate user | Admin |

### Director (`/director`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/policies/room-types` | List room types for policy review | Director/Admin |
| PUT | `/policies/room-types/:id/approve-price` | Approve/update room type price | Director/Admin |
| GET | `/reports/periodic` | Get periodic report (financial/occupancy) | Director/Admin |
| GET | `/reports/export` | Export periodic report (CSV/JSON) | Director/Admin |

### Rooms (`/rooms`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List rooms (with filters) | Auth |
| GET | `/available` | Available rooms by building/floor | Auth |
| GET | `/my-room` | Student's current room | Student |
| GET | `/:id` | Room details | Auth |
| POST | `/` | Create room | Admin/Staff |
| PUT | `/:id` | Update room | Admin/Staff |
| GET | `/types` | List room types | Auth |
| POST | `/types` | Create room type | Admin/Staff |

### Students (`/students`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List students | Admin/Staff |
| GET | `/by-code/:code` | Find by student code | Admin/Staff |
| GET | `/me` | Current student profile | Student |
| PUT | `/me` | Update own profile | Student |
| GET | `/my-contracts` | Student's contracts | Student |
| GET | `/:id` | Student details | Admin/Staff |

### Contracts (`/contracts`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List contracts | Auth |
| GET | `/:id` | Contract details | Auth |
| POST | `/` | Create contract | Admin/Staff |
| PUT | `/:id` | Update contract | Admin/Staff |
| PUT | `/:id/terminate` | Terminate contract | Admin/Staff |
| GET | `/:id/handover` | Get asset handover | Auth |
| POST | `/:id/handover` | Create asset handover | Admin/Staff |

> **Đăng ký phòng (UC01):** dùng module **`/registrations`** (bảng dưới đây). Trong `contract.routes.ts` vẫn có bản **legacy** `GET|POST|PUT /contracts/registrations` — frontend và luồng mới dùng **`/api/v1/registrations`**.

### Registrations (`/registrations`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/room-types` | Loại phòng phù hợp **giới tính** trong hồ sơ SV (`male`→`male_only`, `female`→`female_only`, `other`→`mixed`) | Student |
| GET | `/available` | Phòng còn chỗ theo `roomTypeId` (query), lọc theo giới tính SV + không ghép khác giới trong cùng phòng | Student |
| POST | `/` | Tạo đơn đăng ký — JSON body, **`documents`: string[]** (link công khai, VD Google Drive) | Student |
| GET | `/my` | Đơn đăng ký của sinh viên | Auth |
| POST | `/:id/cancel` | SV hủy đơn **pending** của mình | Student |
| POST | `/:id/upload-payment` | Upload biên lai/chứng từ cọc — `multipart/form-data`, field `paymentProof` | Student |
| GET | `/stats` | Thống kê đơn | Admin/Staff |
| GET | `/` | Danh sách đơn (filter phân trang) | Admin/Staff/Accountant |
| GET | `/:id` | Chi tiết đơn | Admin/Staff/Accountant |
| POST | `/:id/approve` | Duyệt + gán phòng → `deposit_pending` | Admin/Staff |
| POST | `/:id/reject` | Từ chối (body: `reviewNote`) | Admin/Staff |
| POST | `/:id/confirm-deposit` | Xác nhận cọc → `deposit_confirmed` | **Accountant** |
| POST | `/:id/reject-deposit` | Từ chối biên lai (body: `{ reason }`) → `deposit_pending` | **Accountant** |
| POST | `/:id/confirm-payment` | Tạo HĐ từ `deposit_confirmed` → `approved` | Admin/Staff |
| POST | `/:id/cancel-by-staff` | Hủy đơn (`pending` / `deposit_pending` / `deposit_paid` / `deposit_confirmed`); body tùy chọn `note` | Admin/Staff |

**`POST /registrations` — `documents` (minh chứng):**

- Sinh viên **không** upload file minh chứng lên server; dán **URL chia sẻ công khai** (khuyến nghị Google Drive: “Anyone with the link”).
- **Bắt buộc** ít nhất **1** link hợp lệ; tối đa **5** link; mỗi link ≤ **2048** ký tự; phải là `http(s)://` đầy đủ; **production** chỉ chấp nhận **https**.
- Thứ tự gợi ý UI: `[0]` minh chứng bản thân (CCCD/thẻ SV), `[1]` minh chứng hoàn cảnh (tùy chọn).

**Giới tính & loại phòng (`room_types.genderRestriction`):**

- Tạo loại phòng (admin/staff) **bắt buộc** chọn `male_only` / `female_only` / `mixed`.
- SV **nam** chỉ thấy và chỉ được chọn phòng loại **Nam**; **nữ** ↔ **Nữ**; giới tính **Khác** ↔ loại **mixed** (trường hợp đặc biệt).
- Kiểm tra cả **hợp đồng**, **duyệt đăng ký**, **chuyển phòng** để không ghép khác giới trong cùng phòng.

### Registration Status Flow

```
pending → [Staff duyệt] → deposit_pending → [SV upload biên lai] → deposit_paid
                                                              ↓
                                              [KT xác nhận] → deposit_confirmed → [Staff tạo HĐ] → approved
                                              [KT từ chối + lý do] → deposit_pending (SV upload lại)
```

### Invoices (`/invoices`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List invoices | Auth |
| GET | `/my-invoices` | Student's invoices | Student |
| GET | `/current` | Student's current invoice | Student |
| POST | `/generate` | Generate single invoice | Admin/Staff |
| POST | `/generate-batch` | Generate monthly batch | Admin/Staff |
| PUT | `/:id/pay` | Process payment | Admin/Staff |
| PUT | `/:id` | Update invoice | Admin/Staff |
| GET | `/stats/summary` | Invoice statistics | Admin/Staff |

### Handover (`/contracts`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/handover/pending` | Pending handovers list | Admin/Staff |
| POST | `/:id/handover` | Create handover record | Admin/Staff |
| GET | `/:id/handover` | Get handover details | Auth |
| PUT | `/:id/handover` | Update handover (meter readings, items) | Admin/Staff |
| POST | `/:id/handover/complete` | Complete handover | Admin/Staff |

### PDF Generation (`/pdf`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/deposit-receipt/:registrationId` | Generate deposit receipt PDF | Admin/Staff |
| GET | `/contract/:contractId` | Generate contract PDF | Admin/Staff/Student |

### Incidents (`/incidents`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List incidents | Auth |
| GET | `/my-incidents` | Student's incidents | Student |
| POST | `/` | Create incident | Auth |
| PUT | `/:id` | Update incident | Auth |
| PUT | `/:id/assign` | Assign to staff | Admin/Staff |
| PUT | `/:id/resolve` | Mark resolved | Admin/Staff |

### Chatbot (`/chatbot`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/sessions` | Create chat session | Auth |
| GET | `/sessions` | List user sessions | Auth |
| GET | `/sessions/:id` | Get session with messages | Auth |
| DELETE | `/sessions/:id` | Delete session | Auth |
| POST | `/send` | Send message (sync) | Auth |
| POST | `/stream` | Send message (SSE stream) | Auth |
| POST | `/admin/index` | Index knowledge base | Admin |
| GET | `/admin/stats` | Get chatbot stats | Admin |

### Notifications (`/notifications`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List notifications | Auth |
| GET | `/unread-count` | Count unread | Auth |
| PUT | `/:id/read` | Mark as read | Auth |
| PUT | `/read-all` | Mark all read | Auth |

---

## Code Patterns & Conventions

### Backend Module Structure

Each module follows this pattern:
```
modules/[module]/
├── [module].routes.ts      # Express Router definitions
├── [module].controller.ts  # Request handlers (calls service)
├── [module].service.ts     # Business logic (calls Prisma)
└── [module].validator.ts   # Zod schemas (optional)
```

### Controller Pattern

```typescript
import { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendCreated } from '../../common/utils/response'

class SomeController {
  getAll = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await someService.getAll(req.query)
    return sendSuccess(res, result)
  }
}

export const someController = new SomeController()
```

### Service Pattern

```typescript
import { PrismaClient } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

class SomeService {
  async getAll(query: { page?: string; limit?: string }) {
    const page = parseInt(query.page || '1')
    const limit = parseInt(query.limit || '10')
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.someModel.findMany({ skip, take: limit }),
      prisma.someModel.count()
    ])

    return { items, page, limit, total }
  }
}

export const someService = new SomeService()
```

### Route Protection

```typescript
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

// Public route
router.get('/public', asyncHandler(controller.publicMethod))

// Authenticated route
router.get('/protected', authenticate, asyncHandler(controller.protectedMethod))

// Role-restricted route
router.post('/admin-only', authenticate, requireRole('admin'), asyncHandler(controller.adminMethod))
```

### Error Handling

Use `AppError` class for controlled errors:
```typescript
import { AppError } from '../../common/utils/app-error'

// Available methods:
AppError.notFound('Resource')        // 404
AppError.unauthorized('Message')     // 401
AppError.forbidden('Message')        // 403
AppError.badRequest('Message')       // 400
AppError.conflict('Message')         // 409
AppError.internal('Message')         // 500
```

### Frontend Component Pattern

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'

export default function SomePage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/endpoint')
      setData(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Content */}
    </div>
  )
}
```

### Frontend API Calls

```typescript
import api from '@/lib/api'

// GET with params
const res = await api.get('/endpoint', { params: { page: 1, limit: 10 } })

// POST with body
const res = await api.post('/endpoint', { field: 'value' })

// PUT
const res = await api.put('/endpoint/:id', { field: 'value' })

// DELETE
await api.delete('/endpoint/:id')

// Response structure: res.data = { success: boolean, data: T, message?: string }
```

### State Management (Zustand)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SomeState {
  value: string
  setValue: (value: string) => void
}

export const useSomeStore = create<SomeState>()(
  persist(
    (set) => ({
      value: '',
      setValue: (value) => set({ value }),
    }),
    { name: 'some-storage' }
  )
)
```

---

## Database Schema Summary

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | Account credentials + role |
| `students` | Student profile (1:1 with users) |
| `staff_info` | Staff profile (1:1 with users) |
| `room_types` | Room categories with pricing |
| `rooms` | Physical rooms |
| `contracts` | Rental agreements |
| `asset_handovers` | Asset condition on contract start |
| `registration_requests` | Room registration workflow |
| `invoices` | Monthly billing |
| `incidents` | Maintenance tickets |
| `notifications` | User notifications |
| `chat_sessions` | Chatbot conversation sessions |
| `chat_messages` | Individual chat messages |
| `knowledge_base` | AI chatbot knowledge articles |
| `system_config` | Key-value config store |

### Key Relationships

- `users` (1) → (0..1) `students`
- `users` (1) → (0..1) `staff_info`
- `students` (1) → (n) `contracts`
- `rooms` (1) → (n) `contracts`
- `contracts` (1) → (0..1) `asset_handovers`
- `contracts` (1) → (n) `invoices`
- `users` (1) → (n) `chat_sessions` → (n) `chat_messages`

---

## Environment Variables

### Backend (`.env`)

```bash
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ktx_db?schema=public"

# Cache
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI/Chatbot
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
CHROMADB_URL=http://localhost:8000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment (VNPay)
VNPAY_TMN_CODE=your-tmncode
VNPAY_SECRET_KEY=your-secret-key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3001/api/v1/invoices/payment/callback

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## Important Workflows

### Creating a New Contract (Multi-step)

1. **Validate Student**: `GET /students/by-code/:code`
   - Check if student exists and has no active contract
2. **Select Room**: `GET /rooms/available`
   - Returns rooms grouped by building → floor
3. **Create Contract**: `POST /contracts`
   - Requires `studentId` (UUID), `roomId`, `startDate`, `monthlyRent`
4. **Asset Handover**: `POST /contracts/:id/handover`
   - Items loaded from `roomType.amenities.assetTemplates`

### Registration Approval Flow

1. Student creates: `POST /registrations` (JSON, gồm `documents: string[]` — link Google Drive công khai).
   - Nếu đã có đơn **pending**, hệ thống có thể **tự hủy** đơn cũ và thông báo staff (thay thế đơn mới).
2. Staff/Admin xem: `GET /registrations`
3. Approve: `POST /registrations/:id/approve` với body `roomId` (bắt buộc), `reviewNote` (tùy chọn) → **Chờ nộp cọc**
4. Student upload biên lai cọc: `POST /registrations/:id/upload-payment` (multipart `paymentProof`) → **Chờ kế toán xác nhận**
5. **Accountant** xác nhận cọc: `POST /registrations/:id/confirm-deposit` → **Cọc đã xác nhận**
6. **Accountant** từ chối biên lai: `POST /registrations/:id/reject-deposit` body `{ reason }` → quay về `deposit_pending` (SV upload lại)
7. Staff/Admin tạo hợp đồng: `POST /registrations/:id/confirm-payment` → tạo hợp đồng → `approved`
8. Reject: `POST /registrations/:id/reject` với `reviewNote`
9. Hủy đơn:
   - SV (chỉ **pending**): `POST /registrations/:id/cancel`
   - Staff/Admin (`pending` | `deposit_pending` | `deposit_paid` | `deposit_confirmed`): `POST /registrations/:id/cancel-by-staff` (optional `note`)

### Invoice Generation

1. Admin: `POST /invoices/generate` (single) or `POST /invoices/generate-batch` (all active contracts)
2. Calculates: room fee + electricity + water + other fees
3. Student pays: Admin processes via `PUT /invoices/:id/pay`

### Chatbot RAG Pipeline

1. User sends message to session
2. System retrieves student context (if student)
3. Query ChromaDB for relevant knowledge
4. Generate response via OpenRouter API
5. Save message with sources to database

---

## Testing Approach

Currently minimal test coverage. When adding tests:

1. **Backend**: Jest (configured in `package.json`)
   ```bash
   npm run test
   ```

2. **API smoke test + báo cáo HTML/Markdown** (`backend/`)
   ```bash
   cd backend && npm run test:api
   ```
   - Ghi file vào `backend/reports/` (`.html` mở bằng trình duyệt — in hoặc chụp màn hình đưa vào báo cáo; `.md` dán vào Word/Google Docs).
   - Tuỳ chọn: `API_URL`, `REPORT_OUTPUT_DIR`.

3. **Frontend**: No test framework configured yet

---

## Gotchas & Common Issues

### UUID Format
- All IDs are UUIDs. Always use UUID format in API calls.
- `studentId` in contract creation must be UUID, not `studentCode`.

### Prisma Client
- Run `npm run prisma:generate` after schema changes.
- Use transactions for multi-step operations: `prisma.$transaction(async (tx) => { ... })`

### Authentication
- Access tokens expire in 15 minutes.
- Frontend auto-refreshes via axios interceptor.
- Auth state stored in both localStorage and cookies (for middleware).

### Role-Based Access
- Backend uses `requireRole(...)` middleware with 6 roles: `admin`, `staff`, `accountant`, `technician`, `director`, `student`.
- Frontend uses portals: `/admin`, `/staff` (staff/accountant/technician), `/director`, `/student`.
- `proxy.ts` handles client-side route protection.

### Windows Prisma Lock (EPERM)
- If Prisma fails with `EPERM ... query_engine-windows.dll.node`, kill Node processes first:
  - `taskkill /F /IM node.exe`
- Then rerun:
  - `npx prisma generate`

### DateTime Handling
- Backend uses `DateTime` from Prisma (PostgreSQL `timestamp`).
- Frontend displays with `new Date(isoString).toLocaleDateString('vi-VN')`.

### Vietnamese Content
- UI text and data are in Vietnamese.
- Code comments and variable names in English.
- Use `vi-VN` locale for number/date formatting.

### Registration documents (minh chứng đăng ký phòng)
- Trường `documents` trong DB là **mảng URL** (string), không phải đường dẫn file trên server.
- **Biên lai / chứng từ cọc** sau khi duyệt hồ sơ vẫn lưu qua **`POST /registrations/:id/upload-payment`** → `paymentProofUrl` trỏ tới `/uploads/registrations/...` (static serve từ backend).
- UI admin/staff: mở link ngoài (Drive) trực tiếp; với bản ghi cũ có `/uploads/...`, frontend nối `NEXT_PUBLIC_API_URL` (bỏ `/api/v1`) làm host file.

### Chatbot Streaming
- Use `POST /chatbot/stream` for SSE streaming.
- Non-streaming: `POST /chatbot/send`.

---

## Use Case Implementation Status

Based on the use case specification, here's the current implementation status:

### Actor: Sinh Vien (Student)
| Use Case | Status | Notes |
|----------|--------|-------|
| UC01 Đăng ký phòng | Done | `POST /registrations` + link minh chứng (Google Drive) + upload biên lai cọc + priority scoring |
| UC02 Gia hạn hợp đồng | Done | `/renewals` module with eligibility check, reminders |
| UC03 Trả phòng | Done | `/returns` module with full return workflow |
| UC04 Thanh toán tiền phòng | Partial | Payment API exists, VNPay callback incomplete |
| UC05 Xem hóa đơn | Done | `/invoices/my-invoices` |
| UC06 Báo sự cố | Done | `/incidents` CRUD |
| UC07 Chat với AI | Done | `/chatbot` with RAG |
| UC08 Đăng ký tạm vắng | Done | `/temporary-leave` module with overdue tracking |

### Actor: Quản Lý KTX (Staff)
| Use Case | Status | Notes |
|----------|--------|-------|
| UC09 Duyệt hồ sơ đăng ký | Done | `/registrations` approve/reject/confirm-payment/cancel-by-staff |
| UC10 Phân phòng | Done | Via registration approval |
| UC11 Quản lý chuyển phòng | Done | `/transfers` module with fee calculation |
| UC12 Lập biên bản vi phạm | Done | `/violations` module with penalty levels |
| UC13 Quản lý hợp đồng | Done | Contract CRUD + handover |

### Actor: Kế Toán (Accountant)
| Use Case | Status | Notes |
|----------|--------|-------|
| UC14 Tạo hóa đơn hàng tháng | Done | Batch generation + meter reading review |
| UC15 Đối soát thanh toán | Done | `/reconciliation` module with discrepancy detection |
| UC16 Quản lý tiền cọc | Partial | Deposit field exists, tracked in contracts; no dedicated management UI |
| UC17 Xuất báo cáo tài chính | Done | `/financial-reports` module |

### Actor: Kỹ Thuật (Technician)
| Use Case | Status | Notes |
|----------|--------|-------|
| UC18 Tiếp nhận & xử lý ticket | Done | Incident assign/resolve |
| UC19 Lập lịch bảo trì | Done | `/maintenance` module with types/status |
| UC20 Nghiệm thu sửa chữa | Done | `/contracts/:id/handover/complete` + meter readings |

### Actor: Ban Giám Đốc (Director)
| Use Case | Status | Notes |
|----------|--------|-------|
| UC21 Dashboard tổng hợp | Done | `/director` portal + `/dashboard/stats` |
| UC22 Duyệt chính sách | Done | `/director/policies/room-types` + approve price |
| UC23 Xuất báo cáo định kỳ | Done | `/director/reports/periodic` + `/director/reports/export` |

### Actor: Admin IT
| Use Case | Status | Notes |
|----------|--------|-------|
| UC24 Quản lý tài khoản | Done | User CRUD |
| UC25 Cấu hình hệ thống | Done | `system_config` module with CRUD |
| UC26 Xem audit log | Done | `/audit-logs` with filters + audit logging in controllers |

### UC27 (New) - Ghi chỉ số điện nước
| Use Case | Status | Notes |
|----------|--------|-------|
| UC27 Ghi chỉ số điện nước | Done | `/meter-readings` module with anomaly detection |

### Supporting Features
| Feature | Status | Notes |
|---------|--------|-------|
| PDF Phiếu Thu | Done | `/pdf/deposit-receipt/:registrationId` |
| PDF Hợp đồng | Done | `/pdf/contract/:contractId` (draft + complete) |
| Bàn giao phòng & ký hợp đồng (UC20) | Done | Handover + meter readings + PDF contract |

---

## File Naming Conventions

- Backend modules: `[module].routes.ts`, `[module].controller.ts`, `[module].service.ts`
- Frontend pages: `page.tsx` in route directory
- Components: PascalCase files matching component name
- Database: snake_case columns, camelCase in Prisma client

---

## When Adding New Features

1. **Database changes**: Create migration
   ```bash
   cd backend
   npx prisma migrate dev --name description_of_change
   ```

2. **New API endpoint**: Add to module's routes file, create controller method, implement service

3. **New frontend page**: Create in appropriate route group `(admin)/`, `(staff)/`, or `(student)/`

4. **New knowledge for chatbot**: Add markdown file to `knowledge-base/` and reindex via `POST /chatbot/admin/index`

---

## Recent Implementation Notes (2026-03)

- Added full role model in codebase: `admin`, `staff`, `accountant`, `technician`, `director`, `student`.
- Added admin user management UI: `frontend/src/app/admin/users/page.tsx` and menu link in admin layout.
- Strengthened RBAC across modules (students/contracts/invoices/incidents/chatbot/notifications).
- Added Director portal and UC features:
  - `frontend/src/app/director/page.tsx` (UC21)
  - `frontend/src/app/director/policies/page.tsx` (UC22)
  - `frontend/src/app/director/reports/page.tsx` (UC23)
  - `backend/src/modules/director/*` for director APIs
- Fixed common runtime issues:
  - Registration 409 flow now shows clear UI message and checks active contract/pending request.
  - Invoice batch generation validates `invoiceMonth` to avoid `Invalid Date` Prisma errors.
  - Director revenue report handles missing dates safely (defaults to current month).
- Completed all remaining use cases:
  - UC02 Contract renewal: `backend/src/modules/renewals/*` + `frontend/src/app/student/renewals/`
  - UC03 Room return: `backend/src/modules/returns/*` with inspection and refund workflow
  - UC08 Temporary leave: `backend/src/modules/temporary-leave/*` + `frontend/src/app/student/temporary-leave/`
  - UC11 Room transfer: `backend/src/modules/transfers/*` + `frontend/src/app/student/transfer/` + staff management
  - UC12 Violations: `backend/src/modules/violations/*` + `frontend/src/app/staff/violations/`
  - UC15 Reconciliation: `backend/src/modules/reconciliation/*` + `frontend/src/app/staff/reconciliation/`
  - UC17 Financial reports: `backend/src/modules/financial-report/*`
  - UC19 Maintenance: `backend/src/modules/maintenance/*` + `frontend/src/app/staff/maintenance/`
  - UC25 System config: `backend/src/modules/system-config/*` with full CRUD
  - UC26 Audit log: `backend/src/modules/audit-log/*` + `frontend/src/app/admin/audit-logs/`
  - UC27 Meter readings: `backend/src/modules/meter-readings/*` + `frontend/src/app/staff/meter-readings/`
- UC20 Handover & contract PDF:
  - Added meter reading fields to AssetHandover schema (electricity/water initial, photos)
  - `PUT /contracts/:id/handover` - update with meter readings and CSVC checklist
  - `POST /contracts/:id/handover/complete` - finalize handover
  - `GET /contracts/handover/pending` - list pending handovers
  - `frontend/src/app/staff/handover/` - handover management and detail pages
- PDF Generation:
  - `backend/src/modules/pdf-generator/pdf-generator.service.ts` - PDFKit-based generation
  - `GET /api/v1/pdf/deposit-receipt/:registrationId` - Phieu Thu PDF
  - `GET /api/v1/pdf/contract/:contractId` - Hop Dong PDF (draft + complete)
- Audit logging integration in controllers (contracts, invoices, auth)
- **Đăng ký phòng (`/registrations`):** tạo đơn bằng JSON + `documents[]` (URL công khai, không lưu file minh chứng trên host); biên lai cọc vẫn multipart. SV hủy `POST /registrations/:id/cancel` (pending); staff `POST /registrations/:id/cancel-by-staff`. Frontend: `student/register`, `student/registrations`, `admin/registrations` (staff dùng chung).

### Bổ sung 2026-03-22 (Chatbot, Chroma, audit deps, Kế toán UI)

- **Chatbot streaming UI (`frontend/src/components/chat/ChatPanel.tsx`):**
  - `streamAccRef` đồng bộ nội dung SSE với ref để tránh race khi event `done` chạy trước khi state nhận hết chunk → không còn flash fallback sai.
  - Trạng thái chờ token đầu: copy “Đang xử lý câu hỏi” + gợi ý tra cứu tài liệu; `aria-live` cho accessibility.
  - Fallback khi thật sự không có nội dung: thông điệp trung tính (thử lại), không dùng giọng “ngoài phạm vi KTX”.
- **Prompt RAG / general chat (`backend/src/modules/chatbot/ai-config.ts`):** câu hỏi meta (“tôi có thể tra cứu / hỏi gì”) được coi là trong phạm vi; trả lời gọn theo vai trò, không từ chối như off-topic.
- **ChromaDB client:** dependency `@chroma-core/default-embed` trong `backend/package.json` — client `chromadb@3` có thể resolve embedding “default” từ server; RAG vẫn dùng OpenRouter qua `createEmbedding` + vector truyền sẵn. Ghi chú trong `backend/.env.example` và comment `ai-config.ts`.
- **`npm audit` / Prisma:** `backend/package.json` có `overrides.effect: ^3.20.0` (transitive từ `@prisma/config`) để vá GHSA-38f7-945m-qr2g khi Prisma chưa nâng `effect`.
- **Đối soát (`/reconciliation`):**
  - API stats trả `totalTransactions`, `totalMatched`, `totalDiscrepancies`; list báo cáo trong `reports` (Prisma: `paymentGateway`, chi tiết số liệu trong JSON `data`). Frontend `staff/reconciliation/page.tsx` chuẩn hóa response + chi tiết sai lệch (`gatewayAmount` / `systemAmount`).
  - `POST /reconciliation`: controller map `gateway` (body từ UI) → `paymentGateway` cho service.
- **Tiền cọc kế toán (`frontend/src/app/staff/deposits/page.tsx`):** tab “Chờ xác nhận” (`deposit_paid`) và “Lịch sử” (`deposit_confirmed`, `approved`); ghi chú phân biệt cọc đăng ký vs hóa đơn tháng / đối soát.
- **`GET /registrations`:** query `status` hỗ trợ **nhiều trạng thái** cách nhau dấu phẩy (vd. `deposit_confirmed,approved`); `findAll` include **`assignedRoom`** để UI hiển thị phòng đã gán.

---

## Quick Reference

| Task | Command/Location |
|------|-----------------|
| Start backend dev | `cd backend && npm run dev` |
| Start frontend dev | `cd frontend && npm run dev` |
| Start all services | `docker-compose up -d` |
| Open database GUI | `cd backend && npm run prisma:studio` |
| Reset database | `npx prisma migrate reset` |
| Check API health | `GET http://localhost:3001/health` |
| API smoke + báo cáo HTML/MD | `cd backend && npm run test:api` → `backend/reports/` |
| API base URL | `http://localhost:3001/api/v1` |
| Frontend URL | `http://localhost:3000` |
