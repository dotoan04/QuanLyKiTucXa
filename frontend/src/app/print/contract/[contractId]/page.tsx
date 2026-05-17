'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface ContractDetail {
  id: string
  startDate: string
  endDate: string | null
  monthlyRent: number | string
  depositAmount: number | string
  status: string
  student: {
    studentCode: string
    idCardNumber?: string
    faculty?: string
    dateOfBirth?: string
    user: { fullName: string; email: string; phone?: string }
  }
  room: {
    roomNumber: string
    building: string
    floor: number
    roomType: { name: string; capacity: number }
  }
  assetHandover?: {
    items: Array<{ name: string; quantity?: number; condition: string; note?: string }>
    electricityInitial?: number | null
    waterInitial?: number | null
    completedAt?: string | null
    notes?: string | null
  } | null
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function fmtDate(d: string | Date | null | undefined, long = false): string {
  if (!d) return '...............'
  const dt = typeof d === 'string' ? new Date(d) : d
  if (isNaN(dt.getTime())) return '...............'
  if (long) {
    return `ngày ${dt.getDate().toString().padStart(2, '0')} tháng ${(dt.getMonth() + 1).toString().padStart(2, '0')} năm ${dt.getFullYear()}`
  }
  return dt.toLocaleDateString('vi-VN')
}

function fmtCurrency(v: number | string | undefined): string {
  if (v === undefined || v === null) return '...............'
  return Number(v).toLocaleString('vi-VN') + ' đồng'
}

const CONDITION_LABEL: Record<string, string> = {
  good: 'Tốt', fair: 'Bình thường', poor: 'Kém / Hỏng', normal: 'Bình thường', broken: 'Hỏng'
}

// ─────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────
export default function ContractPrintPage() {
  const { contractId } = useParams<{ contractId: string }>()
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/contracts/${contractId}`)
      .then(r => {
        setContract(r.data.data)
        return api.get(`/contracts/${contractId}/handover`).catch(() => null)
      })
      .then(hRes => {
        if (hRes) {
          setContract(prev => prev ? { ...prev, assetHandover: hRes.data.data } : prev)
        }
      })
      .catch(() => setError('Không thể tải thông tin hợp đồng'))
      .finally(() => setLoading(false))
  }, [contractId])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#4b5563' }}>Đang tải hợp đồng...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <p style={{ color: '#dc2626' }}>{error || 'Không tìm thấy hợp đồng'}</p>
      </div>
    )
  }

  const code = `HD-${contract.id.slice(0, 8).toUpperCase()}`
  const { student, room, assetHandover } = contract
  const today = new Date()
  const handoverCompleted = Boolean(assetHandover?.completedAt)
  const hasHandover = handoverCompleted && assetHandover?.items && assetHandover.items.length > 0
  const baseArticle = hasHandover ? 6 : 5

  if (!handoverCompleted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: 24 }}>
        <div style={{ maxWidth: 560, background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 12px', fontSize: 22, color: '#111827' }}>Chưa thể in hợp đồng</h1>
          <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.6 }}>
            Hợp đồng chỉ được in sau khi hoàn tất phần bàn giao phòng và xác nhận tình trạng cơ sở vật chất.
            Vui lòng hoàn tất biên bản bàn giao trước khi in hoặc lưu PDF.
          </p>
          <button onClick={() => window.close()} style={{ marginTop: 20, padding: '8px 18px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 0, cursor: 'pointer', fontWeight: 600 }}>
            Đóng
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Toolbar - ẩn khi in */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#1f2937', color: '#fff', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="print-toolbar">
        <span style={{ fontSize: 14, color: '#d1d5db' }}>Xem trước hợp đồng — {code}</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => window.close()} style={{ padding: '6px 16px', fontSize: 13, border: '1px solid #4b5563', borderRadius: 8, background: 'transparent', color: '#fff', cursor: 'pointer' }}>
            Đóng
          </button>
          <button onClick={() => window.print()} style={{ padding: '6px 20px', fontSize: 13, borderRadius: 8, background: '#2563eb', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            🖨️ In / Lưu PDF
          </button>
        </div>
      </div>

      {/* Contract */}
      <div style={{ background: '#f3f4f6', minHeight: '100vh', paddingTop: 56 }} className="print-bg">
        <div style={{
          margin: '0 auto',
          background: '#fff',
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm 22mm 25mm 25mm',
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: '13pt',
          lineHeight: 1.65,
          color: '#000',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
        }}>

          {/* QUỐC HIỆU */}
          <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
            <p style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase', margin: '0 0 2mm' }}>
              Cộng hòa xã hội chủ nghĩa Việt Nam
            </p>
            <p style={{ fontWeight: 'bold', fontSize: '13pt', margin: '0 0 1mm' }}>
              Độc lập – Tự do – Hạnh phúc
            </p>
            <p style={{ margin: 0, letterSpacing: 4, fontSize: '11pt' }}>────────────────────</p>
          </div>

          {/* TIÊU ĐỀ */}
          <div style={{ textAlign: 'center', margin: '6mm 0 4mm' }}>
            <p style={{ fontWeight: 'bold', fontSize: '17pt', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 3mm' }}>
              Hợp đồng thuê phòng ký túc xá
            </p>
            <p style={{ fontSize: '12pt', margin: '0 0 1mm' }}>Số: {code}</p>
            <p style={{ fontSize: '12pt', fontStyle: 'italic', margin: 0 }}>{fmtDate(today, true)}</p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '5mm 0' }} />

          {/* CĂN CỨ */}
          <div style={{ marginBottom: '5mm' }}>
            {[
              'Căn cứ Bộ luật Dân sự nước Cộng hòa xã hội chủ nghĩa Việt Nam năm 2015;',
              'Căn cứ Thông tư số 13/2016/TT-BGDĐT ngày 05 tháng 4 năm 2016 của Bộ Giáo dục và Đào tạo về tiêu chuẩn cơ sở vật chất các trường đại học, cao đẳng;',
              'Căn cứ nội quy ký túc xá và nhu cầu thực tế của hai bên;',
            ].map((t, i) => (
              <p key={i} style={{ fontStyle: 'italic', fontSize: '12pt', margin: '0 0 2mm' }}>{t}</p>
            ))}
            <p style={{ fontStyle: 'italic', fontSize: '12pt', margin: 0 }}>
              Hai bên cùng thỏa thuận và ký kết hợp đồng với các điều khoản cụ thể như sau:
            </p>
          </div>

          {/* ĐIỀU 1 */}
          <Article number="1" title="Các bên tham gia hợp đồng">
            <p style={{ fontWeight: 'bold', margin: '0 0 2mm' }}>Bên A (Bên cho thuê):</p>
            <div style={{ paddingLeft: '8mm' }}>
              <Row label="Đơn vị" value="Ký Túc Xá Đại Học ABC" />
              <Row label="Địa chỉ" value="123 Đường XYZ, Quận 1, Thành phố Hồ Chí Minh" />
              <Row label="Điện thoại" value="(028) 1234 5678" />
              <Row label="Người đại diện" value="Nguyễn Văn A" />
              <Row label="Chức vụ" value="Giám đốc Ký Túc Xá" />
            </div>
            <p style={{ fontWeight: 'bold', margin: '4mm 0 2mm' }}>Bên B (Sinh viên thuê phòng):</p>
            <div style={{ paddingLeft: '8mm' }}>
              <Row label="Họ và tên" value={student.user.fullName} />
              <Row label="Ngày sinh" value={fmtDate(student.dateOfBirth)} />
              <Row label="MSSV" value={student.studentCode} />
              <Row label="Số CCCD/CMND" value={student.idCardNumber || '...............'} />
              <Row label="Khoa/Ngành" value={student.faculty || '...............'} />
              <Row label="Điện thoại" value={student.user.phone || '...............'} />
              <Row label="Email" value={student.user.email} />
            </div>
          </Article>

          {/* ĐIỀU 2 */}
          <Article number="2" title="Phòng thuê">
            <div style={{ paddingLeft: '8mm' }}>
              <Row label="Số phòng" value={`${room.roomNumber} – Tòa ${room.building}, Tầng ${room.floor}`} />
              <Row label="Loại phòng" value={room.roomType.name} />
              <Row label="Sức chứa tối đa" value={`${room.roomType.capacity} người`} />
              <Row label="Thời hạn thuê" value={`${fmtDate(contract.startDate)} đến ${contract.endDate ? fmtDate(contract.endDate) : 'theo thông báo gia hạn'}`} />
            </div>
          </Article>

          {/* ĐIỀU 3 */}
          <Article number="3" title="Giá thuê và phương thức thanh toán">
            <div style={{ paddingLeft: '8mm' }}>
              <Row label="Giá thuê phòng" value={`${fmtCurrency(contract.monthlyRent)}/tháng`} />
              <Row label="Tiền đặt cọc" value={fmtCurrency(contract.depositAmount)} />
              <Row label="Kỳ thanh toán" value="Hàng tháng, trước ngày 15 của tháng hiện hành" />
              <Row label="Phương thức" value="Tiền mặt tại văn phòng KTX hoặc chuyển khoản ngân hàng" />
            </div>
            <p style={{ fontStyle: 'italic', fontSize: '12pt', margin: '3mm 0 0', paddingLeft: '4mm' }}>
              Đơn giá điện, nước áp dụng theo quy định của Nhà nước và thông báo từng kỳ của KTX.
              Tiền đặt cọc sẽ được hoàn trả khi Bên B trả phòng đúng quy định và đã thanh toán đầy đủ các khoản phát sinh.
            </p>
          </Article>

          {/* ĐIỀU 4 */}
          <Article number="4" title="Chỉ số điện nước ban đầu khi nhận phòng">
            <div style={{ paddingLeft: '8mm' }}>
              <Row
                label="Chỉ số công tơ điện"
                value={assetHandover?.electricityInitial != null ? `${assetHandover.electricityInitial} kWh` : 'Ghi nhận tại thời điểm bàn giao phòng'}
              />
              <Row
                label="Chỉ số đồng hồ nước"
                value={assetHandover?.waterInitial != null ? `${assetHandover.waterInitial} m³` : 'Ghi nhận tại thời điểm bàn giao phòng'}
              />
            </div>
          </Article>

          {/* ĐIỀU 5 — CSVC (chỉ hiện nếu có dữ liệu bàn giao) */}
          {hasHandover && (
            <Article number="5" title="Tình trạng cơ sở vật chất khi bàn giao">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5pt', marginTop: '3mm' }}>
                <thead>
                  <tr style={{ background: '#e5e7eb' }}>
                    {['STT', 'Tên hạng mục', 'SL', 'Tình trạng', 'Ghi chú'].map((h, i) => (
                      <th key={i} style={{ border: '1px solid #374151', padding: '5px 8px', textAlign: i === 0 || i === 2 || i === 3 ? 'center' : 'left', width: ['6%', '42%', '7%', '18%', '27%'][i] }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assetHandover!.items.map((item, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #9ca3af', padding: '4px 8px', textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ border: '1px solid #9ca3af', padding: '4px 8px' }}>{item.name}</td>
                      <td style={{ border: '1px solid #9ca3af', padding: '4px 8px', textAlign: 'center' }}>{item.quantity ?? 1}</td>
                      <td style={{ border: '1px solid #9ca3af', padding: '4px 8px', textAlign: 'center' }}>{CONDITION_LABEL[item.condition] || item.condition}</td>
                      <td style={{ border: '1px solid #9ca3af', padding: '4px 8px' }}>{item.note || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assetHandover?.notes && (
                <p style={{ fontStyle: 'italic', fontSize: '12pt', margin: '3mm 0 0' }}>
                  <em>Nhận xét chung:</em> {assetHandover.notes}
                </p>
              )}
            </Article>
          )}

          {/* ĐIỀU 6 / 5 — Quyền và nghĩa vụ Bên A */}
          <Article number={String(baseArticle)} title="Quyền và nghĩa vụ của Bên A">
            <p style={{ fontWeight: 'bold', margin: '0 0 1.5mm' }}>{baseArticle}.1. Quyền của Bên A:</p>
            <div style={{ paddingLeft: '8mm' }}>
              <BP>Thu tiền thuê phòng, tiền điện, tiền nước và các khoản phí theo quy định hiện hành.</BP>
              <BP>Kiểm tra, giám sát việc sử dụng phòng và tài sản trong phòng của Bên B.</BP>
              <BP>Chấm dứt hợp đồng trước thời hạn khi Bên B vi phạm nghiêm trọng nội quy ký túc xá.</BP>
              <BP>Điều chỉnh giá thuê sau khi thông báo bằng văn bản trước ít nhất 30 ngày.</BP>
            </div>
            <p style={{ fontWeight: 'bold', margin: '3mm 0 1.5mm' }}>{baseArticle}.2. Nghĩa vụ của Bên A:</p>
            <div style={{ paddingLeft: '8mm' }}>
              <BP>Bàn giao phòng đúng tiêu chuẩn, đảm bảo an ninh, vệ sinh và đầy đủ cơ sở vật chất.</BP>
              <BP>Sửa chữa, bảo trì cơ sở vật chất khi hư hỏng do lỗi thông thường (không do Bên B gây ra).</BP>
              <BP>Cung cấp hóa đơn tiền phòng, điện, nước hàng tháng.</BP>
              <BP>Hoàn trả tiền đặt cọc trong thời hạn 15 ngày sau khi Bên B trả phòng hợp lệ.</BP>
            </div>
          </Article>

          {/* ĐIỀU 7 / 6 — Quyền và nghĩa vụ Bên B */}
          <Article number={String(baseArticle + 1)} title="Quyền và nghĩa vụ của Bên B">
            <p style={{ fontWeight: 'bold', margin: '0 0 1.5mm' }}>{baseArticle + 1}.1. Quyền của Bên B:</p>
            <div style={{ paddingLeft: '8mm' }}>
              <BP>Sử dụng phòng và cơ sở vật chất được bàn giao theo đúng mục đích sinh hoạt.</BP>
              <BP>Được thông báo trước khi Bên A kiểm tra phòng (trừ trường hợp khẩn cấp về an toàn).</BP>
              <BP>Yêu cầu sửa chữa những hư hỏng không do lỗi của Bên B gây ra.</BP>
              <BP>Nhận lại tiền đặt cọc sau khi kết thúc hợp đồng và hoàn thành đầy đủ các nghĩa vụ.</BP>
            </div>
            <p style={{ fontWeight: 'bold', margin: '3mm 0 1.5mm' }}>{baseArticle + 1}.2. Nghĩa vụ của Bên B:</p>
            <div style={{ paddingLeft: '8mm' }}>
              <BP>Thanh toán tiền thuê phòng, điện, nước và các khoản phí đúng hạn theo quy định.</BP>
              <BP>Tuân thủ tuyệt đối nội quy ký túc xá; không gây mất trật tự, an ninh khu vực.</BP>
              <BP>Không tự ý cải tạo, sửa chữa hoặc thay đổi kết cấu phòng khi chưa được phép.</BP>
              <BP>Không tự ý chuyển nhượng quyền thuê phòng hoặc cho người khác ở nhờ trái phép.</BP>
              <BP>Không sử dụng đồ điện có công suất lớn (bếp điện, lò vi sóng...) khi chưa được phép.</BP>
              <BP>Bảo quản, giữ gìn cơ sở vật chất; bồi thường thiệt hại nếu làm hư hỏng, mất mát.</BP>
              <BP>Thông báo bằng văn bản trước ít nhất 30 ngày khi muốn chấm dứt hợp đồng trước hạn.</BP>
              <BP>Trả phòng đúng ngày kết thúc hợp đồng, bàn giao lại nguyên vẹn cơ sở vật chất.</BP>
            </div>
          </Article>

          {/* ĐIỀU 8 / 7 — Điều khoản chung */}
          <Article number={String(baseArticle + 2)} title="Điều khoản chung">
            <div style={{ paddingLeft: '8mm' }}>
              <BP>
                Hợp đồng có hiệu lực kể từ ngày ký và hết hiệu lực vào {contract.endDate ? `ngày ${fmtDate(contract.endDate)}` : 'ngày được ghi trong thông báo gia hạn hợp lệ'}.
              </BP>
              <BP>Mọi sửa đổi, bổ sung điều khoản hợp đồng phải được lập thành phụ lục và có chữ ký xác nhận của cả hai bên.</BP>
              <BP>
                Trong trường hợp có tranh chấp phát sinh, hai bên ưu tiên giải quyết thông qua thương lượng, hòa giải.
                Nếu không thỏa thuận được, vụ việc sẽ được đưa ra Tòa án nhân dân có thẩm quyền giải quyết theo quy định của pháp luật Việt Nam.
              </BP>
              <BP>
                Hợp đồng này được lập thành 02 (hai) bản gốc có giá trị pháp lý như nhau; Bên A giữ 01 (một) bản, Bên B giữ 01 (một) bản.
              </BP>
            </div>
          </Article>

          {/* CHỮ KÝ */}
          <div style={{ marginTop: '12mm' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #000', marginBottom: '8mm' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', width: '44%' }}>
                <p style={{ fontWeight: 'bold', fontSize: '13pt', margin: '0 0 2mm' }}>ĐẠI DIỆN BÊN A</p>
                <p style={{ fontStyle: 'italic', fontSize: '11pt', margin: '0 0 28mm' }}>(Ký, đóng dấu và ghi rõ họ tên)</p>
                <div style={{ borderTop: '1px solid #000', paddingTop: '2mm', display: 'inline-block', minWidth: 150 }}>
                  <p style={{ fontWeight: 'bold', margin: 0 }}>Nguyễn Văn A</p>
                  <p style={{ fontSize: '10pt', color: '#374151', margin: 0 }}>Giám đốc KTX</p>
                </div>
              </div>
              <div style={{ textAlign: 'center', width: '44%' }}>
                <p style={{ fontWeight: 'bold', fontSize: '13pt', margin: '0 0 2mm' }}>ĐẠI DIỆN BÊN B</p>
                <p style={{ fontStyle: 'italic', fontSize: '11pt', margin: '0 0 28mm' }}>(Ký và ghi rõ họ tên)</p>
                <div style={{ borderTop: '1px solid #000', paddingTop: '2mm', display: 'inline-block', minWidth: 150 }}>
                  <p style={{ fontWeight: 'bold', margin: 0 }}>{student.user.fullName}</p>
                  <p style={{ fontSize: '10pt', color: '#374151', margin: 0 }}>{student.studentCode}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          .print-toolbar, .print-bg { display: block !important; }
          .print-toolbar { display: none !important; }
          .print-bg { background: white !important; padding-top: 0 !important; }
          body { margin: 0; background: white; }
          #__next > div > div:first-child { display: none !important; }
        }
        @page { size: A4; margin: 0; }
      `}</style>
    </>
  )
}

// Sub-components
function Article({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '5mm' }}>
      <p style={{ fontWeight: 'bold', fontSize: '13pt', textTransform: 'uppercase', margin: '0 0 2.5mm' }}>
        Điều {number}. {title}
      </p>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p style={{ margin: '0 0 1.5mm', display: 'flex', gap: 6 }}>
      <span style={{ fontWeight: 'bold', minWidth: 170, flexShrink: 0 }}>{label}:</span>
      <span>{value}</span>
    </p>
  )
}

function BP({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 1.5mm', paddingLeft: '5mm', position: 'relative' }}>
      <span style={{ position: 'absolute', left: 0 }}>–</span>
      <span>{children}</span>
    </p>
  )
}
