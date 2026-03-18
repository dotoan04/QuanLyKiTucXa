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
| GET | `/registrations` | List registration requests | Admin/Staff |
| PUT | `/registrations/:id/approve` | Approve request | Admin/Staff |
| PUT | `/registrations/:id/reject` | Reject request | Admin/Staff |

### Invoices (`/invoices`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List invoices | Auth |
| GET | `/my-invoices` | Student's invoices | Student |
| GET | `/current` | Student's current invoice | Student |
| POST | `/generate` | Generate single invoice | Admin/Staff |
| POST | `/generate-batch` | Generate monthly batch | Admin/Staff |
| PUT | `/:id/pay` | Process payment | Admin/Staff |
| GET | `/stats/summary` | Invoice statistics | Admin/Staff |

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

1. Student creates: `POST /contracts/registrations`
2. Admin views: `GET /contracts/registrations`
3. Approve: `PUT /contracts/registrations/:id/approve` with `roomId`
   - Auto-creates contract
4. Reject: `PUT /contracts/registrations/:id/reject` with `reviewNote`

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

2. **Frontend**: No test framework configured yet

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

### Chatbot Streaming
- Use `POST /chatbot/stream` for SSE streaming.
- Non-streaming: `POST /chatbot/send`.

---

## Use Case Implementation Status

Based on the use case specification, here's the current implementation status:

### Actor: Sinh Vien (Student)
| Use Case | Status | Notes |
|----------|--------|-------|
| UC01 Đăng ký phòng | Partial | Registration request API exists, frontend flow needed |
| UC02 Gia hạn hợp đồng | Not implemented | |
| UC03 Trả phòng | Partial | Terminate contract exists, full workflow needed |
| UC04 Thanh toán tiền phòng | Partial | Payment API exists, VNPay callback incomplete |
| UC05 Xem hóa đơn | Done | `/invoices/my-invoices` |
| UC06 Báo sự cố | Done | `/incidents` CRUD |
| UC07 Chat với AI | Done | `/chatbot` with RAG |
| UC08 Đăng ký tạm vắng | Not implemented | |

### Actor: Quản Lý KTX (Staff)
| Use Case | Status | Notes |
|----------|--------|-------|
| UC09 Duyệt hồ sơ đăng ký | Done | Registration approve/reject |
| UC10 Phân phòng | Done | Via registration approval |
| UC11 Quản lý chuyển phòng | Not implemented | |
| UC12 Lập biên bản vi phạm | Not implemented | |
| UC13 Quản lý hợp đồng | Done | Contract CRUD + handover |

### Actor: Kế Toán (Accountant)
| Use Case | Status | Notes |
|----------|--------|-------|
| UC14 Tạo hóa đơn hàng tháng | Done | Batch generation |
| UC15 Đối soát thanh toán | Not implemented | |
| UC16 Quản lý tiền cọc | Partial | Deposit field exists |
| UC17 Xuất báo cáo tài chính | Not implemented | |

### Actor: Kỹ Thuật (Technician)
| Use Case | Status | Notes |
|----------|--------|-------|
| UC18 Tiếp nhận & xử lý ticket | Partial | Incident assign/resolve |
| UC19 Lập lịch bảo trì | Not implemented | |
| UC20 Nghiệm thu sửa chữa | Not implemented | |

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
| UC25 Cấu hình hệ thống | Partial | `system_config` table exists |
| UC26 Xem audit log | Not implemented | |

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
| API base URL | `http://localhost:3001/api/v1` |
| Frontend URL | `http://localhost:3000` |
