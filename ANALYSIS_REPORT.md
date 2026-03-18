# BAO CAO PHAN TICH HE THONG QUAN LY KY TUC XA + AI CHATBOT

> Cap nhat theo trang thai codebase hien tai (backend + frontend) den ngay 16/03/2026.

---

## 1) Tong quan he thong

He thong gom 2 khoi chinh:
- Backend: Express + Prisma + PostgreSQL, API prefix `/api/v1`, chay mac dinh `http://localhost:3001`.
- Frontend: Next.js 16 + TypeScript + Tailwind, chay mac dinh `http://localhost:3000`.

Vai tro nguoi dung:
- `admin`: quan tri toan bo.
- `staff`: van hanh nghiep vu hang ngay.
- `student`: su dung dich vu KTX, xem thong tin ca nhan, hoa don, su co, chatbot.

AI Chatbot:
- Co session chat, message, support streaming SSE.
- Co RAG voi Knowledge Base (bang du lieu + file markdown).
- Co mo rong ngu canh theo thong tin sinh vien/hop dong/phong.

---

## 2) Kien truc va thanh phan

### 2.1 Backend service map
- App boot: `backend/src/index.ts`
- Express app + route mount: `backend/src/app.ts`
- Middleware chung:
  - auth: `backend/src/common/middlewares/auth.middleware.ts`
  - error: `backend/src/common/middlewares/error.middleware.ts`
  - response helpers: `backend/src/common/utils/response.ts`

Route da mount:
- `/api/v1/auth`
- `/api/v1/rooms`
- `/api/v1/students`
- `/api/v1/contracts`
- `/api/v1/invoices`
- `/api/v1/incidents`
- `/api/v1/chatbot`
- `/api/v1/notifications`

### 2.2 Frontend routing + auth gate
- Next.js 16 dung `proxy.ts`: `frontend/src/proxy.ts`
- Trang goc redirect theo role server-side: `frontend/src/app/page.tsx`
- Login co co che tranh stale auth state/cookie mismatch: `frontend/src/app/login/page.tsx`

---

## 3) Mo hinh du lieu (CSDL) - bang va quan he

Nguon chuan: `backend/prisma/schema.prisma`

### 3.1 Cac bang nghiep vu cot loi

1. `users`
- Chua tai khoan dang nhap va role (`admin/staff/student`).
- 1-1 voi `students` (neu la sinh vien) hoac `staff_info` (neu la nhan vien).
- 1-n voi notifications, chat sessions, incidents (reporter/assignee), contract approver.

2. `students`
- Ho so sinh vien (ma SV, khoa, nien khoa, CCCD, uu tien,...).
- Khoa ngoai toi `users`.
- 1-n voi `contracts`, `registration_requests`.

3. `staff_info`
- Mo rong thong tin nhan vien (vi tri, phong ban), 1-1 voi `users`.

4. `room_types`
- Loai phong (ten, suc chua, gia thang, gioi tinh, tien ich).
- `amenities` kieu JSON, da duoc dung de luu `assetTemplates` cho ban giao tai san.

5. `rooms`
- Phong cu the (so phong, toa, tang, status, notes, images).
- FK den `room_types`.

6. `contracts`
- Hop dong o giua sinh vien va phong.
- FK den `students`, `rooms`, optional approver (`users`).
- Chua gia thue, coc, trang thai, ly do ket thuc.

7. `asset_handovers` (moi them)
- Bien ban ban giao CSVc theo hop dong, 1-1 voi `contracts`.
- `items` JSON: danh sach tai san va tinh trang.
- optional `confirmed_by` -> `users`.

8. `registration_requests`
- Don dang ky phong cua sinh vien, luong pending/approve/reject.
- Lien ket `students`, `room_types`, optional `rooms`.

9. `invoices`
- Hoa don thang theo hop dong (phi phong + dien + nuoc + phi khac).
- Trang thai/paidAt/paymentMethod/paymentRef.

10. `incidents`
- Su co phong o (reporter, room, assignee, uu tien, trang thai, xu ly).

11. `notifications`
- Thong bao theo user, co read/unread, reference den doi tuong nghiep vu.

12. `chat_sessions`, `chat_messages`
- Luu hoi thoai chatbot theo phien.
- `chat_messages.sources` JSON de trace nguon RAG.

13. `knowledge_base`
- Bai viet tri thuc cho chatbot.

14. `system_config`
- Cau hinh he thong key/value.

### 3.2 Quan he du lieu quan trong
- `users (1) -> (0..1) students`
- `students (1) -> (n) contracts`
- `rooms (1) -> (n) contracts`
- `contracts (1) -> (0..1) asset_handovers`
- `contracts (1) -> (n) invoices`
- `students (1) -> (n) registration_requests`
- `room_types (1) -> (n) rooms`
- `users (1) -> (n) notifications`
- `users (1) -> (n) chat_sessions -> (n) chat_messages`

---

## 4) API hien co (thuc te da co route)

### 4.1 Auth (`/api/v1/auth`)
- Dang ky/dang nhap/refresh/logout
- `me`, update profile, doi mat khau
- Quen mat khau/reset mat khau
- Quan ly user (admin/staff)

### 4.2 Rooms (`/api/v1/rooms`)
- Room CRUD + room type CRUD
- Thong ke phong
- `GET /my-room`
- `GET /available` (moi): tra ve phong con cho, group theo toa/tang

### 4.3 Students (`/api/v1/students`)
- Student list/detail/update
- `GET /me`, `PUT /me`, `GET /my-contracts`
- `GET /by-code/:code` (moi): tra cuu sinh vien theo ma
- Tra cuu contracts/invoices/incidents theo student

### 4.4 Contracts (`/api/v1/contracts`)
- Hop dong CRUD + terminate
- Registration requests: tao/liet ke/duyet/tu choi
- `POST /:id/handover` (moi)
- `GET /:id/handover` (moi)

### 4.5 Invoices (`/api/v1/invoices`)
- List/detail/update
- Generate single + batch
- Process payment
- Stats summary/monthly
- Endpoints theo student (`/my-invoices`, `/current`)

### 4.6 Incidents (`/api/v1/incidents`)
- CRUD su co + assign + update status + resolve
- Stats + `my-incidents`

### 4.7 Chatbot (`/api/v1/chatbot`)
- Session management
- Message sync + stream
- Stats
- Admin knowledge index + CRUD entry

### 4.8 Notifications (`/api/v1/notifications`)
- List/detail, mark read, mark all, unread count
- Recent/stats
- clear read, cleanup old

---

## 5) Quy trinh nghiep vu chinh

## 5.1 Quy trinh tao hop dong moi (da nang cap multi-step)

Muc tieu: tranh loi UUID, dam bao dung du lieu va tao kem ban giao tai san.

B1 - Xac thuc sinh vien
- Nhap `studentCode`.
- FE goi `GET /students/by-code/:code`.
- He thong tra ve profile + thong tin hop dong active.
- Neu da co hop dong active -> chan tiep tuc.

B2 - Chon phong
- FE goi `GET /rooms/available`.
- Chon theo `toa -> tang -> phong`.
- Hien thi `slotsLeft`, suc chua, gia tu room type.

B3 - Nhap thong tin hop dong
- startDate, optional endDate.
- monthlyRent auto-fill tu `roomType.monthlyPrice` (co the chinh tay).
- depositAmount.

B4 - Ban giao tai san
- Doc `roomType.amenities.assetTemplates`.
- Nhan vien chon tinh trang tung tai san (`good/normal/broken`) + ghi chu.

Submit
- FE goi `POST /contracts` voi `studentId` la UUID (KHONG dung studentCode).
- Sau khi co `contractId`, goi tiep `POST /contracts/:id/handover` de luu bien ban.

Ket qua
- Hop dong + bien ban ban giao tao cung phien lam viec.
- Contract detail co the xem lai handover qua `GET /contracts/:id/handover`.

## 5.2 Quy trinh duyet don dang ky phong
- Sinh vien tao registration request.
- Admin/Staff xem danh sach pending.
- Duyet:
  - Chon phong
  - He thong check suc chua phong
  - Tao contract active
  - Cap nhat request -> approved
- Tu choi:
  - Cap nhat request -> rejected + review note

## 5.3 Quy trinh hoa don va thanh toan
- Generate hoa don theo thang (single/batch).
- Hoa don tinh tong tu phi phong + dien + nuoc + phi khac.
- Khi payment thanh cong:
  - cap nhat status, paidAt, paymentMethod
  - tao notification cho sinh vien.

## 5.4 Quy trinh su co
- Student tao su co (room/category/priority/mo ta/anh).
- Staff/Admin assign nguoi xu ly.
- Cap nhat status `pending -> in_progress -> resolved/closed`.
- Luu resolutionNote + thoi diem resolved.

## 5.5 Quy trinh chatbot RAG
- User gui cau hoi trong chat session.
- He thong lay student context (neu co).
- Query knowledge base (embedding + retrieval).
- Dung context + prompt de tao cau tra loi.
- Luu chat message + sources vao DB.
- Co the stream token qua SSE endpoint.

---

## 6) Luong du lieu (Data Flow)

## 6.1 Luong auth va phan quyen
- Login -> backend tra access/refresh token.
- FE luu token (cookie + zustand state).
- `proxy.ts` chan/cho phep route theo cookie + role.
- Root page server-side redirect den `/{role}`.

## 6.2 Luong tao hop dong
- Frontend form (4 buoc) -> API students/rooms/contracts/handover.
- Backend validate business rules:
  - student khong co active contract
  - room con cho
  - studentId/roomId dung UUID
- DB write:
  - `contracts`
  - optional `asset_handovers`

## 6.3 Luong detail hop dong
- FE mo contract detail
- FE goi `GET /contracts/:id/handover`
- Render danh sach tai san da ban giao + nguoi xac nhan + ngay ban giao.

## 6.4 Luong thong bao
- Su kien nghiep vu (vd payment) -> tao notification.
- FE poll/fetch notifications + unread count.
- User mark read / read all.

---

## 7) Danh gia trang thai hien tai

### 7.1 Da on dinh va da hoat dong
- CSDL va schema nghiep vu day du, da bo sung `asset_handovers`.
- Auth + RBAC middleware hoat dong.
- Rooms/Students/Contracts/Invoices/Incidents/Notifications/Chatbot da co route va service.
- Frontend da co cac page quan trong cho admin/staff/student.
- Flow tao hop dong multi-step + handover da tich hop tren admin contracts page.
- Da them trang staff contracts.
- Frontend va backend deu compile TypeScript thanh cong (`tsc --noEmit`).

### 7.2 Cac diem can tiep tuc nang cap
- Role guard chua dong deu o mot so routes student/contracts/invoices/incidents (mot so route dang authenticate-only).
- Payment online VNPay/MoMo chua thay route callback hoan chinh theo dac ta thanh toan day du.
- Test tu dong (unit/integration/e2e) chua thay bo test day du.
- CI/CD, seed data lon, hardening production chua hoan tat.
- Report va permission matrix chua chuan hoa thanh tai lieu van hanh chinh thuc.

---

## 8) Bang tong hop nhanh

### 8.1 Bang nghiep vu theo doi tuong
| Doi tuong | Bang trung tam | Bang lien quan |
|---|---|---|
| Tai khoan | users | students, staff_info, notifications, chat_sessions |
| Ho so SV | students | contracts, registration_requests |
| Co so phong | room_types, rooms | contracts, incidents |
| O noi tru | contracts | asset_handovers, invoices |
| Dang ky phong | registration_requests | students, room_types, rooms |
| Hoa don | invoices | contracts |
| Su co | incidents | users, rooms |
| Chatbot | chat_sessions, chat_messages | knowledge_base |
| Thong bao | notifications | users |

### 8.2 Bang endpoint then chot cho hop dong moi
| Endpoint | Muc dich |
|---|---|
| `GET /api/v1/students/by-code/:code` | Tra cuu sinh vien theo ma |
| `GET /api/v1/rooms/available` | Lay phong con cho theo toa/tang |
| `POST /api/v1/contracts` | Tao hop dong |
| `POST /api/v1/contracts/:id/handover` | Tao bien ban ban giao |
| `GET /api/v1/contracts/:id/handover` | Xem bien ban ban giao |

---

## 9) Ket luan

So voi ban bao cao cu, he thong da tien xa hon dang ke:
- Khong con o muc "placeholder" cho nhieu module chinh.
- Da co workflow hop dong day du hon (xac thuc sinh vien -> chon phong -> tao hop dong -> ban giao CSVc).
- Da co luong du lieu ro rang giua frontend, API va DB cho cac nghiep vu cot loi.

Neu can, buoc tiep theo nen la:
1) Chuan hoa role-permission matrix theo tung endpoint.
2) Bo sung test cho cac luong quan trong (contract creation, registration approval, payment).
3) Hoan thien tai lieu van hanh production (monitoring, backup, incident response).

---

*Bao cao cap nhat boi AI Assistant*
*Ngay cap nhat: 16/03/2026*
