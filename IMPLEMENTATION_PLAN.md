# Phân Tích & Kế Hoạch Implement Use Case - Hệ Thống Quản Lý Ký Túc Xá

**Ngày:** 17/03/2026
**Mô tả:** Tổng hợp phân tích status implement các use case

---

## 📊 Tổng quan Use Case

| Actor | Use Case | Đã Implement | Còn Thiếu | Độ Phức Tạp |
|-------|----------|--------------|-----------|-------------|
| **Sinh Viên** | 8 use case | 4 | 4 | ⭐⭐ - ⭐⭐⭐ |
| **Quản Lý KTX** | 5 use case | 3 | 2 | ⭐⭐ - ⭐⭐⭐ |
| **Kế Toán** | 4 use case | 2 | 2 | ⭐⭐ - ⭐⭐⭐ |
| **Kỹ Thuật** | 3 use case | 1 | 2 | ⭐⭐ - ⭐⭐⭐ |
| **Ban Giám Đốc** | 3 use case | 0 | 3 | ⭐⭐ |
| **Admin IT** | 3 use case | 1 | 2 | ⭐⭐ - ⭐⭐⭐ |

---

## ✅ USE CASE ĐÃ IMPLEMENT

### 1. SINH VIÊN

| Use Case | API Hỗ Trợ | Frontend | Status | Lưu ý |
|----------|-------------|----------|--------|-------|
| UC05 Xem hóa đơn | ✅ `GET /invoices/my-invoices` | ✅ Student:invoices | 100% | Hoàn thiện |
| UC06 Báo sự cố | ✅ `POST /incidents`<br>✅ `GET /my-incidents` | ✅ Student:incidents | 100% | Hoàn thiện |
| UC07 Chat với AI | ✅ `POST /chatbot/send`<br>✅ `POST /chatbot/stream` | ✅ Student:chatbot | 100% | Hoàn thiện |

### 2. QUẢN LÝ KTX

| Use Case | API Hỗ Trợ | Frontend | Status | Lưu ý |
|----------|-------------|----------|--------|-------|
| UC09 Duyệt hồ sơ | ✅ `GET /contracts/registrations`<br>✅ `PUT /contracts/registrations/:id/approve`<br>✅ `PUT /contracts/registrations/:id/reject` | ✅ Admin:contracts | 90% | Cần thêm tính năng ưu tiên |
| UC10 Phân phòng | ✅ Tự động tạo contract khi approve | ✅ Admin:contracts | 100% | Built-in với UC09 |
| UC13 Quản lý hợp đồng | ✅ `GET /contracts`<br>✅ `PUT /contracts/:id/terminate` | ✅ Admin:contracts | 80% | Cần thêm gợi ý gia hạn |

### 3. KẾ TOÁN

| Use Case | API Hỗ Trợ | Frontend | Status | Lưu ý |
|----------|-------------|----------|--------|-------|
| UC14 Tạo hóa đơn hàng tháng | ✅ `POST /invoices/generate`<br>✅ `POST /invoices/generate-batch` | ✅ Admin:invoices | 70% | Cần UI nhập chỉ số |
| UC16 Quản lý tiền cọc | ✅ Field trong contract | ✅ Admin:contracts | 60% | Cần form tính toán chi tiết |

### 4. ADMIN IT

| Use Case | API Hỗ Trợ | Frontend | Status | Lưu ý |
|----------|-------------|----------|--------|-------|
| UC24 Quản lý tài khoản | ✅ `GET /users`<br>✅ `PUT /users/:id`<br>✅ `DELETE /users/:id` | ✅ Admin:settings | 70% | Cần thêm phân quyền RBAC |

---

## ❌ USE CASE CHƯA IMPLEMENT

### 5. SINH VIÊN (Còn 4/8)

| Use Case | API Cần Thêm | Frontend Cần Thêm | Độ Phức Tạp | Ưu Tiên |
|----------|--------------|-------------------|-------------|---------|
| **UC01 Đăng ký phòng** | POST /contracts/registrations<br>Upload giấy tờ<br>Tính điểm ưu tiên | ✅ Student:register | ⭐⭐⭐ | **1. Cao** |
| **UC02 Gia hạn hợp đồng** | GET /contracts/my-contracts<br>PUT /contracts/:id/renew<br>Thanh toán cọc bổ sung | ✅ Student:contracts | ⭐⭐ | **2. Trung bình** |
| **UC03 Trả phòng** | GET /contracts/my-contracts<br>POST /contracts/:id/return<br>PUT /contracts/:id/handover<br>Tính phí bồi thường | ✅ Student:contracts | ⭐⭐⭐ | **3. Cao** |
| **UC08 Đăng ký tạm vắng** | POST /contracts/:id/temporary-leave<br>GET /contracts/:id/temporary-leave-status | ✅ Student:contracts | ⭐ | **4. Thấp** |

### 6. QUẢN LÝ KTX (Còn 2/5)

| Use Case | API Cần Thêm | Frontend Cần Thêm | Độ Phức Tạp | Ưu Tiên |
|----------|--------------|-------------------|-------------|---------|
| **UC11 Quản lý chuyển phòng** | POST /contracts/:id/transfer<br>PUT /contracts/:id/transfer/assign<br>GET /contracts/transfer-requests | ✅ Admin:contracts | ⭐⭐ | **5. Trung bình** |
| **UC12 Lập biên bản vi phạm** | POST /incidents/violations<br>GET /incidents/violations<br>GET /incidents/:id/violation-log | ✅ Admin:incidents | ⭐⭐ | **6. Trung bình** |

### 7. KẾ TOÁN (Còn 2/4)

| Use Case | API Cần Thêm | Frontend Cần Thêm | Độ Phức Tạp | Ưu Tiên |
|----------|--------------|-------------------|-------------|---------|
| **UC15 Đối soát thanh toán** | GET /invoices/reconciliation<br>POST /invoices/reconciliation/process<br>GET /invoices/reconciliation/report | ✅ Admin:invoices | ⭐⭐⭐ | **7. Cao** |
| **UC17 Xuất báo cáo tài chính** | GET /invoices/financial-reports<br>GET /invoices/financial-reports/:type/export<br>POST /invoices/financial-reports/:id/approve | ✅ Admin:invoices | ⭐⭐ | **8. Trung bình** |

### 8. KỸ THUẬT (Còn 2/3)

| Use Case | API Cần Thêm | Frontend Cần Thêm | Độ Phức Tạp | Ưu Tiên |
|----------|--------------|-------------------|-------------|---------|
| **UC18 Tiếp nhận & xử lý ticket** | ✅ Đã có `PUT /incidents/:id/assign`<br>✅ Đã có `PUT /incidents/:id/resolve`<br>❌ Thiếu `POST /incidents/:id/materials`<br>❌ Thiếu `PUT /incidents/:id/photos` | ✅ Staff:incidents<br>❌ Technician:dashboard | ⭐⭐⭐ | **9. Cao** |
| **UC19 Lập lịch bảo trì** | GET /incidents/maintenance-plans<br>POST /incidents/maintenance-plans<br>GET /incidents/maintenance-plans/:id/checklist | ✅ Staff:incidents<br>❌ Technician:dashboard | ⭐⭐ | **10. Trung bình** |
| **UC20 Nghiệm thu sửa chữa** | ✅ Built-in với UC03<br>❌ Thiếu form checklist chi tiết | ✅ Staff:contracts<br>❌ Technician:dashboard | ⭐⭐ | **11. Trung bình** |

### 9. BAN GIÁM ĐỐC (Còn 3/3)

| Use Case | API Cần Thêm | Frontend Cần Thêm | Độ Phức Tạp | Ưu Tiên |
|----------|--------------|-------------------|-------------|---------|
| **UC21 Xem Dashboard tổng hợp** | GET /dashboard/admin/stats<br>GET /dashboard/admin/overview<br>GET /dashboard/admin/trends | ✅ Admin:dashboard | ⭐⭐ | **12. Trung Bình** |
| **UC22 Duyệt chính sách/giá phòng** | GET /system/configs/approvals<br>PUT /system/configs/:id/approve<br>POST /system/configs | ✅ Admin:settings<br>❌ Board:approvals | ⭐⭐ | **13. Trung Bình** |
| **UC23 Xuất báo cáo định kỳ** | GET /reports/daily<br>GET /reports/monthly<br>GET /reports/quarterly<br>GET /reports/yearly | ✅ Admin:reports | ⭐⭐ | **14. Trung Bình** |

### 10. ADMIN IT (Còn 2/3)

| Use Case | API Cần Thêm | Frontend Cần Thêm | Độ Phức Tạp | Ưu Tiên |
|----------|--------------|-------------------|-------------|---------|
| **UC25 Cấu hình hệ thống** | GET /system/configs<br>PUT /system/configs/:id<br>POST /system/configs | ✅ Admin:settings<br>❌ IT:config | ⭐⭐ | **15. Thấp** |
| **UC26 Xem audit log** | GET /audit/logs<br>GET /audit/logs/:userId<br>GET /audit/logs/export | ✅ Admin:settings<br>❌ IT:audit | ⭐⭐ | **16. Thấp** |

---

## 🎯 Chiến Lược Implement Đề Xuất

### Phase 1: Hệ trọng cơ bản (High Priority - 1-2 tuần)

#### 1.1 Sinh Viên (Cần khẩn cấp)
- **UC01 Đăng ký phòng** ⭐⭐⭐
  - Backend: Registration API + File upload + Priority score calculation
  - Frontend: Form đăng ký + Upload giấy tờ + Danh sách phòng trống
  - Kết quả: Sinh viên có thể đăng ký phòng online

- **UC03 Trả phòng** ⭐⭐⭐
  - Backend: Return flow + Damage assessment API + Deposit refund calculation
  - Frontend: Form đăng ký trả + Lịch kiểm tra phòng + Báo cáo hư hỏng
  - Kết quả: Thủ tục trả phòng không cần ra quầy

#### 1.2 Kế Toán (Cần khẩn cấp)
- **UC14 Tạo hóa đơn hàng tháng** ⭐⭐⭐
  - Backend: Batch invoice generation + Smart meter input
  - Frontend: Form nhập chỉ số điện nước + Batch submit
  - Kết quả: Tự động hóa việc tạo hóa đơn hàng tháng

### Phase 2: Nâng cao trải nghiệm (Medium Priority - 1-2 tuần)

#### 2.1 Sinh Viên (Nâng cao)
- **UC02 Gia hạn hợp đồng** ⭐⭐
  - Backend: Renew contract API + Auto-calculate deposit difference
  - Frontend: Modal gia hạn + Thanh toán cọc bổ sung
  - Kết quả: Gia hạn không cần đi quầy kế toán

- **UC08 Đăng ký tạm vắng** ⭐
  - Backend: Temporary leave API + Auto-update room status
  - Frontend: Form đăng ký tạm vắng + Thông báo khi quay về
  - Kết quả: Quản lý tạm vắng thông minh

#### 2.2 Quản Lý KTX
- **UC11 Quản lý chuyển phòng** ⭐⭐
  - Backend: Transfer API + Validation logic
  - Frontend: List yêu cầu chuyển phòng + Form duyệt/từ chối
  - Kết quả: Chuyển phòng không cần nhiều thao tác thủ công

- **UC12 Lập biên bản vi phạm** ⭐⭐
  - Backend: Violation API + Auto-suggest penalty
  - Frontend: Form tạo biên bản + List vi phạm
  - Kết quả: Ghi nhận vi phạm chuẩn xác

#### 2.3 Kế Toán
- **UC15 Đối soát thanh toán** ⭐⭐⭐
  - Backend: Reconciliation API + File upload + Auto-match
  - Frontend: Upload file đối chiếu + Report chênh lệch
  - Kết quả: Đối soát tự động, giảm sai sót

#### 2.4 Kỹ Thuật
- **UC18 Tiếp nhận & xử lý ticket** ⭐⭐⭐
  - Backend: Complete ticket workflow API
  - Frontend: Technician dashboard + Upload photos + Materials tracking
  - Kết quả: Workflow kỹ thuật hoàn thiện

### Phase 3: Quản trị & Dashboard (Medium Priority - 1 tuần)

#### 3.1 Ban Giám Đốc
- **UC21 Xem Dashboard tổng hợp** ⭐⭐
  - Backend: Dashboard API + Aggregation logic
  - Frontend: Dashboard page + KPI widgets
  - Kết quả: Theo dõi hoạt động KTX trong thời gian thực

#### 3.2 Admin IT
- **UC24 Quản lý tài khoản** ⭐⭐⭐
  - Backend: User management API + Role assignment
  - Frontend: User management UI + RBAC config
  - Kết quả: Quản lý tài khoản đầy đủ

- **UC25 Cấu hình hệ thống** ⭐⭐
  - Backend: Config API + Persistence
  - Frontend: Settings page + Form config
  - Kết quả: Tham số vận hành linh hoạt

### Phase 4: Bổ sung chi tiết (Low Priority - 1 tuần)

#### 4.1 Kế Toán
- **UC16 Quản lý tiền cọc** ⭐⭐
- **UC17 Xuất báo cáo tài chính** ⭐⭐

#### 4.2 Kỹ Thuật
- **UC19 Lập lịch bảo trì** ⭐⭐
- **UC20 Nghiệm thu sửa chữa** ⭐⭐

#### 4.3 Ban Giám Đốc
- **UC22 Duyệt chính sách/giá phòng** ⭐⭐
- **UC23 Xuất báo cáo định kỳ** ⭐⭐

#### 4.4 Admin IT
- **UC26 Xem audit log** ⭐⭐

---

## 🏗️ Kiến Trúc Tham Khảo

### Backend Module Mới

```
backend/src/modules/
├── registrations/           # UC01: Đăng ký phòng
│   ├── registrations.routes.ts
│   ├── registrations.controller.ts
│   ├── registrations.service.ts
│   └── registrations.validator.ts
├── returns/                 # UC03: Trả phòng
│   ├── returns.routes.ts
│   ├── returns.controller.ts
│   ├── returns.service.ts
│   └── returns.validator.ts
├── renewals/                # UC02: Gia hạn hợp đồng
│   ├── renewals.routes.ts
│   ├── renewals.controller.ts
│   ├── renewals.service.ts
│   └── renewals.validator.ts
├── transfers/               # UC11: Chuyển phòng
│   ├── transfers.routes.ts
│   ├── transfers.controller.ts
│   ├── transfers.service.ts
│   └── transfers.validator.ts
├── violations/              # UC12: Vi phạm nội quy
│   ├── violations.routes.ts
│   ├── violations.controller.ts
│   ├── violations.service.ts
│   └── violations.validator.ts
├── reconciliation/          # UC15: Đối soát thanh toán
│   ├── reconciliation.routes.ts
│   ├── reconciliation.controller.ts
│   ├── reconciliation.service.ts
│   └── reconciliation.validator.ts
├── maintenance/             # UC19: Bảo trì định kỳ
│   ├── maintenance.routes.ts
│   ├── maintenance.controller.ts
│   ├── maintenance.service.ts
│   └── maintenance.validator.ts
├── reports/                 # UC17, UC23: Báo cáo
│   ├── reports.routes.ts
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   └── reports.validator.ts
├── dashboard/               # UC21: Dashboard
│   ├── dashboard.routes.ts
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   └── dashboard.validator.ts
└── approvals/               # UC22: Duyệt chính sách
    ├── approvals.routes.ts
    ├── approvals.controller.ts
    ├── approvals.service.ts
    └── approvals.validator.ts
```

### Database Schema Extension

```prisma
// Tabel mới hoặc bổ sung
model RegistrationRequest {
  id        String @id @default(uuid())
  studentId String
  roomId    String?
  priorityScore Int
  documents Json  // ["cccd", "xacnhan", "hoivien"]
  status    String // PENDING, APPROVED, REJECTED, NEED_INFO
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ReturnRequest {
  id              String @id @default(uuid())
  contractId      String
  returnDate      DateTime
  status          String // PENDING, SCHEDULED, COMPLETED
  scheduleDate    DateTime?
  damageNotes     String?
  damagePhotos    Json?
  status          String // PENDING, SCHEDULED, COMPLETED
  notes           String?
}

model Violation {
  id              String @id @default(uuid())
  studentId       String
  incidentId      String
  type            String
  description     String
  evidence        Json?
  penaltyLevel    String // LOW, MEDIUM, HIGH, SEVERE
  penaltyAmount   Float?
  penaltyApplied  Boolean @default(false)
  status          String // PENDING, PROCESSED, CLOSED
  notes           String?
  createdAt       DateTime @default(now())
}

model ReconciliationReport {
  id              String @id @default(uuid())
  month           String  // "2026-03"
  status          String  // PENDING, PROCESSED, ARCHIVED
  paymentGates    Json    // ["vnPay", "momo", "banking"]
  data            Json    // Raw reconciliation data
  processedAt     DateTime?
  processedBy     String?
}

model MaintenancePlan {
  id              String @id @default(uuid())
  name            String
  description     String
  frequency       String // WEEKLY, MONTHLY, QUARTERLY
  nextExecution   DateTime
  status          String // ACTIVE, PAUSED, COMPLETED
  checklist       Json    // Array of checklist items
}

model SystemConfig {
  key             String @unique
  value           Json
  category        String // PAYMENT, NOTIFICATION, SCHEDULING
  description     String?
  updatedAt       DateTime @updatedAt
}
```

---

## 📝 Checklist Kế Hoạch Chi Tiết

### Giao diện người dùng cần thêm

#### Student (Sinh viên)
- [ ] `student/register/page.tsx` - Đăng ký phòng (UC01)
- [ ] `student/contracts/renew/page.tsx` - Gia hạn hợp đồng (UC02)
- [ ] `student/contracts/return/page.tsx` - Trả phòng (UC03)
- [ ] `student/contracts/leave/page.tsx` - Tạm vắng (UC08)
- [ ] `student/invoices/reconciliation/page.tsx` - Đối soát (UC15)

#### Admin/Staff (Quản lý)
- [ ] `admin/contracts/transfers/page.tsx` - Chuyển phòng (UC11)
- [ ] `admin/incidents/violations/page.tsx` - Vi phạm (UC12)
- [ ] `admin/incidents/maintenance/page.tsx` - Bảo trì (UC19)
- [ ] `admin/invoices/reconciliation/page.tsx` - Đối soát (UC15)
- [ ] `admin/reports/financial/page.tsx` - Báo cáo tài chính (UC17)
- [ ] `admin/reports/daily/page.tsx` - Báo cáo định kỳ (UC23)
- [ ] `admin/dashboard/page.tsx` - Dashboard (UC21)

#### Admin IT
- [ ] `admin/settings/users/page.tsx` - Quản lý tài khoản (UC24)
- [ ] `admin/settings/config/page.tsx` - Cấu hình hệ thống (UC25)
- [ ] `admin/settings/audit/page.tsx` - Audit log (UC26)

#### Board (Ban giám đốc)
- [ ] `board/approvals/page.tsx` - Duyệt chính sách (UC22)

---

## 🔧 Kỹ thuật cần triển khai

### Backend
- [ ] File upload API (multer/s3)
- [ ] Priority score calculation logic
- [ ] Damage assessment workflow
- [ ] Reconciliation file parsing
- [ ] Dashboard aggregation queries
- [ ] Report generation (PDF/Excel)
- [ ] Audit logging middleware

### Frontend
- [ ] Form builder components
- [ ] File upload UI
- [ ] Dashboard KPI widgets
- [ ] Chart components (recharts)
- [ ] Report preview components
- [ ] Audit log filtering

### Database
- [ ] New tables migrations
- [ ] Index optimization
- [ ] Audit triggers

---

## ⏱️ Thời gian dự kiến

| Phase | Use Case | API | Frontend | Database | Tổng |
|-------|----------|-----|----------|----------|------|
| **1** | UC01, UC03, UC14 | 15 | 12 | 8 | 35h |
| **2** | UC02, UC08, UC11, UC12, UC15, UC18 | 25 | 20 | 10 | 55h |
| **3** | UC21, UC24 | 8 | 8 | 4 | 20h |
| **4** | UC16, UC17, UC19, UC20, UC22, UC23, UC25, UC26 | 20 | 15 | 8 | 43h |
| **TỔNG** | **26 use case** | **68** | **55** | **30** | **153h** |

---

## 📚 Knowledge Base cần bổ sung

Dựa trên use case mới, cần cập nhật knowledge base:

### Cập nhật
- [ ] `noi-qui-ktx.md` - Thêm quy định chuyển phòng, tạm vắng, tách phòng
- [ ] `quy-trinh-dang-ky-phong.md` - Cập nhật form đăng ký online, upload giấy tờ
- [ ] `huong-dan-thanh-toan.md` - Cập nhật phí chuyển phòng, phí bồi thường
- [ ] `huong-dan-bao-su-co.md` - Thêm checklist nghiệm thu phòng
- [ ] `faq.md` - Thêm câu hỏi về gia hạn, tạm vắng, chuyển phòng

### Sửa lỗi
- [ ] **bang-gia-phong.md** - Cắt bỏ trùng lặp 70 lần, chuẩn hóa

---

## ✅ Kết Luận

### Điểm mạnh hiện tại
1. ✅ Backend API đã chuẩn, module structure rõ ràng
2. ✅ Frontend đã có nhiều page sẵn, chỉ cần bổ sung mới
3. ✅ Database schema cơ bản đã có
4. ✅ Chatbot AI + RAG pipeline đã sẵn sàng

### Thách thức chính
1. ❌ Cần hoàn thiện 10 use case quan trọng nhất (UC01, UC03, UC14, UC18)
2. ❌ Thiếu Dashboard cho BGĐ và Kỹ thuật
3. ❌ Audit log chưa được tích hợp
4. ❌ Payment reconciliation chưa có

### Đề xuất chiến lược
1. **Ngắn hạn (2 tuần):** Hoàn thiện UC01, UC03, UC14, UC18 - những use case cơ bản nhất
2. **Trung hạn (1 tháng):** Hoàn thiện 26/26 use case
3. **Dài hạn (2 tháng):** Dashboard nâng cao + Integrations (IoT, Payment gateways)

---
