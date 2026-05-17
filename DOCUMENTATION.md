# TÀI LIỆU HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ (KTX)

> Phiên bản: 1.0 | Cập nhật: 2026-05-02

---

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Yêu cầu môi trường](#3-yêu-cầu-môi-trường)
4. [Hướng dẫn cài đặt & chạy trên môi trường mới](#4-hướng-dẫn-cài đặt--chạy-trên-môi-trường-mới)
5. [Cấu hình hệ thống](#5-cấu-hình-hệ-thống)
6. [Cấu trúc cơ sở dữ liệu](#6-cấu-trúc-cơ-sở-dữ-liệu)
7. [Phân quyền & vai trò người dùng](#7-phân-quyền--vai-trò-người-dùng)
8. [Cổng thông tin theo vai trò (Frontend)](#8-cổng-thông-tin-theo-vai-trò-frontend)
9. [Luồng hoạt động Use Case chính](#9-luồng-hoạt-động-use-case-chính)
10. [Hệ thống Chatbot AI](#10-hệ-thống-chatbot-ai)
11. [API Reference](#11-api-reference)
12. [Cơ sở tri thức (Knowledge Base)](#12-cơ-sở-tri-thức-knowledge-base)
13. [Tạo PDF & In ấn](#13-tạo-pdf--in-ấn)
14. [Lỗi thường gặp & Cách xử lý](#14-lỗi-thường-gặp--cách-xử-lý)

---

## 1. Tổng quan dự án

### 1.1 Giới thiệu

Hệ thống Quản lý Ký túc xá (KTX) là giải pháp full-stack giúp tự động hóa toàn bộ quy trình quản lý ký túc xá sinh viên, tích hợp AI Chatbot hỗ trợ tra cứu 24/7. Hệ thống phục vụ nhiều vai trò người dùng: Admin, Quản lý, Kế toán, Kỹ thuật, Ban giám đốc và Sinh viên.

### 1.2 Công nghệ sử dụng

| Tầng | Công nghệ | Phiên bản |
|------|-----------|-----------|
| **Backend** | Node.js, Express.js, TypeScript | Node ≥ 20 |
| **ORM** | Prisma ORM | 6.x |
| **Database** | PostgreSQL | 16 |
| **Cache** | Redis | 7 |
| **Frontend** | Next.js (App Router), React, TypeScript | Next 16, React 19 |
| **Styling** | Tailwind CSS | 3.4 |
| **State Management** | Zustand | 5.x |
| **HTTP Client** | Axios | 1.7 |
| **AI/Chatbot** | OpenRouter API, ChromaDB (vector store) | RAG pipeline |
| **Validation** | Zod | 3.x |
| **PDF Generation** | PDFKit | 0.15 |
| **Container** | Docker, Docker Compose | - |

### 1.3 Danh sách module (Backend)

Hệ thống gồm **25 module** backend:

| Module | Mô tả |
|--------|-------|
| `auth` | Xác thực, đăng ký, đăng nhập, JWT, quên mật khẩu |
| `rooms` | Quản lý phòng & loại phòng |
| `students` | Hồ sơ sinh viên |
| `contracts` | Hợp đồng thuê phòng |
| `invoices` | Hóa đơn hàng tháng, thanh toán |
| `incidents` | Báo cáo sự cố, phân công xử lý |
| `chatbot` | AI Chatbot + RAG pipeline + Agentic tools |
| `notifications` | Thông báo người dùng |
| `registrations` | Đăng ký phòng (luồng hoàn chỉnh) |
| `returns` | Trả phòng |
| `renewals` | Gia hạn hợp đồng |
| `temporary-leave` | Đăng ký tạm vắng |
| `transfers` | Chuyển phòng |
| `violations` | Lập biên bản vi phạm |
| `reconciliation` | Đối soát thanh toán |
| `dashboard` | Thống kê tổng hợp |
| `director` | Portal Ban giám đốc (chính sách, báo cáo định kỳ) |
| `system-config` | Cấu hình hệ thống (key-value) |
| `audit-log` | Nhật ký hoạt động |
| `maintenance` | Lịch bảo trì |
| `financial-report` | Báo cáo tài chính |
| `meter-readings` | Ghi chỉ số điện nước (UC27) |
| `pdf-generator` | Tạo PDF (Phiếu thu, Hợp đồng) |
| `appointments` | Lịch hẹn xem phòng |
| `payments` | Mã QR thanh toán |

---

## 2. Kiến trúc hệ thống

### 2.1 Sơ đồ kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGƯỜI DÙNG                               │
│  Admin | Staff | Kế toán | Kỹ thuật | Giám đốc | Sinh viên     │
└──────────┬──────────────────────────────────────────────────────┘
           │  HTTP (Browser)
           ▼
┌──────────────────────────────┐
│     FRONTEND (Next.js)       │  Port 3000
│  - App Router               │
│  - Zustand (auth state)     │
│  - Tailwind CSS             │
│  - Axios + JWT interceptor  │
└──────────┬───────────────────┘
           │  REST API (/api/v1/*)
           ▼
┌──────────────────────────────┐
│     BACKEND (Express.js)     │  Port 3001
│  - JWT Authentication       │
│  - RBAC Middleware          │
│  - Rate Limiting            │
│  - 25 Business Modules      │
└──┬───────┬──────────┬───────┘
   │       │          │
   ▼       ▼          ▼
┌──────┐ ┌─────┐ ┌──────────┐
│ PgSQL│ │Redis│ │ChromaDB  │
│ 5433 │ │6379 │ │ 8001     │
└──────┘ └─────┘ └──────────┘
                    │
                    ▼
            ┌──────────────┐
            │  OpenRouter   │
            │  (LLM API)    │
            │  AI Chatbot   │
            └──────────────┘
```

### 2.2 Luồng xác thực (Authentication)

```
1. Người dùng gửi email + password → POST /auth/login
2. Backend kiểm tra bcrypt → phát JWT (access 15 phút, refresh 7 ngày)
3. Frontend lưu token: localStorage + cookie (accessToken)
4. Mọi request API kèm Header: Authorization: Bearer <token>
5. Khi access token hết hạn → Axios interceptor tự gọi POST /auth/refresh
6. Nếu refresh cũng hết → redirect về /login
```

### 2.3 Phân quyền (RBAC)

```
Mỗi route API được bảo vệ bởi middleware:
  authenticate  → kiểm tra JWT hợp lệ, gán req.user
  requireRole() → kiểm tra user.role có trong danh sách cho phép
```

6 vai trò: `admin`, `staff`, `accountant`, `technician`, `director`, `student`

### 2.4 Mẫu chuẩn Controller → Service → Prisma

```
Route (Express Router)
  → Controller (xử lý request/response, gọi service)
    → Service (logic nghiệp vụ, gọi Prisma)
      → Prisma Client (ORM → PostgreSQL)
```

Response API luôn tuân thủ format:
```json
{ "success": true, "data": {...}, "message": "..." }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

---

## 3. Yêu cầu môi trường

### 3.1 Phát triển cục bộ (Development)

| Phần mềm | Phiên bản tối thiểu |
|----------|---------------------|
| Node.js | ≥ 20.0.0 |
| npm | ≥ 10.x |
| PostgreSQL | ≥ 15 |
| Redis | ≥ 7 |
| Docker + Docker Compose | Tùy chọn (cho ChromaDB) |
| Git | Bất kỳ |

### 3.2 Triển khai Docker (Production)

| Phần mềm | Phiên bản |
|----------|-----------|
| Docker | ≥ 24 |
| Docker Compose | ≥ 2.20 |

---

## 4. Hướng dẫn cài đặt & chạy trên môi trường mới

### 4.1 Cách 1: Chạy bằng Docker Compose (Khuyên dùng cho Production)

Đây là cách nhanh nhất để triển khai toàn bộ hệ thống.

#### Bước 1: Clone dự án

```bash
git clone <url-kho-chua-du-an>
cd QuanLyKiTucXa
```

#### Bước 2: Tạo file `.env` ở thư mục gốc

```bash
# Tạo từ mẫu hoặc copy
cp .env.example .env
```

Nội dung file `.env` tối thiểu:

```env
# BẮT BUỘC - JWT Secret (thay bằng chuỗi ngẫu nhiên mạnh)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

# BẮT BUỘC - OpenRouter API Key (cho Chatbot AI)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx

# Tùy chọn - Dùng nếu muốn email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Tùy chọn - VNPay thanh toán
VNPAY_TMN_CODE=your-tmncode
VNPAY_SECRET_KEY=your-secret-key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3001/api/v1/invoices/payment/callback

# Tùy chọn - Cloudinary upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# URL Frontend (browser truy cập)
FRONTEND_URL=http://localhost:3000
```

#### Bước 3: Chạy Docker Compose

```bash
# Khởi động tất cả dịch vụ (postgres, redis, chromadb, backend, frontend)
docker-compose up -d

# Xem log
docker-compose logs -f

# Xem log riêng backend
docker-compose logs -f backend

# Xem log riêng frontend
docker-compose logs -f frontend
```

#### Bước 4: Xác nhận hệ thống hoạt động

```bash
# Kiểm tra API health
curl http://localhost:3001/health

# Mở trình duyệt
# Frontend: http://localhost:3000
# API:      http://localhost:3001/api/v1

# Đăng nhập admin mặc định
# Email: admin@ktx.edu.vn
# Mật khẩu: admin123
```

#### Bước 5: Index cơ sở tri thức cho Chatbot (tùy chọn)

```bash
# Gọi API index knowledge base
curl -X POST http://localhost:3001/api/v1/chatbot/admin/index \
  -H "Authorization: Bearer <admin-access-token>"
```

#### Lệnh quản lý Docker

```bash
docker-compose down          # Dừng tất cả dịch vụ
docker-compose down -v       # Dừng + xóa volumes (CẢNH BÁO: mất dữ liệu)
docker-compose restart       # Khởi động lại
docker-compose logs -f       # Theo dõi log
```

### 4.2 Cách 2: Phát triển cục bộ (Development)

Dùng khi cần chỉnh sửa code và chạy hot-reload.

#### Bước 1: Cài đặt công cụ

```bash
# Cài Node.js ≥ 20: https://nodejs.org/
# Cài PostgreSQL: https://www.postgresql.org/download/
# Cài Redis: https://redis.io/download/
# Cài Docker (cho ChromaDB): https://www.docker.com/
```

#### Bước 2: Clone & cài đặt dependencies

```bash
git clone <url-kho-chua-du-an>
cd QuanLyKiTucXa

# Cài backend
cd backend
npm install

# Cài frontend (mở terminal mới)
cd ../frontend
npm install
```

#### Bước 3: Cấu hình Backend

```bash
cd backend

# Tạo file .env
cp .env.example .env
```

Chỉnh sửa `backend/.env`:

```env
PORT=3001
NODE_ENV=development

# Database - đảm bảo PostgreSQL đã chạy
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ktx_db?schema=public"

# Redis - đảm bảo Redis đã chạy
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Chatbot AI
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
OPENROUTER_MODEL=deepseek/deepseek-v3.2

# ChromaDB - chạy qua Docker
CHROMADB_URL=http://localhost:8001

# Frontend
FRONTEND_URL=http://localhost:3000
```

#### Bước 4: Cấu hình Frontend

```bash
cd frontend

# Tạo file .env.local
```

Nội dung `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

#### Bước 5: Khởi tạo Database

```bash
cd backend

# Tạo database "ktx_db" trong PostgreSQL trước, rồi chạy:
npx prisma migrate dev    # Chạy migration tạo bảng
npx prisma generate       # Generate Prisma Client
npm run prisma:seed       # Seed dữ liệu admin mặc định
```

#### Bước 6: Chạy ChromaDB (cho Chatbot)

```bash
# Chạy riêng ChromaDB qua Docker
docker compose up -d chromadb
```

#### Bước 7: Chạy Backend & Frontend

```bash
# Terminal 1 - Backend (port 3001, hot-reload)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000, Turbopack)
cd frontend
npm run dev
```

#### Bước 8: Truy cập hệ thống

```
Frontend: http://localhost:3000
API:      http://localhost:3001/api/v1
Health:   http://localhost:3001/health

Admin mặc định:
  Email: admin@ktx.edu.vn
  Mật khẩu: admin123
```

### 4.3 Cách 3: Hybrid (Backend chạy cục bộ, Dịch vụ qua Docker)

Phù hợp khi muốn code backend/frontend nhưng dùng PostgreSQL, Redis, ChromaDB trong Docker.

```bash
# Chỉ chạy dịch vụ hạ tầng
docker-compose up -d postgres redis chromadb

# Backend và Frontend chạy cục bộ
cd backend && npm run dev
cd frontend && npm run dev
```

**Lưu ý:** Khi chạy backend cục bộ và PostgreSQL trong Docker, cổng PostgreSQL sẽ là `5433` trên host (docker-compose.yml map `5433:5432`). Cập nhật `DATABASE_URL` trong `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ktx_db?schema=public"
```

---

## 5. Cấu hình hệ thống

### 5.1 Biến môi trường Backend

| Biến | Bắt buộc | Mặc định | Mô tả |
|------|----------|----------|-------|
| `PORT` | Không | `3001` | Cổng chạy backend |
| `NODE_ENV` | Không | `development` | `development` / `production` |
| `DATABASE_URL` | Có | - | Chuỗi kết nối PostgreSQL |
| `REDIS_URL` | Không | `redis://localhost:6379` | Chuỗi kết nối Redis |
| `JWT_SECRET` | Có | - | Secret ký JWT (**phải thay đổi**) |
| `JWT_EXPIRES_IN` | Không | `15m` | Thời gian sống access token |
| `JWT_REFRESH_EXPIRES_IN` | Không | `7d` | Thời gian sống refresh token |
| `OPENROUTER_API_KEY` | Có (AI) | - | API Key OpenRouter cho Chatbot |
| `OPENROUTER_MODEL` | Không | `deepseek/deepseek-v3.2` | Model LLM chính |
| `OPENROUTER_LIGHT_MODEL` | Không | `qwen/qwen3.5-9b` | Model nhẹ (intent, summary) |
| `CHROMADB_URL` | Có (AI) | - | URL ChromaDB API |
| `FRONTEND_URL` | Có | `http://localhost:3000` | URL frontend (CORS) |
| `SMTP_HOST` | Không | - | SMTP server (gmail) |
| `SMTP_PORT` | Không | `587` | SMTP port |
| `SMTP_USER` | Không | - | Email gửi thông báo |
| `SMTP_PASS` | Không | - | App password email |

### 5.2 Cấu hình OpenRouter AI (Chatbot nâng cao)

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `OPENROUTER_EMBEDDING_MODEL` | `openai/text-embedding-3-small` | Model tạo embedding RAG |
| `MAX_TOKENS` | `4096` | Token tối đa response chính |
| `MAX_TOKENS_POLICY` | `2048` | Token tối đa câu trả lời chính sách |
| `MAX_TOKENS_GENERAL` | `512` | Token tối đa chat chung |
| `CHAT_USE_LEGACY_PIPELINE` | `0` | `0` = Agentic RAG (mới), `1` = Heuristic RAG (cũ) |
| `CHAT_MAX_TOOL_ROUNDS` | `5` | Số vòng LLM tối đa cho agent |
| `CHAT_AGENT_MODEL` | (giống `OPENROUTER_MODEL`) | Model riêng cho agent |

### 5.3 Seed data

Sau khi chạy seed, hệ thống tạo tài khoản admin:

```
Email: admin@ktx.edu.vn
Mật khẩu: admin123
Vai trò: admin
```

---

## 6. Cấu trúc cơ sở dữ liệu

### 6.1 Sơ đồ Entity Relationship

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  users   │────<│ students │     │room_types│────<│  rooms   │
│          │     │          │     │          │     │          │
│ id (PK)  │     │ id (PK)  │     │ id (PK)  │     │ id (PK)  │
│ email    │     │ user_id  │     │ name     │     │room_type │
│ role     │     │studentCd │     │ capacity │     │ building │
│password  │     │ gender   │     │ price    │     │ floor    │
└────┬─────┘     └────┬─────┘     └──────────┘     └────┬─────┘
     │                │                                    │
     │ 1:1            │ 1:n                                │ 1:n
     │                │                                    │
┌────┴─────┐     ┌────┴────────────────────────────────────┴────┐
│staff_info│     │                  contracts                     │
│          │     │                                                │
│ user_id  │     │ id (PK), student_id, room_id                  │
│ position │     │ status: active/expired/terminated/pending      │
│ depart.  │     │ monthlyRent, depositAmount                    │
└──────────┘     └──┬──────────┬──────────────────┬──────────────┘
                   │          │                  │
            ┌──────┴───┐ ┌───┴────────┐   ┌──────┴───────┐
            │ invoices │ │asset_hand- │   │ temporary_   │
            │          │ │  overs     │   │   leaves     │
            │ month    │ │ items (JS) │   └──────────────┘
            │ roomFee  │ │ meters    │
            │ electric │ └───────────┘
            │ water    │
            │ total    │
            └──────────┘
```

### 6.2 Danh sách bảng chính (23 bảng)

| Bảng | Mô tả |
|------|-------|
| `users` | Tài khoản người dùng (UUID, email, password hash, role) |
| `students` | Hồ sơ sinh viên (mã SV, CCCD, giới tính, khoa, nhóm ưu tiên) |
| `staff_info` | Hồ sơ nhân viên (chức vụ, phòng ban) |
| `room_types` | Loại phòng (tên, sức chứa, giá, giới hạn giới tính) |
| `rooms` | Phòng vật lý (số phòng, tầng, tòa, trạng thái, tiện ích) |
| `contracts` | Hợp đồng thuê (SV, phòng, ngày bắt đầu/kết thúc, tiền) |
| `asset_handovers` | Biên bản bàn giao CSVC (items JSON, chỉ số điện nước) |
| `invoices` | Hóa đơn hàng tháng (tiền phòng, điện, nước, phí khác) |
| `incidents` | Sự cố (danh mục, mức ưu tiên, trạng thái xử lý) |
| `registration_requests` | Đơn đăng ký phòng (luồng đa bước) |
| `notifications` | Thông báo người dùng |
| `chat_sessions` | Phiên chat AI |
| `chat_messages` | Tin nhắn chat AI (user + assistant) |
| `knowledge_base` | Cơ sở tri thức cho RAG |
| `system_config` | Cấu hình hệ thống (key-value) |
| `audit_log` | Nhật ký kiểm tra |
| `temporary_leaves` | Đăng ký tạm vắng |
| `violations` | Biên bản vi phạm |
| `room_transfers` | Yêu cầu chuyển phòng |
| `reconciliation_reports` | Báo cáo đối soát thanh toán |
| `return_requests` | Yêu cầu trả phòng |
| `scheduled_maintenance` | Lịch bảo trì |
| `meter_readings` | Chỉ số điện nước |
| `appointments` | Lịch hẹn xem phòng |
| `appointment_items` | Chi tiết lịch hẹn (liên kết đơn đăng ký) |

### 6.3 Enum quan trọng

| Enum | Giá trị |
|------|---------|
| `UserRole` | `admin`, `staff`, `student`, `accountant`, `technician`, `director` |
| `Gender` | `male`, `female`, `other` |
| `GenderRestriction` | `male_only`, `female_only`, `mixed` |
| `RoomStatus` | `available`, `occupied`, `maintenance`, `reserved` |
| `ContractStatus` | `active`, `expired`, `terminated`, `pending` |
| `InvoiceStatus` | `unpaid`, `paid`, `overdue`, `partial` |
| `RegistrationStatus` | `pending`, `deposit_pending`, `deposit_paid`, `deposit_confirmed`, `approved`, `rejected`, `cancelled` |
| `IncidentStatus` | `pending`, `in_progress`, `resolved`, `closed` |
| `IncidentPriority` | `low`, `medium`, `high`, `urgent` |

---

## 7. Phân quyền & vai trò người dùng

### 7.1 Ma trận quyền theo vai trò

| Chức năng | Admin | Staff | Kế toán | Kỹ thuật | GĐ | SV |
|-----------|:-----:|:-----:|:-------:|:--------:|:--:|:--:|
| Quản lý tài khoản | CRUD | - | - | - | - | - |
| Quản lý phòng & loại phòng | CRUD | R | - | R | R | R |
| Quản lý sinh viên | R | R | R | - | R | Của mình |
| Duyệt đăng ký phòng | X | X | X | - | - | Tạo |
| Xác nhận cọc | - | - | X | - | - | - |
| Tạo hợp đồng | X | X | - | - | - | - |
| Tạo/xử lý hóa đơn | X | X | X | - | R | R |
| Đối soát thanh toán | X | - | X | - | - | - |
| Báo cáo tài chính | X | - | X | - | R | - |
| Xử lý sự cố | X | X | - | X | - | Tạo |
| Lập lịch bảo trì | X | X | - | X | - | - |
| Ghi chỉ số điện nước | X | X | R | X | - | - |
| Vi phạm | X | X | - | - | R | R |
| Chuyển phòng | X | Duyệt | - | - | - | Tạo |
| Gia hạn hợp đồng | Tự động | X | - | - | - | Tạo |
| Trả phòng | X | X | - | - | - | Tạo |
| Tạm vắng | - | X | - | - | - | Tạo |
| Duyệt chính sách giá | X | - | - | - | X | - |
| Báo cáo định kỳ | X | - | - | - | X | - |
| Cấu hình hệ thống | CRUD | - | - | - | - | - |
| Xem audit log | X | - | - | - | - | - |
| Chatbot AI | Quản lý KB | X | X | X | X | X |

### 7.2 Routing Frontend theo vai trò

```
/admin/*      → Chỉ role: admin
/staff/*      → role: staff, accountant, technician (cùng chung portal)
/director/*   → role: director, admin
/student/*    → Chỉ role: student
```

Middleware `proxy.ts` tự động redirect:
- `/technician/*` và `/accountant/*` → `/staff/*`
- Trang `/` → redirect theo role
- Nếu truy cập sai portal → redirect về portal đúng

---

## 8. Cổng thông tin theo vai trò (Frontend)

### 8.1 Admin Portal (`/admin`)

Menu sidebar:
- Dashboard (thống kê tổng quan)
- Phòng (CRUD phòng)
- Loại phòng (CRUD loại phòng)
- Đăng ký phòng (duyệt đơn, phân phòng)
- Lịch hẹn xem phòng
- Sinh viên (xem danh sách)
- Hợp đồng (quản lý)
- Hóa đơn (tạo/xử lý)
- Duyệt chỉ số (điện nước)
- Sự cố (xem/xử lý)
- Tài khoản (quản lý user)
- Chatbot KB (quản lý cơ sở tri thức, index)
- Nhật ký HĐ (audit log)
- Thông báo
- Cài đặt (system config)

### 8.2 Staff/Accountant/Technician Portal (`/staff`)

Menu sidebar (hiện/ẩn theo role):
- **Chung:** Dashboard, Thông báo, Chat AI
- **Nghiệp vụ (Staff):** Sự cố, Bảo trì, Bàn giao phòng, Phòng, Đăng ký phòng, Lịch hẹn, Sinh viên, Hợp đồng, Chuyển phòng, Vi phạm
- **Tài chính:**
  - Kỹ thuật: Ghi chỉ số
  - Kế toán: Duyệt chỉ số, Tiền cọc, Hóa đơn, Đối soát, Báo cáo TC

### 8.3 Director Portal (`/director`)

Menu sidebar:
- Dashboard (tổng quan)
- Chính sách giá (duyệt giá loại phòng)
- Báo cáo (báo cáo định kỳ)
- Doanh thu
- Công suất
- Chat AI
- Thông báo

### 8.4 Student Portal (`/student`)

Menu sidebar:
- Trang chủ (xem hợp đồng, phòng hiện tại)
- Đăng ký phòng (ẩn nếu có HĐ active)
- Theo dõi đơn (các đơn đăng ký)
- Lịch hẹn xem phòng
- Hợp đồng
- Hóa đơn
- Sự cố
- Gia hạn hợp đồng
- Chuyển phòng
- Trả phòng
- Tạm vắng
- Chat AI
- Thông báo

### 8.5 Các trang công khai

| Trang | Mô tả |
|-------|-------|
| `/login` | Đăng nhập |
| `/register` | Đăng ký tài khoản sinh viên |
| `/chatbot` | Chatbot công khai (không cần đăng nhập) |

---

## 9. Luồng hoạt động Use Case chính

### 9.1 UC01 - Đăng ký phòng (Sinh viên → Staff → Kế toán → Staff)

Đây là luồng phức tạp nhất, đi qua nhiều vai trò và nhiều bước:

```
┌─────────┐    ┌───────┐    ┌────────┐    ┌───────┐
│ Sinh viên│    │ Staff │    │ Kế toán│    │ Staff │
└────┬────┘    └───┬───┘    └───┬────┘    └───┬───┘
     │             │            │             │
     │ Tạo đơn     │            │             │
     │ (JSON + URL │            │             │
     │  minh chứng)│            │             │
     │────────────>│            │             │
     │             │            │             │
     │  pending    │            │             │
     │             │            │             │
     │             │ Duyệt đơn  │             │
     │             │ + Chọn phòng             │
     │             │────────────>│             │
     │             │            │             │
     │             │ deposit_pending          │
     │             │ (giữ chỗ 3 ngày)         │
     │             │            │             │
     │ Upload      │            │             │
     │ biên lai    │            │             │
     │ cọc         │            │             │
     │────────────────────────>│             │
     │             │            │             │
     │             │ deposit_paid             │
     │             │            │             │
     │             │            │ Xác nhận    │
     │             │            │ biên lai    │
     │             │            │─────────────>│
     │             │            │             │
     │             │ deposit_confirmed        │
     │             │            │             │
     │             │            │   Tạo HĐ    │
     │             │            │   + Bàn giao │
     │             │            │<─────────────│
     │             │            │             │
     │             │            │   approved   │
     │             │            │             │
```

**Chi tiết từng bước:**

**Bước 1 - Sinh viên tạo đơn đăng ký:**
- `POST /api/v1/registrations`
- Body JSON: `preferredRoomTypeId`, `desiredStartDate`, `desiredDuration`, `documents` (mảng URL công khai, tối thiểu 1 link)
- Hệ thống kiểm tra: không có HĐ active, không có đơn đang chờ (có thì tự hủy đơn cũ pending)
- Tính điểm ưu tiên (nhóm A/B/C, khoa, năm nhất)
- Thông báo admin/staff có đơn mới
- Trạng thái: **`pending`**

**Bước 2 - Staff duyệt hồ sơ & phân phòng:**
- `POST /api/v1/registrations/:id/approve`
- Body: `{ roomId: string, reviewNote?: string }`
- Kiểm tra: phòng còn chỗ, đúng giới tính, không ghép khác giới
- Tính tiền cọc = giá phòng × 2 tháng
- Giữ chỗ 3 ngày cho SV nộp cọc
- Thông báo SV và kế toán
- Trạng thái: **`deposit_pending`**

**Bước 3 - Sinh viên nộp biên lai cọc:**
- `POST /api/v1/registrations/:id/upload-payment`
- Form-data: file `paymentProof` (ảnh biên lai)
- Lưu lên server `/uploads/registrations/...`
- Thông báo kế toán
- Trạng thái: **`deposit_paid`**

**Bước 4 - Kế toán xác nhận cọc:**
- `POST /api/v1/registrations/:id/confirm-deposit`
- Kế toán kiểm tra biên lai → xác nhận
- Nếu từ chối: `POST /:id/reject-deposit` với `{ reason }` → quay lại `deposit_pending`
- Thông báo staff
- Trạng thái: **`deposit_confirmed`**

**Bước 5 - Staff tạo hợp đồng:**
- `POST /api/v1/registrations/:id/confirm-payment`
- Tạo hợp đồng (active), tăng occupancy phòng
- Tạo biên bản bàn giao CSVC tự động
- Thông báo SV
- Trạng thái: **`approved`**

**Hủy đơn:**
- SV: `POST /:id/cancel` (chỉ `pending`)
- Staff: `POST /:id/cancel-by-staff` (`pending`, `deposit_pending`, `deposit_paid`, `deposit_confirmed`)

**Tự động hủy:** Đơn `deposit_pending` quá 3 ngày không nộp cọc → tự hủy, giải phóng phòng.

### 9.2 UC02 - Gia hạn hợp đồng

```
SV gửi yêu cầu gia hạn → Staff duyệt → Cập nhật endDate hợp đồng
```

- `POST /api/v1/renewals` - SV tạo yêu cầu
- Staff xem danh sách: `GET /api/v1/renewals`
- Staff duyệt: `POST /api/v1/renewals/:id/approve`
- Hệ thống kiểm tra điều kiện: hợp đồng sắp hết hạn (< 30 ngày), không có vi phạm chưa xử lý

### 9.3 UC03 - Trả phòng

```
SV gửi yêu cầu → Staff lập lịch kiểm tra → Kiểm tra CSVC → Tính hoàn cọc → Hoàn tất
```

1. SV: `POST /api/v1/returns` (lý do, ngày trả)
2. Staff: cập nhật `scheduledDate`, gán `inspectorId`
3. Inspector: kiểm tra phòng, ghi `damageNotes`, `damageAmount`
4. Staff: tính `refundAmount` (tiền cọc - thiệt hại)
5. Hoàn tất: cập nhật trạng thái, đánh dấu hợp đồng terminated

**Trạng thái:** `pending` → `scheduled` → `inspected` → `completed` / `cancelled`

### 9.4 UC05/UC14 - Tạo & Xem Hóa đơn

```
Staff/Kế toán tạo hóa đơn → SV xem → SV thanh toán → Staff ghi nhận
```

1. Tạo hóa đơn lẻ: `POST /api/v1/invoices/generate` (một HĐ)
2. Tạo lô: `POST /api/v1/invoices/generate-batch` (tất cả HĐ active, theo tháng)
3. Hóa đơn tính: tiền phòng + (điện mới - điện cũ) × đơn giá + (nước mới - nước cũ) × đơn giá + phí khác
4. SV xem: `GET /api/v1/invoices/my-invoices`
5. Thanh toán: `PUT /api/v1/invoices/:id/pay` (staff ghi nhận)
6. Hỗ trợ VNPay (sandbox)

### 9.5 UC06/UC18 - Báo cáo & Xử lý sự cố

```
SV báo sự cố → Staff/Kỹ thuật nhận → Xử lý → Đánh dấu resolved
```

1. Bất kỳ ai cũng có thể báo: `POST /api/v1/incidents`
2. Danh mục: `electrical`, `plumbing`, `furniture`, `network`, `security`, `other`
3. Staff phân công: `PUT /api/v1/incidents/:id/assign`
4. Kỹ thuật xử lý: cập nhật trạng thái `in_progress`
5. Đánh dấu hoàn thành: `PUT /api/v1/incidents/:id/resolve`

### 9.6 UC07 - Chat với AI Chatbot

```
SV hỏi câu hỏi → Hệ thống phân loại intent → Trả lời
```

**2 pipeline (cấu hình qua biến môi trường):**

**Pipeline 1 - Agentic RAG (mặc định, `CHAT_USE_LEGACY_PIPELINE=0`):**
1. LLM nhận câu hỏi + danh sách tools có quyền truy cập (theo RBAC)
2. LLM tự quyết định gọi tool:
   - `search_knowledge` → tìm trong ChromaDB (cơ sở tri thức KTX)
   - `get_student_payment_status` → truy vấn DB trả về tình trạng thanh toán
   - `get_student_room_contract` → truy vấn DB trả về phòng, hợp đồng
   - `get_student_overview` → tổng quan hồ sơ SV
   - `get_appointment_schedule` → lịch hẹn
3. LLM tổng hợp câu trả lời cuối từ kết quả tools

**Pipeline 2 - Legacy Heuristic (`CHAT_USE_LEGACY_PIPELINE=1`):**
1. Heuristic phân loại intent (từ khóa → intent)
2. Nếu là intent DB (hóa đơn, phòng, lịch) → truy vấn PostgreSQL → format Markdown
3. Nếu là intent chính sách/RAG → truy vấn ChromaDB → LLM tổng hợp
4. Nếu không khớp → LLM chat chung

**Streaming:** Dùng `POST /chatbot/stream` (SSE) cho trải nghiệm real-time.

### 9.7 UC08 - Đăng ký tạm vắng

```
SV đăng ký → Cập nhật trạng thái → Quá hạn tự đánh dấu overdue
```

- `POST /api/v1/temporary-leave` - Ngày đi, ngày về, lý do, số điện thoại liên hệ
- Trạng thái: `active` → `returned` (khi SV báo đã về) hoặc `overdue` (quá ngày về)
- SV hủy: cập nhật thành `cancelled`

### 9.8 UC11 - Chuyển phòng

```
SV gửi yêu cầu → Staff duyệt → Cập nhật hợp đồng & phòng
```

1. SV: `POST /api/v1/transfers` (fromRoomId, toRoomId, reason)
2. Staff duyệt: kiểm tra phòng đích còn chỗ, đúng giới tính
3. Tính phí chuyển phòng
4. Cập nhật: chuyển roomId trong hợp đồng, cập nhật occupancy

**Trạng thái:** `pending` → `approved` → `completed` / `rejected`

### 9.9 UC12 - Lập biên bản vi phạm

```
Staff/Kỹ thuật tạo biên bản → Xử lý (phạt) → Đóng
```

- `POST /api/v1/violations` - type, description, penaltyLevel (`low`, `medium`, `high`, `severe`)
- Có thể liên kết với sự cố (`incidentId`)
- penaltyAmount, penaltyApplied

### 9.10 UC15 - Đối soát thanh toán

```
Kế toán tạo báo cáo đối soát → So sánh với cổng thanh toán → Xác nhận
```

- `POST /api/v1/reconciliation` - month, paymentGateway, data (JSON chi tiết)
- Hệ thống phát hiện sai lệch giữa số liệu hệ thống và cổng thanh toán

### 9.11 UC19/UC20 - Bảo trì & Bàn giao phòng

**Bảo trì:**
- `POST /api/v1/maintenance` - title, type (`preventive`, `corrective`, `inspection`, `emergency`), roomId, scheduledAt
- Trạng thái: `scheduled` → `in_progress` → `completed` / `cancelled`

**Bàn giao phòng (khi ký HĐ):**
1. Tạo bàn giao tự động khi ký HĐ (từ CSVC phòng)
2. `PUT /api/v1/contracts/:id/handover` - cập nhật chỉ số điện nước, checklist CSVC
3. `POST /api/v1/contracts/:id/handover/complete` - hoàn tất bàn giao

### 9.12 UC22 - Duyệt chính sách giá (Giám đốc)

```
Giám đốc xem loại phòng → Duyệt/cập nhật giá
```

- `GET /api/v1/director/policies/room-types` - danh sách loại phòng
- `PUT /api/v1/director/policies/room-types/:id/approve-price` - cập nhật giá

### 9.13 UC23 - Báo cáo định kỳ (Giám đốc)

```
Giám đốc chọn kỳ → Xem báo cáo → Xuất CSV/JSON
```

- `GET /api/v1/director/reports/periodic?month=2026-03&type=financial`
- `GET /api/v1/director/reports/export?month=2026-03&format=csv`

### 9.14 UC27 - Ghi chỉ số điện nước

```
Kỹ thuật ghi chỉ số → Kế toán duyệt → Dùng cho tạo hóa đơn
```

1. Kỹ thuật: `POST /api/v1/meter-readings` (roomId, month, electricity, water, photos)
2. Hệ thống tự phát hiện bất thường (`isAnomaly`)
3. Kế toán duyệt: `PUT /api/v1/meter-readings/:id/approve`
4. Nếu không đạt: `PUT /:id/reject` → `remeasure` (yêu cầu đo lại)

**Trạng thái:** `draft` → `submitted` → `approved` / `rejected` / `remeasure`

### 9.15 UC24 - Quản lý tài khoản (Admin)

```
Admin tạo user → Gán role → Kích hoạt/Vô hiệu hóa
```

- `POST /api/v1/auth/users` - tạo tài khoản (tự động tạo staff_info cho staff/accountant/technician/director)
- `PUT /api/v1/auth/users/:id` - cập nhật thông tin
- `DELETE /api/v1/auth/users/:id` - vô hiệu hóa (soft delete, set `isActive = false`)

### 9.16 UC25 - Cấu hình hệ thống (Admin)

```
Admin quản lý key-value config → Áp dụng toàn hệ thống
```

- CRUD: `/api/v1/system-config`
- Ví dụ: giá điện, giá nước, hạn nộp cọc, giới hạn upload

### 9.17 UC26 - Nhật ký kiểm tra (Audit Log)

```
Hệ thống tự ghi mọi thao tác quan trọng → Admin xem & lọc
```

- Các hành vi được ghi: tạo/xóa user, duyệt HĐ, chatbot truy vấn DB, thay đổi cọc...
- `GET /api/v1/audit-logs` - lọc theo userId, action, entity, khoảng thời gian

---

## 10. Hệ thống Chatbot AI

### 10.1 Kiến trúc RAG (Retrieval-Augmented Generation)

```
Câu hỏi SV
    │
    ├── LLM phân loại intent → Chọn tool
    │       │
    │       ├── search_knowledge → ChromaDB
    │       │     └── Trả về documents liên quan (vector similarity)
    │       │
    │       ├── get_student_payment_status → PostgreSQL
    │       ├── get_student_room_contract → PostgreSQL
    │       ├── get_student_overview → PostgreSQL
    │       └── get_appointment_schedule → PostgreSQL
    │
    └── LLM tổng hợp câu trả lời từ kết quả tools
```

### 10.2 Tools có sẵn cho Agent

| Tool | Mô tả | Vai trò được phép |
|------|-------|-------------------|
| `search_knowledge` | Tìm trong cơ sở tri thức KTX | Tất cả |
| `get_student_payment_status` | Xem tình trạng thanh toán | SV, admin, staff |
| `get_student_room_contract` | Xem phòng & hợp đồng | SV, admin, staff |
| `get_student_overview` | Tổng quan hồ sơ SV | SV, admin, staff |
| `get_appointment_schedule` | Lịch hẹn | SV, admin, staff |
| `get_organization_unpaid_invoices` | Hóa đơn chưa trả | admin, staff |
| `get_organization_active_rooms` | Phòng đang sử dụng | admin, staff |

### 10.3 Cơ sở tri thức

File markdown trong thư mục `knowledge-base/`:

| File | Nội dung |
|------|----------|
| `noi-qui-ktx.md` | Nội quy ký túc xá |
| `quy-trinh-dang-ky-phong.md` | Quy trình đăng ký phòng |
| `huong-dan-thanh-toan.md` | Hướng dẫn thanh toán |
| `huong-dan-bao-su-co.md` | Hướng dẫn báo sự cố |
| `bang-gia-phong.md` | Bảng giá phòng |
| `faq.md` | Câu hỏi thường gặp |
| `huong-dan-tam-vang.md` | Hướng dẫn đăng ký tạm vắng |

**Indexing:** `POST /api/v1/chatbot/admin/index` (admin only) - đọc các file MD, chia nhỏ, tạo embedding, lưu vào ChromaDB.

---

## 11. API Reference

### 11.1 Base URL

```
Development: http://localhost:3001/api/v1
Production:  https://your-domain.com/api/v1
```

### 11.2 Authentication (`/auth`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/register` | Đăng ký SV | Public |
| POST | `/login` | Đăng nhập | Public |
| POST | `/refresh` | Làm mới token | Public |
| POST | `/logout` | Đăng xuất | Auth |
| GET | `/me` | Thông tin user hiện tại | Auth |
| PUT | `/me` | Cập nhật profile | Auth |
| PUT | `/change-password` | Đổi mật khẩu | Auth |
| POST | `/forgot-password` | Gửi email reset | Public |
| POST | `/reset-password` | Reset bằng token | Public |
| GET | `/users` | Danh sách user | Admin |
| POST | `/users` | Tạo user | Admin |
| PUT | `/users/:id` | Sửa user | Admin |
| DELETE | `/users/:id` | Vô hiệu hóa | Admin |

### 11.3 Rooms (`/rooms`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/` | Danh sách phòng (filter) | Auth |
| GET | `/available` | Phòng còn trống | Auth |
| GET | `/my-room` | Phòng hiện tại của SV | Student |
| GET | `/:id` | Chi tiết phòng | Auth |
| POST | `/` | Tạo phòng | Admin/Staff |
| PUT | `/:id` | Cập nhật phòng | Admin/Staff |
| GET | `/types` | Danh sách loại phòng | Auth |
| POST | `/types` | Tạo loại phòng | Admin/Staff |

### 11.4 Students (`/students`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/` | Danh sách SV | Admin/Staff |
| GET | `/by-code/:code` | Tìm theo mã SV | Admin/Staff |
| GET | `/me` | Profile SV hiện tại | Student |
| PUT | `/me` | Cập nhật profile | Student |
| GET | `/my-contracts` | Hợp đồng của SV | Student |
| GET | `/:id` | Chi tiết SV | Admin/Staff |

### 11.5 Contracts (`/contracts`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/` | Danh sách HĐ | Auth |
| GET | `/:id` | Chi tiết HĐ | Auth |
| POST | `/` | Tạo HĐ | Admin/Staff |
| PUT | `/:id` | Cập nhật HĐ | Admin/Staff |
| PUT | `/:id/terminate` | Chấm dứt HĐ | Admin/Staff |
| GET | `/:id/handover` | Bàn giao CSVC | Auth |
| POST | `/:id/handover` | Tạo bàn giao | Admin/Staff |
| PUT | `/:id/handover` | Cập nhật bàn giao | Admin/Staff |
| POST | `/:id/handover/complete` | Hoàn tất bàn giao | Admin/Staff |
| GET | `/handover/pending` | Bàn giao chờ xử lý | Admin/Staff |

### 11.6 Registrations (`/registrations`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/room-types` | Loại phòng theo giới tính SV | Student |
| GET | `/available` | Phòng còn chỗ | Student |
| POST | `/` | Tạo đơn đăng ký | Student |
| GET | `/my` | Đơn của SV | Auth |
| POST | `/:id/cancel` | SV hủy đơn | Student |
| POST | `/:id/upload-payment` | Upload biên lai cọc | Student |
| GET | `/stats` | Thống kê đơn | Admin/Staff |
| GET | `/` | Danh sách đơn (filter) | Admin/Staff/KT |
| GET | `/:id` | Chi tiết đơn | Admin/Staff/KT |
| POST | `/:id/approve` | Duyệt + gán phòng | Admin/Staff |
| POST | `/:id/reject` | Từ chối | Admin/Staff |
| POST | `/:id/confirm-deposit` | Xác nhận cọc | Accountant |
| POST | `/:id/reject-deposit` | Từ chối biên lai | Accountant |
| POST | `/:id/confirm-payment` | Tạo HĐ từ đơn | Admin/Staff |
| POST | `/:id/cancel-by-staff` | Staff hủy đơn | Admin/Staff |

### 11.7 Invoices (`/invoices`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/` | Danh sách hóa đơn | Auth |
| GET | `/my-invoices` | Hóa đơn của SV | Student |
| GET | `/current` | Hóa đơn hiện tại | Student |
| POST | `/generate` | Tạo hóa đơn lẻ | Admin/Staff |
| POST | `/generate-batch` | Tạo lô hóa đơn | Admin/Staff |
| PUT | `/:id/pay` | Ghi nhận thanh toán | Admin/Staff |
| PUT | `/:id` | Cập nhật hóa đơn | Admin/Staff |
| GET | `/stats/summary` | Thống kê hóa đơn | Admin/Staff |

### 11.8 Incidents (`/incidents`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/` | Danh sách sự cố | Auth |
| GET | `/my-incidents` | Sự cố của SV | Student |
| POST | `/` | Tạo sự cố | Auth |
| PUT | `/:id` | Cập nhật sự cố | Auth |
| PUT | `/:id/assign` | Phân công | Admin/Staff |
| PUT | `/:id/resolve` | Đánh dấu resolved | Admin/Staff |

### 11.9 Chatbot (`/chatbot`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/sessions` | Tạo phiên chat | Auth |
| GET | `/sessions` | Danh sách phiên | Auth |
| GET | `/sessions/:id` | Chi tiết phiên + tin nhắn | Auth |
| DELETE | `/sessions/:id` | Xóa phiên | Auth |
| POST | `/send` | Gửi tin nhắn (sync) | Auth |
| POST | `/stream` | Gửi tin nhắn (SSE stream) | Auth |
| POST | `/admin/index` | Index cơ sở tri thức | Admin |
| GET | `/admin/stats` | Thống kê chatbot | Admin |

### 11.10 Notifications (`/notifications`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/` | Danh sách thông báo | Auth |
| GET | `/unread-count` | Số chưa đọc | Auth |
| PUT | `/:id/read` | Đánh dấu đã đọc | Auth |
| PUT | `/read-all` | Đọc tất cả | Auth |

### 11.11 Các endpoint khác

| Module | Endpoint chính |
|--------|---------------|
| Director | `/director/policies/*`, `/director/reports/*` |
| System Config | `/system-config` (CRUD) |
| Audit Log | `/audit-logs` (GET + filter) |
| Renewals | `/renewals` (CRUD) |
| Returns | `/returns` (CRUD) |
| Temporary Leave | `/temporary-leave` (CRUD) |
| Transfers | `/transfers` (CRUD) |
| Violations | `/violations` (CRUD) |
| Reconciliation | `/reconciliation` (CRUD) |
| Maintenance | `/maintenance` (CRUD) |
| Meter Readings | `/meter-readings` (CRUD) |
| Financial Reports | `/financial-reports` (GET) |
| PDF | `/pdf/deposit-receipt/:id`, `/pdf/contract/:id` |
| Appointments | `/appointments` (CRUD) |
| Payments | `/payments` (QR) |

---

## 12. Cơ sở tri thức (Knowledge Base)

### 12.1 Nội dung

Hệ thống có 7 file markdown chứa quy định, hướng dẫn cho Chatbot:

- **Nội quy KTX:** Giờ giấc, quy định phòng, hành vi cấm, xử phạt
- **Quy trình đăng ký phòng:** Các bước đăng ký, yêu cầu hồ sơ
- **Hướng dẫn thanh toán:** Cách thanh toán, cổng thanh toán
- **Hướng dẫn báo sự cố:** Cách báo, phân loại sự cố
- **Bảng giá phòng:** Giá các loại phòng
- **FAQ:** Câu hỏi thường gặp
- **Hướng dẫn tạm vắng:** Quy trình đăng ký tạm vắng

### 12.2 Quản lý qua Admin

- Admin xem/chỉnh sửa KB: `/admin/knowledge`
- Index lại: `POST /api/v1/chatbot/admin/index` (đọc file MD → ChromaDB)
- CRUD trực tiếp qua API: add/update/delete knowledge entry

---

## 13. Tạo PDF & In ấn

### 13.1 Phiếu thu tiền cọc

```
GET /api/v1/pdf/deposit-receipt/:registrationId
```

- File PDF: Phiếu thu tiền cọc cho đơn đăng ký phòng
- Bao gồm: thông tin SV, phòng, số tiền cọc, ngày thu

### 13.2 Hợp đồng thuê phòng

```
GET /api/v1/pdf/contract/:contractId
```

- 2 trạng thái: **draft** (bản nháp) và **complete** (đã ký, kèm bàn giao)
- Bao gồm: thông tin các bên, điều khoản, phòng, giá, thời hạn, CSVC bàn giao

### 13.3 In ấn trên Frontend

- Trang in: `/print/*` (Next.js route group riêng)
- Hỗ trợ `window.print()` từ trình duyệt

---

## 14. Lỗi thường gặp & Cách xử lý

### 14.1 Prisma Lock trên Windows (EPERM)

**Lỗi:** `EPERM ... query_engine-windows.dll.node`

**Nguyên nhân:** Node.js đang giữ lock file của Prisma engine.

**Cách xử lý:**
```bash
# 1. Kill tất cả tiến trình Node
taskkill /F /IM node.exe

# 2. Xóa cache & generate lại
cd backend
rm -rf node_modules/.prisma
npx prisma generate
```

### 14.2 Lỗi Invalid Date khi tạo hóa đơn

**Nguyên cause:** `invoiceMonth` không đúng format.

**Cách xử lý:** Gửi format `YYYY-MM` (VD: `"2026-03"`).

### 14.3 Lỗi CORS

**Nguyên nhân:** Frontend URL không được thêm vào danh sách cho phép.

**Cách xử lý:** Kiểm tra biến `FRONTEND_URL` và `FRONTEND_ORIGINS` trong `.env`.

### 14.4 Access token hết hạn

**Hệ thống tự xử lý:** Axios interceptor tự động gọi `/auth/refresh` để lấy token mới. Nếu refresh token cũng hết → redirect về `/login`.

### 14.5 ChromaDB không kết nối

**Kiểm tra:**
```bash
# Xem ChromaDB có đang chạy không
docker ps | grep chromadb

# Test kết nối
curl http://localhost:8001/api/v1/heartbeat
```

### 14.6 Database chưa migrate

```bash
cd backend
npx prisma migrate dev    # Development
npx prisma migrate deploy # Production (Docker)
```

### 14.7 Reset toàn bộ database

```bash
cd backend
npx prisma migrate reset --force   # Xóa data + chạy lại migration
npm run prisma:seed                 # Seed lại admin
```

---

## Phụ lục A: Lệnh thường dùng

### Backend

```bash
cd backend
npm run dev              # Chạy dev server (port 3001, hot-reload)
npm run build            # Build TypeScript → dist/
npm run start            # Chạy production build
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Chạy migration (dev)
npm run prisma:studio    # Mở GUI quản lý DB
npm run prisma:seed      # Seed dữ liệu admin
npm run lint             # ESLint check
npm run test             # Jest tests
npm run test:api         # API smoke test + báo cáo HTML
npm run reset-db         # Reset database
```

### Frontend

```bash
cd frontend
npm run dev              # Chạy dev server (port 3000, Turbopack)
npm run build            # Build production
npm run start            # Chạy production
npm run lint             # Next.js ESLint
```

### Docker

```bash
docker-compose up -d         # Khởi động tất cả
docker-compose down          # Dừng tất cả
docker-compose down -v       # Dừng + xóa volumes
docker-compose logs -f       # Xem log
docker-compose restart       # Khởi động lại
docker-compose build         # Build lại images
docker-compose up -d --build # Build + chạy
```

---

## Phụ lục B: Cấu trúc thư mục chi tiết

### Backend (`backend/src/`)

```
src/
├── index.ts                    # Entry point, khởi động server
├── app.ts                      # Express app, middleware, mount routes
├── common/
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # JWT auth + RBAC
│   │   ├── error.middleware.ts # Xử lý lỗi tập trung
│   │   └── not-found.middleware.ts
│   ├── types/                  # Shared TypeScript types
│   ├── utils/
│   │   ├── app-error.ts        # Lớp AppError (404, 400, 401...)
│   │   ├── response.ts         # sendSuccess, sendPaginated, sendError
│   │   ├── async-handler.ts    # Wrapper async/await cho Express
│   │   ├── email.ts            # Gửi email (nodemailer)
│   │   ├── handover-items.ts   # Xây dựng danh sách CSVC bàn giao
│   │   ├── qr-generator.ts     # Tạo mã QR
│   │   └── room-gender.ts      # Logic kiểm tra giới tính phòng
│   └── validators/             # Zod schemas
└── modules/ (25 modules)
    └── [module]/
        ├── [module].routes.ts      # Express Router
        ├── [module].controller.ts  # Request handlers
        ├── [module].service.ts     # Business logic
        └── [module].validator.ts   # Zod validation (optional)
```

### Frontend (`frontend/src/`)

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Trang gốc (redirect theo role)
│   ├── globals.css             # CSS toàn cục + Tailwind
│   ├── login/                  # Trang đăng nhập
│   ├── register/               # Trang đăng ký
│   ├── chatbot/                # Chatbot công khai
│   ├── admin/                  # Portal Admin (16 trang)
│   │   ├── layout.tsx          # Layout + Sidebar
│   │   ├── page.tsx            # Dashboard
│   │   ├── rooms/              # Quản lý phòng
│   │   ├── room-types/         # Loại phòng
│   │   ├── registrations/      # Đăng ký phòng
│   │   ├── contracts/          # Hợp đồng
│   │   ├── invoices/           # Hóa đơn
│   │   ├── students/           # Sinh viên
│   │   ├── incidents/          # Sự cố
│   │   ├── users/              # Tài khoản
│   │   ├── knowledge/          # Chatbot KB
│   │   ├── audit-logs/         # Nhật ký HĐ
│   │   ├── meter-readings/     # Chỉ số điện nước
│   │   ├── appointments/       # Lịch hẹn
│   │   ├── notifications/      # Thông báo
│   │   └── settings/           # Cấu hình hệ thống
│   ├── staff/                  # Portal Staff (20 trang)
│   │   ├── layout.tsx          # Layout (lọc menu theo role)
│   │   ├── incidents/          # Sự cố
│   │   ├── maintenance/        # Bảo trì
│   │   ├── handover/           # Bàn giao
│   │   ├── rooms/              # Phòng
│   │   ├── registrations/      # Đăng ký phòng
│   │   ├── transfers/          # Chuyển phòng
│   │   ├── violations/         # Vi phạm
│   │   ├── invoices/           # Hóa đơn
│   │   ├── deposits/           # Tiền cọc
│   │   ├── reconciliation/     # Đối soát
│   │   ├── financial-reports/  # Báo cáo TC
│   │   ├── meter-readings/     # Chỉ số điện nước
│   │   └── ...
│   ├── student/                # Portal Sinh viên (15 trang)
│   │   ├── layout.tsx          # Layout (ẩn "Đăng ký phòng" nếu có HĐ)
│   │   ├── register/           # Đăng ký phòng
│   │   ├── registrations/      # Theo dõi đơn
│   │   ├── contract/           # Hợp đồng
│   │   ├── invoices/           # Hóa đơn
│   │   ├── incidents/          # Sự cố
│   │   ├── renewals/           # Gia hạn
│   │   ├── transfer/           # Chuyển phòng
│   │   ├── returns/            # Trả phòng
│   │   ├── temporary-leave/    # Tạm vắng
│   │   ├── chatbot/            # Chat AI
│   │   └── ...
│   └── director/               # Portal Giám đốc (8 trang)
│       ├── layout.tsx
│       ├── page.tsx            # Dashboard tổng hợp
│       ├── policies/           # Chính sách giá
│       ├── reports/            # Báo cáo định kỳ
│       ├── revenue/            # Doanh thu
│       ├── occupancy/          # Công suất
│       └── ...
├── components/
│   ├── ui/                     # 12 component tái sử dụng
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── DataTable.tsx       # Bảng dữ liệu + phân trang + sort
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── StatsCard.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── InvoicePrintModal.tsx
│   │   └── PaymentModal.tsx
│   ├── layout/
│   │   ├── NotificationDropdown.tsx
│   │   └── NotificationsPageContent.tsx
│   └── chat/
│       └── ChatPanel.tsx       # Giao diện chat AI + SSE streaming
├── stores/
│   └── auth.store.ts           # Zustand: user, tokens, login/logout
├── lib/
│   ├── api.ts                  # Axios instance + JWT interceptor
│   ├── currency.ts             # Format tiền VND
│   ├── handover-from-amenities.ts
│   └── role-home.ts            # Map role → portal path
├── hooks/                      # Custom React hooks
└── proxy.ts                    # Next.js middleware: auth + RBAC routing
```

---

*Tài liệu này được tạo tự động từ việc phân tích toàn bộ source code dự án.*
