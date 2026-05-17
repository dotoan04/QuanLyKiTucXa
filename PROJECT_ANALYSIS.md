# PHÂN TÍCH CHI TIẾT HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ (KTX)

> Cập nhật: 22/03/2026 — Dựa trên source code mới nhất của dự án.

---

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Công nghệ sử dụng](#3-công-nghệ-sử-dụng)
4. [Các Actors (Vai trò người dùng)](#4-các-actors-vai-trò-người-dùng)
5. [Mô hình dữ liệu (Database Schema)](#5-mô-hình-dữ-liệu-database-schema)
6. [Phân tích Use Cases & Nghiệp vụ](#6-phân-tích-use-cases--nghiệp-vụ)
7. [Danh sách API Endpoints hoàn chỉnh](#7-danh-sách-api-endpoints-hoàn-chỉnh)
8. [Frontend Pages & Portal Structure](#8-frontend-pages--portal-structure)
9. [Knowledge Base cho Chatbot AI](#9-knowledge-base-cho-chatbot-ai)
10. [Cơ chế bảo mật & phân quyền](#10-cơ-chế-bảo-mật--phân-quyền)
11. [Deployment & Infrastructure](#11-deployment--infrastructure)

---

## 1. Tổng quan dự án

### Mô tả
Hệ thống Quản lý Ký túc xá (KTX) là giải pháp full-stack phục vụ quản lý toàn diện hoạt động của ký túc xá sinh viên, tích hợp AI Chatbot hỗ trợ 24/7 thông qua RAG pipeline.

### Phạm vi
- Quản lý sinh viên, phòng ở, hợp đồng thuê
- Quy trình đăng ký, gia hạn, chuyển, trả phòng
- Quản lý hóa đơn, thanh toán, đối soát tài chính
- Xử lý sự cố, bảo trì, vi phạm
- Báo cáo tổng hợp cho Ban giám đốc
- Hỗ trợ sinh viên qua AI Chatbot (RAG + ChromaDB)
- Quản lý tài khoản, cấu hình hệ thống, audit log

### Quy mô
- **24 backend modules** (routes)
- **63 frontend pages** (page.tsx)
- **24 database tables/models**
- **150+ API endpoints**
- **27 Use Cases** đã triển khai

---

## 2. Kiến trúc hệ thống

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                       │
│         Port 3000 — React 19 + TypeScript + Tailwind CSS           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                  │
│  │  Admin   │ │  Staff  │ │Director │ │ Student │                  │
│  │ Portal  │ │ Portal  │ │ Portal  │ │ Portal  │                  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘                  │
│       └───────────┴───────────┴───────────┘                        │
│                         │ Axios + JWT                              │
└─────────────────────────┼───────────────────────────────────────────┘
                          │ HTTP / SSE (streaming)
┌─────────────────────────┼───────────────────────────────────────────┐
│                  BACKEND (Express.js + TypeScript)                  │
│                   Port 3001 — REST API v1                          │
│  ┌──────────────────────────────────────────────────────┐           │
│  │           Middleware Layer                            │           │
│  │  helmet → cors → morgan → rate-limit → auth → RBAC   │           │
│  └──────────────────────────────────────────────────────┘           │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │  Auth    │  Rooms   │Students  │Contracts │Invoices  │  ...24   │
│  │  Module  │  Module  │  Module  │  Module  │  Module  │ modules  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘          │
└──────────┬──────────────────┬──────────────────┬────────────────────┘
           │                  │                  │
    ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐
    │ PostgreSQL  │   │    Redis    │   │  ChromaDB   │
    │  (port 5433)│   │  (port 6379)│   │ (port 8001) │
    └─────────────┘   └─────────────┘   └─────────────┘
         │                                   │
    ┌────┴────────────────────────────────────┴────┐
    │           External Services                   │
    │  OpenRouter API (AI/LLM)                    │
    │  SMTP Email (Nodemailer)                     │
    │  VNPay / MoMo (Payment Gateway)             │
    └──────────────────────────────────────────────┘
```

### Backend Module Pattern
Mỗi module tuân thủ cấu trúc chuẩn:
```
modules/[module]/
├── [module].routes.ts      # Định nghĩa Express Router + endpoints
├── [module].controller.ts  # Request handlers (gọi service)
├── [module].service.ts     # Business logic (gọi Prisma)
└── [module].validator.ts   # Zod validation schemas (optional)
```

---

## 3. Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Node.js | >=20.0.0 | Runtime |
| Express.js | ^4.21.0 | Web framework |
| TypeScript | ^5.6.0 | Type safety |
| Prisma ORM | ^6.19.2 | Database ORM |
| PostgreSQL | 16 | Relational database |
| Redis | 7 (ioredis) | Caching |
| ChromaDB | latest | Vector store (RAG) |
| JWT (jsonwebtoken) | ^9.0.2 | Authentication |
| bcrypt | ^6.0.0 | Password hashing |
| Zod | ^3.23.8 | Input validation |
| PDFKit | ^0.15.0 | PDF generation |
| Multer | ^1.4.5 | File upload |
| Nodemailer | ^8.0.2 | Email sending |
| Helmet | ^8.0.0 | Security headers |
| Morgan | ^1.10.0 | HTTP logging |
| express-rate-limit | ^7.4.1 | Rate limiting |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Next.js | ^16.1.0 | React framework (App Router) |
| React | ^19.0.0 | UI library |
| TypeScript | ^5.7.0 | Type safety |
| Tailwind CSS | ^3.4.17 | Utility-first CSS |
| Zustand | ^5.0.0 | State management |
| Axios | ^1.7.7 | HTTP client |
| TanStack React Query | ^5.60.0 | Data fetching |
| Lucide React | ^0.468.0 | Icon library |
| react-hot-toast | ^2.4.1 | Toast notifications |
| react-markdown | ^10.1.0 | Markdown rendering (Chatbot) |
| date-fns | ^4.1.0 | Date formatting |
| clsx | ^2.1.1 | Conditional classNames |

### Infrastructure
| Công nghệ | Mục đích |
|-----------|----------|
| Docker Compose | Container orchestration |
| PostgreSQL 16-alpine | Database container |
| Redis 7-alpine | Cache container |
| ChromaDB latest | Vector DB container |

---

## 4. Các Actors (Vai trò người dùng)

Hệ thống có **6 vai trò** được định nghĩa trong enum `UserRole`:

### 4.1 Admin (Quản trị viên hệ thống)
- **Mô tả**: Quản trị IT toàn hệ thống, có quyền cao nhất
- **Phạm vi truy cập**: Tất cả modules và endpoints
- **Portal**: `/admin`
- **Màu chủ đạo**: Xanh dương (blue)
- **Trách nhiệm chính**:
  - Quản lý tài khoản người dùng (CRUD) (UC24)
  - Quản lý phòng, loại phòng
  - Quản lý đăng ký phòng, duyệt hồ sơ
  - Quản lý hợp đồng, hóa đơn
  - Quản lý sự cố, bảo trì
  - Quản lý Knowledge Base chatbot
  - Cấu hình hệ thống (UC25)
  - Xem audit log (UC26)
  - Lịch hẹn xem phòng (Appointments)

### 4.2 Staff (Nhân viên quản lý KTX)
- **Mô tả**: Nhân viên vận hành hàng ngày
- **Phạm vi truy cập**: Hầu hết nghiệp vụ vận hành
- **Portal**: `/staff` (chia sẻ với accountant và technician)
- **Màu chủ đạo**: Xanh lá (green)
- **Trách nhiệm chính**:
  - Duyệt hồ sơ đăng ký phòng (UC09)
  - Phân phòng cho sinh viên (UC10)
  - Quản lý hợp đồng (UC13)
  - Quản lý chuyển phòng (UC11)
  - Lập biên bản vi phạm (UC12)
  - Bàn giao phòng (UC20)
  - Quản lý sự cố (UC18 partial)
  - Lịch hẹn xem phòng
  - Quản lý sinh viên

### 4.3 Accountant (Kế toán)
- **Mô tả**: Xử lý nghiệp vụ tài chính
- **Phạm vi truy cập**: Portal `/staff` (cùng giao diện, menu được lọc theo role)
- **Menu hiển thị riêng**: Hợp đồng, Hóa đơn, Tiền cọc, Đối soát, Báo cáo TC
- **Trách nhiệm chính**:
  - Tạo hóa đơn hàng tháng (UC14)
  - Xác nhận cọc đăng ký phòng
  - Từ chối biên lai cọc
  - Đối soát thanh toán (UC15)
  - Quản lý tiền cọc (UC16 partial)
  - Xuất báo cáo tài chính (UC17)
  - Duyệt chỉ số điện nước

### 4.4 Technician (Kỹ thuật viên)
- **Mô tả**: Nhân viên kỹ thuật bảo trì
- **Phạm vi truy cập**: Portal `/staff` (menu được lọc theo role)
- **Menu hiển thị riêng**: Sự cố, Bảo trì, Bàn giao, Ghi chỉ số điện nước
- **Trách nhiệm chính**:
  - Tiếp nhận & xử lý ticket sự cố (UC18)
  - Lập lịch bảo trì (UC19)
  - Nghiệm thu bàn giao phòng (UC20)
  - Ghi chỉ số điện nước (UC27)
  - Đọc số điện, số nước hàng tháng
  - Đánh dấu đồng hồ không đọc được

### 4.5 Director (Ban giám đốc)
- **Mô tả**: Lãnh đạo KTX, giám sát tổng thể
- **Phạm vi truy cập**: Portal riêng `/director`
- **Màu chủ đạo**: Vàng cam (amber/warning)
- **Trách nhiệm chính**:
  - Dashboard tổng hợp (UC21)
  - Duyệt chính sách giá phòng (UC22)
  - Xuất báo cáo định kỳ (UC23)
  - Xem doanh thu
  - Xem công suất sử dụng
  - Chat AI hỗ trợ

### 4.6 Student (Sinh viên)
- **Mô tả**: Người dùng cuối — sinh viên ở KTX
- **Phạm vi truy cập**: Portal riêng `/student`
- **Màu chủ đạo**: Xanh dương (blue)
- **Trách nhiệm chính**:
  - Đăng ký phòng (UC01)
  - Gia hạn hợp đồng (UC02)
  - Trả phòng (UC03)
  - Thanh toán tiền phòng (UC04)
  - Xem hóa đơn (UC05)
  - Báo sự cố (UC06)
  - Chat AI hỗ trợ (UC07)
  - Đăng ký tạm vắng (UC08)
  - Chuyển phòng (UC11)
  - Lịch hẹn xem phòng

---

## 5. Mô hình dữ liệu (Database Schema)

### 5.1 Danh sách Models (24 tables)

| # | Model | Table | Mô tả |
|---|-------|-------|-------|
| 1 | User | users | Thông tin tài khoản, phân quyền |
| 2 | Student | students | Hồ sơ sinh viên (1:1 với User) |
| 3 | StaffInfo | staff_info | Hồ sơ nhân viên (1:1 với User) |
| 4 | RoomType | room_types | Loại phòng (giá, sức chứa, tiện ích) |
| 5 | Room | rooms | Phòng vật lý |
| 6 | Contract | contracts | Hợp đồng thuê phòng |
| 7 | AssetHandover | asset_handovers | Biên bản bàn giao tài sản |
| 8 | Invoice | invoices | Hóa đơn hàng tháng |
| 9 | Incident | incidents | Phiếu báo sự cố |
| 10 | RegistrationRequest | registration_requests | Đơn đăng ký phòng |
| 11 | Appointment | appointments | Lịch hẹn xem phòng |
| 12 | AppointmentItem | appointment_items | Chi tiết đăng ký trong lịch hẹn |
| 13 | Notification | notifications | Thông báo người dùng |
| 14 | ChatSession | chat_sessions | Phiên chatbot |
| 15 | ChatMessage | chat_messages | Tin nhắn chatbot |
| 16 | KnowledgeBase | knowledge_base | Bài viết kiến thức cho RAG |
| 17 | SystemConfig | system_config | Cấu hình hệ thống (key-value) |
| 18 | AuditLog | audit_log | Nhật ký kiểm soát |
| 19 | TemporaryLeave | temporary_leaves | Đăng ký tạm vắng |
| 20 | Violation | violations | Biên bản vi phạm |
| 21 | RoomTransfer | room_transfers | Yêu cầu chuyển phòng |
| 22 | ReconciliationReport | reconciliation_reports | Báo cáo đối soát |
| 23 | ReturnRequest | return_requests | Yêu cầu trả phòng |
| 24 | ScheduledMaintenance | scheduled_maintenance | Lịch bảo trì |
| 25 | MeterReading | meter_readings | Chỉ số điện nước |

### 5.2 Enums

| Enum | Giá trị |
|------|---------|
| UserRole | admin, staff, student, accountant, technician, director |
| Gender | male, female, other |
| GenderRestriction | male_only, female_only, mixed |
| RoomStatus | available, occupied, maintenance, reserved |
| ContractStatus | active, expired, terminated, pending |
| InvoiceStatus | unpaid, paid, overdue, partial |
| PaymentMethod | cash, vnpay, momo, transfer |
| IncidentCategory | electrical, plumbing, furniture, other |
| IncidentPriority | low, medium, high, urgent |
| IncidentStatus | pending, in_progress, resolved, closed |
| RegistrationStatus | pending, deposit_pending, deposit_paid, deposit_confirmed, approved, rejected, cancelled |
| NotificationType | invoice_due, incident_update, room_approved, deposit_confirmed, deposit_rejected, deposit_submitted, system |
| ChatRole | user, assistant |
| MaintenanceType | preventive, corrective, inspection, emergency |
| MaintenanceStatus | scheduled, in_progress, completed, cancelled |
| MeterReadingStatus | draft, submitted, approved, rejected, remeasure |
| AppointmentStatus | scheduled, completed, cancelled |
| AppointmentItemStatus | pending, attended, absent |

### 5.3 Key Relationships (Mối quan hệ chính)

```
User (1) ──(1:1)──> Student
User (1) ──(1:1)──> StaffInfo
Student (1) ──(1:n)──> Contract
Student (1) ──(1:n)──> RegistrationRequest
Student (1) ──(1:n)──> Violation
RoomType (1) ──(1:n)──> Room
Room (1) ──(1:n)──> Contract
Contract (1) ──(1:0..1)──> AssetHandover
Contract (1) ──(1:n)──> Invoice
Contract (1) ──(1:n)──> TemporaryLeave
Contract (1) ──(1:n)──> RoomTransfer
Contract (1) ──(1:n)──> ReturnRequest
Incident (1) ──(1:n)──> Violation
RegistrationRequest (n) ──(n:1)──> AppointmentItem ← (n) Appointment
User (1) ──(1:n)──> ChatSession ──(1:n)──> ChatMessage
Room (1) ──(1:n)──> MeterReading
Room (1) ──(1:n)──> ScheduledMaintenance
```

---

## 6. Phân tích Use Cases & Nghiệp vụ

### UC01 — Đăng ký phòng (Student)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/registrations` |
| **Actor** | Student tạo → Staff duyệt → Accountant xác nhận cọc |
| **Mô tả** | Sinh viên nộp hồ sơ đăng ký phòng trực tuyến, kèm minh chứng qua URL công khai |
| **Dữ liệu đầu vào** | Loại phòng, phòng mong muốn (tùy chọn), ngày vào, thời gian thuê, documents (URL minh chứng Google Drive, 1-5 link) |
| **Luồng trạng thái** | `pending` → `deposit_pending` → `deposit_paid` → `deposit_confirmed` → `approved` |

**Chi tiết luồng:**

```
[Student]                              [Staff]                            [Accountant]
    │                                      │                                    │
    ├─ POST /registrations ──►              │                                    │
    │  (JSON body, documents: string[])     │                                    │
    │  ◄── 201 Created                      │                                    │
    │                                      │                                    │
    ├─ GET /registrations/my ──►            │                                    │
    │  (Theo dõi trạng thái)               │                                    │
    │                                      │                                    │
    │                           GET /registrations (Xem DS đơn)               │
    │                           POST /:id/approve ──►                         │
    │                             (Gán roomId)                                │
    │                                      │                                    │
    ├─ POST /:id/upload-payment ──►         │                                    │
    │  (multipart: paymentProof)           │                                    │
    │                                      │                    POST /:id/confirm-deposit
    │                                      │                    hoặc /:id/reject-deposit
    │                                      │                                    │
    │                           POST /:id/confirm-payment ──►                  │
    │                           (Tạo hợp đồng)                                │
    │                                      │                                    │
```

**Quy tắc nghiệp vụ:**
- SV chỉ được chọn loại phòng phù hợp giới tính: `male` → `male_only`, `female` → `female_only`, `other` → `mixed`
- Hệ thống chặn ghép khác giới trong cùng phòng (kiểm tra hợp đồng, duyệt, chuyển phòng)
- Nếu SV đã có đơn `pending`, hệ thống có thể tự hủy đơn cũ
- `documents`: mảng URL công khai (khuyến nghị Google Drive "Anyone with the link"), bắt buộc ≥1 link
- Biên lai cọc: upload multipart `paymentProof` (ảnh JPG/PNG/GIF hoặc PDF/DOC/DOCX, tối đa 10MB)
- Chấm điểm ưu tiên tự động (`priorityScore`) dựa trên nhóm ưu tiên

---

### UC02 — Gia hạn hợp đồng (Student + Admin)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/renewals` |
| **Actors** | Student yêu cầu, Admin gửi nhắc nhở |
| **API** | `POST /renewals` (gia hạn), `GET /:contractId/eligibility` (check), `GET /expiring` (sắp hết hạn), `POST /reminders` (nhắc nhở) |

**Nghiệp vụ:**
- Check điều kiện đủ điều kiện gia hạn trước khi cho phép
- Admin xem danh sách hợp đồng sắp hết hạn
- Admin gửi email nhắc nhở gia hạn hàng loạt
- Xem lịch sử gia hạn của hợp đồng

---

### UC03 — Trả phòng (Student + Staff)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/returns` |
| **Actors** | Student tạo yêu cầu, Staff xử lý |
| **Trạng thái** | pending → scheduled → inspected → completed / cancelled |

**Luồng nghiệp vụ:**
1. SV tạo yêu cầu trả phòng (`POST /returns`)
2. Staff lên lịch kiểm tra (`POST /:id/schedule`)
3. Staff hoàn thành kiểm tra — ghi nhận hư hỏng, tính phí (`POST /:id/complete`)
4. Staff xử lý hoàn cọc (`POST /:id/refund`)

**Dữ liệu kiểm tra:** damageNotes, damagePhotos, damageAmount, inspectionNotes, refundAmount, bankAccount, bankName

---

### UC04 — Thanh toán tiền phòng (Student + Admin/Accountant)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/invoices` |
| **Actors** | Student xem/đóng, Accountant xử lý |
| **Phương thức** | cash, vnpay, momo, transfer |

**Nghiệp vụ:**
- Student xem hóa đơn hiện tại (`GET /invoices/current`) và lịch sử (`GET /invoices/my-invoices`)
- Accountant xử lý thanh toán (`POST /invoices/:id/payment`)
- VNPay callback (partial — incomplete)
- Cập nhật hóa đơn quá hạn tự động (`PUT /invoices/overdue/update`)

---

### UC05 — Xem hóa đơn (Student)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/invoices` |
| **API** | `GET /invoices/my-invoices`, `GET /invoices/current` |

---

### UC06 — Báo sự cố (All authenticated users)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/incidents` |
| **Actors** | Tất cả user đã xác thực tạo; Staff/Technician xử lý |
| **Phân loại** | electrical, plumbing, furniture, other |
| **Mức độ** | low, medium, high, urgent |
| **Trạng thái** | pending → in_progress → resolved → closed |

**Nghiệp vụ:**
- Tất cả user đã xác thực có thể tạo sự cố (`POST /incidents`)
- Staff/Technician giao việc (`PUT /:id/assign`)
- Cập nhật trạng thái (`PUT /:id/status`)
- Đánh dấu đã giải quyết (`PUT /:id/resolve`)

---

### UC07 — Chat với AI (All authenticated users)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/chatbot` |
| **Actors** | Tất cả user đã xác thực |
| **Công nghệ** | RAG pipeline — ChromaDB vector store + OpenRouter API |

**Chi tiết kỹ thuật:**
- Tạo phiên chat (`POST /sessions`)
- Gửi tin nhắn đồng bộ (`POST /sessions/:id/messages`) hoặc SSE streaming (`POST /sessions/:id/stream`)
- `streamAccRef` đồng bộ nội dung SSE với ref — tránh race condition
- Lấy context sinh viên (nếu là student role) cho câu trả lời cá nhân hóa
- Prompt RAG xử lý câu hỏi meta ("tôi có thể hỏi gì") trong phạm vi
- Fallback khi không có nội dung: thông điệp trung tính, không dùng giọng "ngoài phạm vi"
- Admin quản lý knowledge base: index, CRUD entries

---

### UC08 — Đăng ký tạm vắng (Student + Admin)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/temporary-leave` |
| **Actors** | Student tạo, Staff/Admin duyệt |
| **Trạng thái** | active, returned, overdue, cancelled |

**Nghiệp vụ:**
- SV đăng ký ngày đi, ngày về, lý do, số điện thoại liên lạc, thông tin người liên lạc khẩn cấp
- Staff đánh dấu đã về (`PUT /:id/return`)
- Admin chạy check-overdue (`POST /check-overdue`) để tìm SV quá hạn

---

### UC09 — Duyệt hồ sơ đăng ký (Staff)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/registrations` |
| **Actors** | Staff/Admin duyệt |
| **API** | `POST /:id/approve`, `POST /:id/reject`, `POST /:id/confirm-payment` |

---

### UC10 — Phân phòng (Staff)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/registrations` (thông qua approve) |
| **API** | `GET /assignable-rooms` (xem phòng có thể gán), `POST /:id/approve` với `roomId` |

---

### UC11 — Quản lý chuyển phòng (Student + Staff)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/transfers` |
| **Actors** | Student yêu cầu, Staff duyệt |
| **Trạng thái** | pending → approved → rejected → completed |
| **API** | `POST /transfers` (tạo), `GET /fee` (tính phí), `PUT /:id/process` (xử lý) |

**Nghiệp vụ:**
- Tự động tính phí chuyển phòng (`GET /fee`)
- Kiểm tra giới tính không ghép khác giới
- Cập nhật occupancy của cả phòng cũ và phòng mới

---

### UC12 — Lập biên bản vi phạm (Staff)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/violations` |
| **Actors** | Staff/Admin tạo; Student kháng cáo |
| **Mức phạt** | low, medium, high, severe |
| **Trạng thái** | pending → processed → closed → appealed |
| **API** | `POST /` (tạo), `PUT /:id/process` (xử lý), `POST /:id/appeal` (kháng cáo) |

**Nghiệp vụ:**
- Gắn với Incident (sự cố) hoặc tạo độc lập
- Có penaltyAmount, penaltyApplied flag
- Xem lịch sử vi phạm theo sinh viên (`GET /student/:studentId`)

---

### UC13 — Quản lý hợp đồng (Staff + Admin)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/contracts` |
| **Actors** | Staff/Admin quản lý; Student xem |
| **Trạng thái** | active, expired, terminated, pending |
| **API** | CRUD đầy đủ + terminate + handover |

---

### UC14 — Tạo hóa đơn hàng tháng (Accountant)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/invoices` |
| **Actors** | Accountant/Admin |
| **API** | `POST /generate` (tạo đơn), `POST /generate-batch` (tạo hàng loạt) |

**Nghiệp vụ:**
- Tính: tiền phòng + điện (kWh × đơn giá) + nước (m³ × đơn giá) + phí khác
- Validate `invoiceMonth` tránh lỗi Invalid Date
- Sử dụng chỉ số điện nước đã duyệt từ MeterReadings

---

### UC15 — Đối soát thanh toán (Accountant)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/reconciliation` |
| **Actors** | Accountant/Admin tạo; Admin giải quyết sai lệch |
| **Trạng thái** | pending → processed → archived |
| **API** | `POST /` (tạo báo cáo), `GET /reports` (danh sách), `PUT /reports/:id/resolve` |

**Nghiệp vụ:**
- Tạo báo cáo đối soát theo tháng và kênh thanh toán
- Phát hiện sai lệch (discrepancies) giữa gateway và hệ thống
- Stats trả về: totalTransactions, totalMatched, totalDiscrepancies

---

### UC16 — Quản lý tiền cọc (Accountant)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/registrations` (confirm-deposit, reject-deposit) + Frontend riêng |
| **Actors** | Accountant |
| **Frontend** | `/staff/deposits` — tab "Chờ xác nhận" (deposit_paid) và "Lịch sử" |

---

### UC17 — Xuất báo cáo tài chính (Accountant + Admin)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/financial-reports` |
| **Actors** | Accountant/Admin |
| **API** | `POST /generate`, `GET /stats`, `GET /export/csv`, `GET /export/json` |

---

### UC18 — Tiếp nhận & xử lý ticket sự cố (Technician + Staff)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/incidents` |
| **Actors** | Technician tiếp nhận, Staff giám sát |
| **API** | `PUT /:id/assign`, `PUT /:id/status`, `PUT /:id/resolve` |

---

### UC19 — Lập lịch bảo trì (Technician + Staff)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/maintenance` |
| **Actors** | Technician/Staff |
| **Loại** | preventive, corrective, inspection, emergency |
| **Trạng thái** | scheduled → in_progress → completed / cancelled |
| **API** | CRUD + `PUT /:id/complete` |

---

### UC20 — Nghiệm thu bàn giao phòng (Technician + Staff)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/contracts` (handover endpoints) + `/meter-readings` |
| **Actors** | Staff/Technician bàn giao; Accountant duyệt chỉ số |
| **Frontend** | `/staff/handover/` — quản lý + chi tiết |
| **API** | `POST /:id/handover`, `PUT /:id/handover`, `POST /:id/handover/complete` |

**Chi tiết bàn giao:**
- Danh sách CSVC (assetTemplates từ RoomType hoặc amenities thực tế của Room)
- Chỉ số điện nước ban đầu (electricityInitial, waterInitial)
- Ảnh đồng hồ điện, nước, ảnh phòng (roomPhotos)
- Hoàn tất bàn giao (`POST /handover/complete`)
- Danh sách bàn giao chờ (`GET /handover/pending`)

---

### UC21 — Dashboard tổng hợp (Director + Admin)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/dashboard` |
| **Actors** | Director, Admin, Staff |
| **API** | `GET /stats`, `GET /revenue`, `GET /occupancy` |
| **Frontend** | `/director/page.tsx` — tổng quan; `/director/revenue`, `/director/occupancy` |

---

### UC22 — Duyệt chính sách giá phòng (Director)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/director` |
| **Actors** | Director/Admin |
| **API** | `GET /policies/room-types`, `PUT /policies/room-types/:id/approve-price` |
| **Frontend** | `/director/policies/page.tsx` |

---

### UC23 — Xuất báo cáo định kỳ (Director)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/director` |
| **Actors** | Director/Admin |
| **API** | `GET /reports/periodic`, `GET /reports/export` (CSV/JSON) |
| **Frontend** | `/director/reports/page.tsx` |

---

### UC24 — Quản lý tài khoản (Admin)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/auth` |
| **Actors** | Admin |
| **API** | CRUD `/users` — `GET`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| **Frontend** | `/admin/users/page.tsx` |

---

### UC25 — Cấu hình hệ thống (Admin)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/system-config` |
| **Actors** | Admin |
| **API** | `GET /`, `GET /:key`, `PUT /:key`, `POST /batch` |
| **Frontend** | `/admin/settings/page.tsx` |
| **Cấu trúc** | Key-value store (SystemConfig table) |

---

### UC26 — Xem audit log (Admin)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/audit-logs` |
| **Actors** | Admin |
| **API** | `GET /` (tất cả), `GET /:id`, `GET /entity/:entity/:id` |
| **Frontend** | `/admin/audit-logs/page.tsx` |
| **Ghi nhận tại** | Controllers: contracts, invoices, auth, etc. |

**Dữ liệu audit:** userId, action, entity, entityId, details (JSON), ipAddress, userAgent, createdAt

---

### UC27 — Ghi chỉ số điện nước (Technician + Accountant)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/meter-readings` |
| **Actors** | Technician ghi; Accountant duyệt |
| **Trạng thái** | draft → submitted → approved / rejected / remeasure |
| **API Technician** | `GET /rooms-to-read`, `POST /record`, `POST /mark-unreadable`, `POST /submit-month` |
| **API Accountant** | `GET /`, `POST /:id/approve`, `POST /:id/request-remeasure` |
| **Frontend** | `/staff/meter-readings/page.tsx`, `/admin/meter-readings/page.tsx` |

**Nghiệp vụ:**
- Tự động phát hiện bất thường (anomaly detection) — so sánh với tháng trước
- Đánh dấu đồng hồ không đọc được (unreadable) kèm lý do
- unique constraint: `[roomId, month]` — mỗi phòng mỗi tháng chỉ có 1 bản ghi
- Nộp hàng loạt cuối tháng (`POST /submit-month`)
- Accountant có thể yêu cầu đo lại (`POST /:id/request-remeasure`)

---

### UC28 — Lịch hẹn xem phòng (Student + Staff)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/appointments` |
| **Actors** | Staff/Admin tạo lịch; Student tham gia |
| **Trạng thái** | scheduled → completed / cancelled |
| **Item status** | pending → attended / absent |
| **API Staff** | CRUD appointments + add/remove registrations + update item status + complete/cancel |
| **API Student** | `GET /my` — xem lịch hẹn của mình |

**Nghiệp vụ:**
- Staff tạo lịch hẹn xem phòng (`POST /appointments`)
- Gán nhiều đơn đăng ký vào 1 lịch hẹn (`POST /:id/registrations`)
- Cập nhật trạng thái tham gia từng SV (`PUT /:id/items/:registrationId/status`)
- Xem đăng ký chưa được xếp lịch (`GET /pending-registrations`)
- Staff hoàn tất lịch hẹn (`POST /:id/complete`)

---

### UC29 — Tạo PDF (Admin + Staff + Student)
| Thông tin | Chi tiết |
|-----------|----------|
| **Module** | `/pdf` |
| **Actors** | Admin/Staff (phiếu thu); Admin/Staff/Student (hợp đồng) |
| **API** | `GET /deposit-receipt/:registrationId`, `GET /contract/:contractId` |
| **Frontend** | `/print/contract/[contractId]/page.tsx` |

**Chi tiết:**
- Phiếu thu cọc: PDFKit-based, từ RegistrationRequest
- Hợp đồng: Hỗ trợ bản nháp (draft) và hoàn chỉnh (complete)
- Ký hợp đồng = handover complete + PDF hợp đồng được tạo

---

## 7. Danh sách API Endpoints hoàn chỉnh

Base URL: `http://localhost:3001/api/v1`

### 7.1 Authentication — `/auth`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| POST | `/register` | No | - | Đăng ký tài khoản SV mới |
| POST | `/login` | No | - | Đăng nhập |
| POST | `/refresh` | No | - | Làm mới access token |
| POST | `/logout` | Yes | Any | Đăng xuất |
| GET | `/me` | Yes | Any | Thông tin user hiện tại |
| PUT | `/me` | Yes | Any | Cập nhật profile |
| PUT | `/change-password` | Yes | Any | Đổi mật khẩu |
| POST | `/forgot-password` | No | - | Quên mật khẩu |
| POST | `/reset-password` | No | - | Đặt lại mật khẩu |
| GET | `/users` | Yes | admin | Danh sách users |
| POST | `/users` | Yes | admin | Tạo user |
| GET | `/users/:id` | Yes | admin | Chi tiết user |
| PUT | `/users/:id` | Yes | admin | Cập nhật user |
| DELETE | `/users/:id` | Yes | admin | Vô hiệu hóa user |

### 7.2 Rooms — `/rooms`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/room-types` | No | - | Danh sách loại phòng |
| GET | `/room-types/:id` | No | - | Chi tiết loại phòng |
| GET | `/my-room` | Yes | Any (student) | Phòng hiện tại của SV |
| GET | `/` | Yes | admin, staff | Danh sách phòng (có filter) |
| POST | `/` | Yes | admin, staff | Tạo phòng mới |
| GET | `/stats/summary` | Yes | admin, staff | Thống kê phòng |
| GET | `/available` | Yes | admin, staff | Phòng trống |
| GET | `/:id` | Yes | Any | Chi tiết phòng |
| PUT | `/:id` | Yes | admin, staff | Cập nhật phòng |
| DELETE | `/:id` | Yes | admin | Xóa phòng |
| POST | `/room-types` | Yes | admin, staff | Tạo loại phòng |
| PUT | `/room-types/:id` | Yes | admin, staff | Cập nhật loại phòng |
| DELETE | `/room-types/:id` | Yes | admin | Xóa loại phòng |

### 7.3 Students — `/students`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/stats/summary` | Yes | Any | Thống kê SV |
| GET | `/stats` | Yes | Any | Thống kê SV (alias) |
| GET | `/me` | Yes | Any | Profile SV hiện tại |
| PUT | `/me` | Yes | Any | Cập nhật profile SV |
| GET | `/my-contracts` | Yes | Any | Hợp đồng của SV |
| GET | `/by-code/:code` | Yes | admin, staff, accountant | Tìm SV theo mã |
| GET | `/:id/contracts` | Yes | admin, staff, accountant | HĐ theo SV |
| GET | `/:id/invoices` | Yes | admin, staff, accountant | Hóa đơn theo SV |
| GET | `/:id/incidents` | Yes | admin, staff | Sự cố theo SV |
| GET | `/` | Yes | admin, staff, accountant | Danh sách SV |
| GET | `/:id` | Yes | admin, staff, accountant | Chi tiết SV |
| PUT | `/:id` | Yes | admin, staff | Cập nhật SV |

### 7.4 Contracts — `/contracts`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/stats/summary` | Yes | admin, staff, accountant | Thống kê HĐ |
| GET | `/` | Yes | admin, staff, accountant | Danh sách HĐ |
| GET | `/:id` | Yes | admin, staff, accountant | Chi tiết HĐ |
| POST | `/` | Yes | admin, staff | Tạo HĐ |
| PUT | `/:id` | Yes | admin, staff | Cập nhật HĐ |
| PUT | `/:id/terminate` | Yes | admin, staff | Chấm dứt HĐ |
| GET | `/handover/pending` | Yes | admin, staff, technician | Bàn giao chờ |
| POST | `/:id/handover` | Yes | admin, staff, technician | Tạo bàn giao |
| GET | `/:id/handover` | Yes | Any | Chi tiết bàn giao |
| PUT | `/:id/handover` | Yes | admin, staff, technician | Cập nhật bàn giao |
| POST | `/:id/handover/complete` | Yes | admin, staff, technician | Hoàn tất bàn giao |

### 7.5 Invoices — `/invoices`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/stats/summary` | Yes | admin, staff, accountant, director | Tổng quan hóa đơn |
| GET | `/stats/monthly` | Yes | admin, staff, accountant, director | Thống kê theo tháng |
| GET | `/students/:studentId/summary` | Yes | admin, staff, accountant | HĐ theo SV |
| GET | `/my-invoices` | Yes | Any | Hóa đơn của SV |
| GET | `/current` | Yes | Any | Hóa đơn hiện tại |
| GET | `/` | Yes | admin, staff, accountant | Danh sách HD |
| GET | `/:id` | Yes | admin, staff, accountant | Chi tiết HD |
| POST | `/generate` | Yes | admin, staff, accountant | Tạo HD đơn lẻ |
| POST | `/generate-batch` | Yes | admin, staff, accountant | Tạo HD hàng loạt |
| PUT | `/:id` | Yes | admin, staff, accountant | Cập nhật HD |
| POST | `/:id/payment` | Yes | admin, staff, accountant | Xử lý thanh toán |
| PUT | `/overdue/update` | Yes | admin, accountant | Cập nhật quá hạn |

### 7.6 Incidents — `/incidents`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/stats/summary` | Yes | admin, staff, technician | Thống kê sự cố |
| GET | `/my-incidents` | Yes | Any | Sự cố của tôi |
| GET | `/` | Yes | admin, staff, technician | Danh sách sự cố |
| GET | `/:id` | Yes | Any | Chi tiết sự cố |
| POST | `/` | Yes | Any | Tạo sự cố |
| PUT | `/:id` | Yes | Any | Cập nhật sự cố |
| PUT | `/:id/assign` | Yes | admin, staff, technician | Giao việc |
| PUT | `/:id/status` | Yes | admin, staff, technician | Cập nhật trạng thái |
| PUT | `/:id/resolve` | Yes | admin, staff, technician | Đánh dấu giải quyết |
| DELETE | `/:id` | Yes | admin | Xóa sự cố |

### 7.7 Registrations — `/registrations`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/room-types` | Yes | student | Loại phòng theo giới tính |
| GET | `/available` | Yes | student | Phòng trống theo roomTypeId |
| POST | `/` | Yes | student | Tạo đơn đăng ký |
| GET | `/my` | Yes | Any | Đơn của SV |
| POST | `/:id/cancel` | Yes | student | SV hủy đơn |
| POST | `/:id/upload-payment` | Yes | student | Upload biên lai cọc |
| GET | `/assignable-rooms` | Yes | admin, staff | Phòng có thể gán |
| GET | `/stats` | Yes | admin, staff, accountant | Thống kê đơn |
| GET | `/` | Yes | admin, staff, accountant | Danh sách đơn |
| GET | `/:id` | Yes | admin, staff, accountant | Chi tiết đơn |
| POST | `/:id/approve` | Yes | admin, staff | Duyệt + gán phòng |
| POST | `/:id/reject` | Yes | admin, staff | Từ chối |
| POST | `/:id/confirm-deposit` | Yes | accountant | Xác nhận cọc |
| POST | `/:id/reject-deposit` | Yes | accountant | Từ chối biên lai |
| POST | `/:id/confirm-payment` | Yes | admin, staff | Tạo HĐ từ cọc |
| POST | `/:id/cancel-by-staff` | Yes | admin, staff | Staff hủy đơn |

### 7.8 Returns — `/returns`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| POST | `/` | Yes | Any | Tạo yêu cầu trả phòng |
| GET | `/my` | Yes | Any | Yêu cầu trả của tôi |
| GET | `/` | Yes | admin, staff | Danh sách yêu cầu |
| GET | `/:id` | Yes | Any | Chi tiết yêu cầu |
| POST | `/:id/schedule` | Yes | admin, staff | Lên lịch kiểm tra |
| POST | `/:id/complete` | Yes | admin, staff | Hoàn tất kiểm tra |
| POST | `/:id/refund` | Yes | admin, staff | Xử lý hoàn cọc |
| DELETE | `/:id` | Yes | Any | Hủy yêu cầu |

### 7.9 Renewals — `/renewals`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/expiring` | Yes | admin, staff | HĐ sắp hết hạn |
| POST | `/reminders` | Yes | admin | Gửi nhắc nhở |
| GET | `/:contractId/eligibility` | Yes | Any | Check đủ điều kiện |
| GET | `/:contractId/history` | Yes | Any | Lịch sử gia hạn |
| POST | `/` | Yes | Any | Gia hạn HĐ |

### 7.10 Temporary Leave — `/temporary-leave`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| POST | `/` | Yes | Any | Tạo đăng ký tạm vắng |
| GET | `/my` | Yes | Any | Đăng ký của tôi |
| GET | `/` | Yes | admin, staff | Danh sách tất cả |
| PUT | `/:id/return` | Yes | admin, staff | Đánh dấu đã về |
| DELETE | `/:id` | Yes | Any | Hủy đăng ký |
| POST | `/check-overdue` | Yes | admin | Kiểm tra quá hạn |

### 7.11 Transfers — `/transfers`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| POST | `/` | Yes | Any | Tạo yêu cầu chuyển |
| GET | `/my` | Yes | Any | Yêu cầu của tôi |
| GET | `/fee` | Yes | Any | Tính phí chuyển |
| GET | `/` | Yes | admin, staff | Danh sách yêu cầu |
| PUT | `/:id/process` | Yes | admin, staff | Xử lý chuyển |
| DELETE | `/:id` | Yes | Any | Hủy yêu cầu |

### 7.12 Violations — `/violations`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| POST | `/` | Yes | admin, staff | Tạo biên bản |
| GET | `/` | Yes | admin, staff | Danh sách vi phạm |
| GET | `/student/:studentId` | Yes | admin, staff | Lịch sử SV |
| GET | `/:id` | Yes | Any | Chi tiết vi phạm |
| PUT | `/:id/process` | Yes | admin, staff | Xử lý vi phạm |
| POST | `/:id/appeal` | Yes | Any | Kháng cáo |

### 7.13 Reconciliation — `/reconciliation`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| POST | `/` | Yes | admin, staff, accountant | Tạo báo cáo đối soát |
| GET | `/reports` | Yes | admin, staff, accountant | Danh sách báo cáo |
| GET | `/stats` | Yes | admin, staff, accountant | Thống kê đối soát |
| GET | `/reports/:id` | Yes | admin, staff, accountant | Chi tiết báo cáo |
| PUT | `/reports/:id/resolve` | Yes | admin | Giải quyết sai lệch |

### 7.14 Dashboard — `/dashboard`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/stats` | Yes | admin, staff, director | Thống kê tổng hợp |
| GET | `/revenue` | Yes | admin, director | Báo cáo doanh thu |
| GET | `/occupancy` | Yes | admin, staff, director | Báo cáo công suất |

### 7.15 Director — `/director`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/policies/room-types` | Yes | director, admin | Chính sách giá |
| PUT | `/policies/room-types/:id/approve-price` | Yes | director, admin | Duyệt giá phòng |
| GET | `/reports/periodic` | Yes | director, admin | Báo cáo định kỳ |
| GET | `/reports/export` | Yes | director, admin | Xuất báo cáo (CSV/JSON) |

### 7.16 Notifications — `/notifications`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/unread-count` | Yes | Any | Số chưa đọc |
| GET | `/stats` | Yes | Any | Thống kê TB |
| GET | `/recent` | Yes | Any | TB gần đây |
| POST | `/broadcast` | Yes | admin, staff | Gửi TB hàng loạt |
| GET | `/` | Yes | Any | Danh sách TB |
| PUT | `/read-all` | Yes | Any | Đánh dấu đã đọc tất cả |
| DELETE | `/clear-read` | Yes | Any | Xóa TB đã đọc |
| DELETE | `/cleanup` | Yes | admin | Dọn dẹp TB cũ |
| GET | `/:id` | Yes | Any | Chi tiết TB |
| PUT | `/:id/read` | Yes | Any | Đánh dấu đã đọc |
| DELETE | `/:id` | Yes | Any | Xóa TB |

### 7.17 Chatbot — `/chatbot`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/sessions` | Yes | Any | Danh sách phiên |
| GET | `/sessions/:id` | Yes | Any | Chi tiết phiên |
| POST | `/sessions` | Yes | Any | Tạo phiên mới |
| DELETE | `/sessions/:id` | Yes | Any | Xóa phiên |
| PUT | `/sessions/:id/clear` | Yes | Any | Xóa lịch sử phiên |
| GET | `/sessions/:sessionId/messages` | Yes | Any | Tin nhắn |
| POST | `/sessions/:sessionId/messages` | Yes | Any | Gửi tin (sync) |
| POST | `/sessions/:sessionId/stream` | Yes | Any | Gửi tin (SSE) |
| GET | `/stats` | Yes | Any | Thống kê chatbot |
| POST | `/admin/knowledge/index` | Yes | admin | Index KB |
| GET | `/admin/knowledge/stats` | Yes | admin | Thống kê index |
| GET | `/admin/knowledge` | Yes | admin | Thống kê tổng |
| POST | `/admin/knowledge/entries` | Yes | admin | Thêm bài KB |
| PUT | `/admin/knowledge/entries/:id` | Yes | admin | Sửa bài KB |
| DELETE | `/admin/knowledge/entries/:id` | Yes | admin | Xóa bài KB |

### 7.18 System Config — `/system-config`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/` | Yes | admin | Tất cả cấu hình |
| GET | `/:key` | Yes | admin | Cấu hình theo key |
| PUT | `/:key` | Yes | admin | Cập nhật cấu hình |
| POST | `/batch` | Yes | admin | Cập nhật hàng loạt |

### 7.19 Audit Logs — `/audit-logs`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/` | Yes | admin | Tất cả audit logs |
| GET | `/:id` | Yes | admin | Chi tiết log |
| GET | `/entity/:entity/:id` | Yes | admin | Log theo entity |

### 7.20 Maintenance — `/maintenance`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/` | Yes | admin, staff, technician | Danh sách bảo trì |
| GET | `/:id` | Yes | admin, staff, technician | Chi tiết bảo trì |
| POST | `/` | Yes | admin, staff, technician | Tạo lịch bảo trì |
| PUT | `/:id` | Yes | admin, staff, technician | Cập nhật |
| PUT | `/:id/complete` | Yes | admin, staff, technician | Hoàn tất |
| DELETE | `/:id` | Yes | admin | Xóa |

### 7.21 Financial Reports — `/financial-reports`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| POST | `/generate` | Yes | admin, accountant | Tạo báo cáo TC |
| GET | `/stats` | Yes | admin, accountant | Thống kê theo tháng |
| GET | `/export/csv` | Yes | admin, accountant | Xuất CSV |
| GET | `/export/json` | Yes | admin, accountant | Xuất JSON |

### 7.22 Meter Readings — `/meter-readings`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/rooms-to-read` | Yes | technician, admin | DS phòng cần ghi |
| POST | `/record` | Yes | technician, admin | Ghi chỉ số |
| POST | `/mark-unreadable` | Yes | technician, admin | Đánh dấu không đọc |
| POST | `/submit-month` | Yes | technician, admin | Nộp cả tháng |
| GET | `/` | Yes | accountant, admin | Danh sách chỉ số |
| POST | `/:id/approve` | Yes | accountant, admin | Duyệt chỉ số |
| POST | `/:id/request-remeasure` | Yes | accountant, admin | Yêu cầu đo lại |

### 7.23 PDF Generator — `/pdf`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/deposit-receipt/:registrationId` | Yes | admin, staff | Phiếu thu cọc PDF |
| GET | `/contract/:contractId` | Yes | admin, staff, student | Hợp đồng PDF |

### 7.24 Appointments — `/appointments`
| Method | Endpoint | Auth | Roles | Mô tả |
|--------|----------|------|-------|-------|
| GET | `/my` | Yes | student | Lịch hẹn của SV |
| GET | `/` | Yes | admin, staff | Danh sách lịch hẹn |
| GET | `/pending-registrations` | Yes | admin, staff | ĐK chưa xếp lịch |
| GET | `/:id` | Yes | admin, staff | Chi tiết lịch hẹn |
| POST | `/` | Yes | admin, staff | Tạo lịch hẹn |
| PUT | `/:id` | Yes | admin, staff | Cập nhật lịch |
| POST | `/:id/registrations` | Yes | admin, staff | Thêm ĐK vào lịch |
| DELETE | `/:id/registrations/:registrationId` | Yes | admin, staff | Xóa ĐK khỏi lịch |
| PUT | `/:id/items/:registrationId/status` | Yes | admin, staff | Cập nhật trạng thái SV |
| POST | `/:id/complete` | Yes | admin, staff | Hoàn tất lịch hẹn |
| POST | `/:id/cancel` | Yes | admin, staff | Hủy lịch hẹn |

---

## 8. Frontend Pages & Portal Structure

### 8.1 Portal Admin (`/admin`)
**Role guard**: Chỉ `admin`

| # | Route | File | Mô tả |
|---|-------|------|-------|
| 1 | `/admin` | `page.tsx` | Dashboard chính |
| 2 | `/admin/dashboard` | `page.tsx` | Dashboard chi tiết |
| 3 | `/admin/rooms` | `page.tsx` | Quản lý phòng |
| 4 | `/admin/room-types` | `page.tsx` | Quản lý loại phòng |
| 5 | `/admin/registrations` | `page.tsx` | Duyệt đăng ký phòng |
| 6 | `/admin/appointments` | `page.tsx` | Lịch hẹn xem phòng |
| 7 | `/admin/students` | `page.tsx` | Quản lý sinh viên |
| 8 | `/admin/contracts` | `page.tsx` | Quản lý hợp đồng |
| 9 | `/admin/invoices` | `page.tsx` | Quản lý hóa đơn |
| 10 | `/admin/invoices/generate` | `page.tsx` | Tạo hóa đơn |
| 11 | `/admin/meter-readings` | `page.tsx` | Duyệt chỉ số điện nước |
| 12 | `/admin/incidents` | `page.tsx` | Quản lý sự cố |
| 13 | `/admin/users` | `page.tsx` | Quản lý tài khoản |
| 14 | `/admin/knowledge` | `page.tsx` | Quản lý Knowledge Base |
| 15 | `/admin/audit-logs` | `page.tsx` | Nhật ký kiểm soát |
| 16 | `/admin/notifications` | `page.tsx` | Thông báo |
| 17 | `/admin/settings` | `page.tsx` | Cấu hình hệ thống |

### 8.2 Portal Staff (`/staff`)
**Role guard**: `staff`, `accountant`, `technician` — menu được lọc theo role

| # | Route | Roles hiển thị | Mô tả |
|---|-------|---------------|-------|
| 1 | `/staff` | All | Dashboard |
| 2 | `/staff/notifications` | All | Thông báo |
| 3 | `/staff/chatbot` | All | Chat AI |
| 4 | `/staff/incidents` | staff, technician | Sự cố |
| 5 | `/staff/tickets` | staff, technician | Tickets (variant) |
| 6 | `/staff/maintenance` | technician | Bảo trì |
| 7 | `/staff/handover` | staff, technician | Bàn giao phòng |
| 8 | `/staff/handover/[contractId]` | staff, technician | Chi tiết bàn giao |
| 9 | `/staff/rooms` | staff | Quản lý phòng |
| 10 | `/staff/registrations` | staff | Duyệt đăng ký |
| 11 | `/staff/appointments` | staff | Lịch hẹn |
| 12 | `/staff/students` | staff | Quản lý SV |
| 13 | `/staff/contracts` | staff, accountant | Hợp đồng |
| 14 | `/staff/transfers` | staff | Chuyển phòng |
| 15 | `/staff/violations` | staff | Vi phạm |
| 16 | `/staff/meter-readings` | technician | Ghi chỉ số |
| 17 | `/staff/deposits` | accountant | Tiền cọc |
| 18 | `/staff/invoices` | staff, accountant | Hóa đơn |
| 19 | `/staff/reconciliation` | accountant | Đối soát |
| 20 | `/staff/financial-reports` | accountant | Báo cáo TC |

### 8.3 Portal Director (`/director`)
**Role guard**: `director`, `admin`

| # | Route | Mô tả |
|---|-------|-------|
| 1 | `/director` | Dashboard tổng hợp |
| 2 | `/director/policies` | Duyệt chính sách giá (UC22) |
| 3 | `/director/reports` | Báo cáo định kỳ (UC23) |
| 4 | `/director/revenue` | Doanh thu |
| 5 | `/director/occupancy` | Công suất sử dụng |
| 6 | `/director/chatbot` | Chat AI |
| 7 | `/director/notifications` | Thông báo |

### 8.4 Portal Student (`/student`)
**Role guard**: Chỉ `student`
**Đặc biệt**: Nút "Đăng ký phòng" chỉ hiển thị khi SV chưa có hợp đồng active

| # | Route | Mô tả |
|---|-------|-------|
| 1 | `/student` | Trang chủ (tổng quan) |
| 2 | `/student/register` | Đăng ký phòng mới |
| 3 | `/student/registrations` | Theo dõi đơn đăng ký |
| 4 | `/student/appointments` | Lịch hẹn xem phòng |
| 5 | `/student/contract` | Hợp đồng hiện tại |
| 6 | `/student/contracts/renewal` | Gia hạn hợp đồng |
| 7 | `/student/contracts/return` | Trả phòng |
| 8 | `/student/invoices` | Hóa đơn |
| 9 | `/student/incidents` | Sự cố |
| 10 | `/student/renewals` | Gia hạn |
| 11 | `/student/transfer` | Chuyển phòng |
| 12 | `/student/returns` | Trả phòng |
| 13 | `/student/temporary-leave` | Tạm vắng |
| 14 | `/student/chatbot` | Chat AI |
| 15 | `/student/notifications` | Thông báo |

### 8.5 Pages chung
| # | Route | Mô tả |
|---|-------|-------|
| 1 | `/` | Redirect theo role |
| 2 | `/login` | Đăng nhập |
| 3 | `/register` | Đăng ký tài khoản |
| 4 | `/chatbot` | Chatbot công khai |
| 5 | `/print/contract/[contractId]` | In hợp đồng PDF |

---

## 9. Knowledge Base cho Chatbot AI

### 9.1 Tổng quan
Chatbot sử dụng RAG (Retrieval-Augmented Generation) pipeline:
1. Sinh viên gửi câu hỏi
2. Hệ thống lấy context sinh viên (nếu là student)
3. Query ChromaDB vector store để tìm kiến thức liên quan
4. Gửi context + câu hỏi đến OpenRouter API (LLM)
5. Trả lời có trích dẫn nguồn
6. Lưu message với sources vào database

### 9.2 Các tài liệu Knowledge Base

| # | File | Dòng | Nội dung |
|---|------|------|----------|
| 1 | `noi-qui-ktx.md` | 55 | Nội quy KTX: giờ giấc, quy định phòng, khách, hành vi cấm, xử phạt |
| 2 | `quy-trinh-dang-ky-phong.md` | 130 | Quy trình đăng ký: tạo TK, chọn phòng, ưu tiên, nộp giấy tờ, cọc, nhận phòng |
| 3 | `huong-dan-thanh-toan.md` | 86 | Hướng dẫn thanh toán: các khoản phí, hạn thanh toán, phương thức (VNPay, MoMo, CK) |
| 4 | `huong-dan-bao-su-co.md` | 126 | Báo sự cố: loại, mức ưu tiên, cách báo cáo, SLA, theo dõi |
| 5 | `bang-gia-phong.md` | 1258 | Bảng giá phòng (có vấn đề: bị duplicate dữ liệu) |
| 6 | `faq.md` | 112 | FAQ: chuyển phòng, đồ đạc, hóa đơn, wifi, gửi xe, an ninh |

### 9.3 Quản lý KB (Admin)
- Index toàn bộ KB vào ChromaDB: `POST /chatbot/admin/knowledge/index`
- CRUD từng bài viết: `POST/PUT/DELETE /chatbot/admin/knowledge/entries`
- Xem thống kê: `GET /chatbot/admin/knowledge/stats`

---

## 10. Cơ chế bảo mật & phân quyền

### 10.1 Authentication (Xác thực)
- **JWT-based**: Access token (15 phút) + Refresh token (7 ngày)
- **Middlware**: `authenticate` kiểm tra Bearer token trong Authorization header
- **Password**: Hash bằng bcrypt
- **Auto-refresh**: Axios interceptor tự động gọi `/auth/refresh` khi token hết hạn
- **Luồng lưu trữ**: Token lưu cả localStorage và cookies (cho middleware)

### 10.2 Authorization (Phân quyền - RBAC)
- **Middleware**: `requireRole(...roles)` — kiểm tra role trong JWT payload
- **6 roles**: admin, staff, student, accountant, technician, director
- **Phân cấp**:
  - `admin`: Toàn quyền — truy cập mọi endpoint
  - `staff`: Vận hành — hợp đồng, đăng ký, sự cố, chuyển phòng, vi phạm
  - `accountant`: Tài chính — hóa đơn, cọc, đối soát, báo cáo TC, chỉ số điện nước
  - `technician`: Kỹ thuật — sự cố, bảo trì, bàn giao, ghi chỉ số
  - `director`: Lãnh đạo — dashboard, chính sách, báo cáo
  - `student`: Tự phục vụ — đăng ký, hợp đồng, hóa đơn, sự cố, chatbot

### 10.3 Frontend Route Protection
- File `proxy.ts`: Middleware bảo vệ route phía client
- Layout guards: Mỗi portal layout kiểm tra role và redirect nếu không đủ quyền
- Redirect theo role: `getRoleHome()` — chuyển về trang chủ của role tương ứng

### 10.4 Rate Limiting
- **Global API**: 300 requests/phút
- **Auth endpoints**: 100 requests/phút

### 10.5 Security Headers
- Helmet middleware tự động thêm security headers

### 10.6 Audit Trail
- Ghi nhận tại controllers (contracts, invoices, auth)
- Dữ liệu: userId, action, entity, entityId, details (JSON), ipAddress, userAgent, timestamp
- Chỉ Admin xem được (`/audit-logs`)

---

## 11. Deployment & Infrastructure

### 11.1 Docker Compose Services
| Service | Image | Port | Mô tả |
|---------|-------|------|-------|
| postgres | postgres:16-alpine | 5433→5432 | Database |
| redis | redis:7-alpine | 6379 | Cache |
| chromadb | chromadb/chroma:latest | 8001→8000 | Vector store |
| backend | Node.js (build) | 3001 | API server |
| frontend | Next.js (build) | 3000 | Web app |

### 11.2 Environment Variables

**Backend (`.env`):**
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ktx_db?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=<secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
OPENROUTER_API_KEY=<key>
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
CHROMADB_URL=http://localhost:8000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASS=<password>
VNPAY_TMN_CODE=<code>
VNPAY_SECRET_KEY=<key>
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
FRONTEND_URL=http://localhost:3000
```

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 11.3 Health Check
- `GET /health` — Returns JSON with status, message, timestamp

### 11.4 File Uploads
- Static serve: `/uploads` → `backend/uploads/`
- Deposit receipts: `backend/uploads/registrations/`
- Max file size: 10MB
- Allowed types: JPEG, JPG, PNG, GIF, PDF, DOC, DOCX

---

## Phụ lục: Tổng hợp Use Case Status

| # | UC | Tên | Actor chính | Status |
|---|-----|-----|-------------|--------|
| 1 | UC01 | Đăng ký phòng | Student | Done |
| 2 | UC02 | Gia hạn hợp đồng | Student + Admin | Done |
| 3 | UC03 | Trả phòng | Student + Staff | Done |
| 4 | UC04 | Thanh toán tiền phòng | Student + Accountant | Partial (VNPay incomplete) |
| 5 | UC05 | Xem hóa đơn | Student | Done |
| 6 | UC06 | Báo sự cố | All authenticated | Done |
| 7 | UC07 | Chat với AI | All authenticated | Done |
| 8 | UC08 | Đăng ký tạm vắng | Student + Staff | Done |
| 9 | UC09 | Duyệt hồ sơ đăng ký | Staff | Done |
| 10 | UC10 | Phân phòng | Staff | Done |
| 11 | UC11 | Quản lý chuyển phòng | Student + Staff | Done |
| 12 | UC12 | Lập biên bản vi phạm | Staff | Done |
| 13 | UC13 | Quản lý hợp đồng | Staff | Done |
| 14 | UC14 | Tạo hóa đơn hàng tháng | Accountant | Done |
| 15 | UC15 | Đối soát thanh toán | Accountant | Done |
| 16 | UC16 | Quản lý tiền cọc | Accountant | Partial (no dedicated UI) |
| 17 | UC17 | Xuất báo cáo tài chính | Accountant | Done |
| 18 | UC18 | Tiếp nhận & xử lý ticket | Technician + Staff | Done |
| 19 | UC19 | Lập lịch bảo trì | Technician | Done |
| 20 | UC20 | Nghiệm thu bàn giao | Technician + Staff | Done |
| 21 | UC21 | Dashboard tổng hợp | Director | Done |
| 22 | UC22 | Duyệt chính sách | Director | Done |
| 23 | UC23 | Xuất báo cáo định kỳ | Director | Done |
| 24 | UC24 | Quản lý tài khoản | Admin | Done |
| 25 | UC25 | Cấu hình hệ thống | Admin | Done |
| 26 | UC26 | Xem audit log | Admin | Done |
| 27 | UC27 | Ghi chỉ số điện nước | Technician + Accountant | Done |
| 28 | UC28 | Lịch hẹn xem phòng | Student + Staff | Done |
| 29 | UC29 | Tạo PDF (phiếu thu, HĐ) | Admin + Staff + Student | Done |

---

*Tài liệu được tạo tự động từ source code dự án. Cập nhật lần cuối: 22/03/2026.*
1. Cấu hình thông tin ngân hàng:


cd backend
npm run setup-bank-config
Hoặc cập nhật trực tiếp trong database:

payment_bank_name: "Vietcombank"
payment_bank_account: "1234567890"
payment_account_name: "KY TUC XA TRUONG DAI HOC"
2. Chạy backend:


cd backend
npm run dev