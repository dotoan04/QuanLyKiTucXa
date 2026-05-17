'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Info, Building2, AlertCircle, User, Save, Phone, MapPin, CreditCard, Calendar, Users, Loader2, BedDouble, FileText, ExternalLink, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'
import { formatVnd } from '@/lib/currency'

const ROOM_GENDER_LABELS: Record<string, string> = {
  male_only: 'Phòng Nam',
  female_only: 'Phòng Nữ',
  mixed: 'Khác / đặc biệt',
}

interface RoomType {
  id: string; name: string; capacity: number; monthlyPrice: string
  genderRestriction: string; description: string; amenities: string[]
}

interface AvailableRoom {
  id: string
  roomNumber: string
  building: string
  floor: number
  status: string
  currentOccupancy: number
  slotsLeft: number
  lockedBeds: number
  roomType: {
    id: string; name: string; capacity: number; monthlyPrice: number
    genderRestriction: string; amenities: string[]
  }
}

interface StudentProfile {
  id: string
  studentCode: string
  fullName?: string
  email?: string
  phone?: string
  gender?: string
  dateOfBirth?: string
  hometown?: string
  address?: string
  idCardNumber?: string
  faculty?: string
  academicYear?: number
  user?: {
    fullName?: string
    email?: string
    phone?: string
  }
}

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [initializing, setInitializing] = useState(true)
  const [hasActiveContract, setHasActiveContract] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  // Profile form fields
  const [phone, setPhone] = useState('')
  const [idCardNumber, setIdCardNumber] = useState('')
  const [hometown, setHometown] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [selectedRoomType, setSelectedRoomType] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [notes, setNotes] = useState('')
  /** Link Google Drive (hoặc link công khai https) — minh chứng bản thân / hoàn cảnh */
  const [identityDocLink, setIdentityDocLink] = useState('')
  const [familyDocLink, setFamilyDocLink] = useState('')
  const [docLinkErrors, setDocLinkErrors] = useState<{ identity?: string; family?: string }>({})

  // Room browsing state
  const [buildings, setBuildings] = useState<string[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [floors, setFloors] = useState<number[]>([])
  const [selectedFloor, setSelectedFloor] = useState<number | ''>('')
  const [roomsOnFloor, setRoomsOnFloor] = useState<AvailableRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null)
  const [allRoomsGrouped, setAllRoomsGrouped] = useState<Record<string, Record<number, AvailableRoom[]>>>({})
  const [loadingRooms, setLoadingRooms] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [profileRes, contractsRes] = await Promise.allSettled([
        api.get('/students/me'),
        api.get('/students/my-contracts'),
      ])

      if (contractsRes.status === 'fulfilled') {
        const contracts = contractsRes.value.data.data || []
        setHasActiveContract(contracts.some((c: any) => c.status === 'active'))
      }

      if (profileRes.status === 'fulfilled') {
        const profile = profileRes.value.data.data as StudentProfile
        setStudentProfile(profile)
        setPhone(profile.user?.phone || profile.phone || '')
        setIdCardNumber(profile.idCardNumber || '')
        setHometown(profile.hometown || '')
        setAddress(profile.address || '')
        setGender(profile.gender || '')
        if (profile.dateOfBirth) {
          setDateOfBirth(profile.dateOfBirth.split('T')[0])
        }
        if (profile.user?.phone && profile.idCardNumber && profile.hometown) {
          setProfileSaved(true)
        }
        // Loại phòng theo giới tính (nam/nữ tách — API yêu cầu đã có gender trong hồ sơ)
        if (profile.gender) {
          try {
            const rt = await api.get('/registrations/room-types')
            setRoomTypes(rt.data.data || [])
          } catch {
            setRoomTypes([])
          }
        } else {
          setRoomTypes([])
        }
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    } finally {
      setInitializing(false)
    }
  }

  const fetchAvailableRooms = useCallback(async (roomTypeId: string) => {
    if (!roomTypeId) return
    setLoadingRooms(true)
    setSelectedBuilding('')
    setSelectedFloor('')
    setRoomsOnFloor([])
    setSelectedRoom(null)
    try {
      const res = await api.get('/registrations/available', { params: { roomTypeId } })
      const grouped = res.data.data || {}
      setAllRoomsGrouped(grouped)
      const buildingList = Object.keys(grouped).sort()
      setBuildings(buildingList)
      if (buildingList.length > 0) {
        setSelectedBuilding(buildingList[0])
        const floorList = Object.keys(grouped[buildingList[0]]).map(Number).sort((a, b) => a - b)
        setFloors(floorList)
        if (floorList.length > 0) {
          setSelectedFloor(floorList[0])
          setRoomsOnFloor(grouped[buildingList[0]][floorList[0]] || [])
        }
      }
    } catch (err) {
      console.error('Failed to fetch available rooms:', err)
      setAllRoomsGrouped({})
      setBuildings([])
    } finally {
      setLoadingRooms(false)
    }
  }, [])

  // When room type changes, fetch available rooms
  useEffect(() => {
    if (selectedRoomType) {
      fetchAvailableRooms(selectedRoomType)
    } else {
      setBuildings([])
      setSelectedBuilding('')
      setFloors([])
      setSelectedFloor('')
      setRoomsOnFloor([])
      setSelectedRoom(null)
      setAllRoomsGrouped({})
    }
  }, [selectedRoomType, fetchAvailableRooms])

  // When building changes, update floors
  useEffect(() => {
    if (selectedBuilding && allRoomsGrouped[selectedBuilding]) {
      const floorList = Object.keys(allRoomsGrouped[selectedBuilding]).map(Number).sort((a, b) => a - b)
      setFloors(floorList)
      setSelectedFloor(floorList[0] || '')
      setRoomsOnFloor(floorList.length > 0 ? (allRoomsGrouped[selectedBuilding][floorList[0]] || []) : [])
    } else {
      setFloors([])
      setSelectedFloor('')
      setRoomsOnFloor([])
    }
  }, [selectedBuilding, allRoomsGrouped])

  // When floor changes, update room list
  useEffect(() => {
    if (selectedBuilding && selectedFloor && allRoomsGrouped[selectedBuilding]?.[selectedFloor]) {
      setRoomsOnFloor(allRoomsGrouped[selectedBuilding][selectedFloor])
    } else {
      setRoomsOnFloor([])
    }
  }, [selectedFloor, selectedBuilding, allRoomsGrouped])

  const validateProfile = (): boolean => {    const errors: Record<string, string> = {}

    if (!phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^(0[3-9])[0-9]{8}$/.test(phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)'
    }

    if (!idCardNumber.trim()) {
      errors.idCardNumber = 'Vui lòng nhập số CCCD'
    } else if (!/^[0-9]{9,12}$/.test(idCardNumber.trim())) {
      errors.idCardNumber = 'Số CCCD không hợp lệ (9-12 chữ số)'
    }

    if (!hometown.trim()) {
      errors.hometown = 'Vui lòng nhập nơi thường trú'
    }

    if (!address.trim()) {
      errors.address = 'Vui lòng nhập nơi tạm trú'
    }

    if (!gender) {
      errors.gender = 'Vui lòng chọn giới tính — hệ thống dùng để hiển thị đúng phòng nam/nữ.'
    }

    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!validateProfile()) return

    try {
      setSavingProfile(true)
      await api.put('/students/me', {
        phone: phone.trim(),
        idCardNumber: idCardNumber.trim(),
        hometown: hometown.trim(),
        address: address.trim(),
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
      })

      // Refresh profile data + loại phòng phù hợp giới tính
      const profileRes = await api.get('/students/me')
      const updated = profileRes.data.data as StudentProfile
      setStudentProfile(updated)
      setProfileSaved(true)
      if (gender) {
        try {
          const rt = await api.get('/registrations/room-types')
          setRoomTypes(rt.data.data || [])
        } catch {
          setRoomTypes([])
        }
      } else {
        setRoomTypes([])
      }
      setStep(2)
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Cập nhật thông tin thất bại.'
      setErrorMsg(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  const validateHttpsUrl = (s: string, label: string): string | undefined => {
    const t = s.trim()
    if (!t) return `${label} là bắt buộc.`
    try {
      const u = new URL(t)
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'Chỉ dùng link http hoặc https.'
      if (u.protocol === 'http:' && typeof window !== 'undefined' && window.location.protocol === 'https:') {
        return 'Nên dùng link https (chia sẻ Google Drive thường là https).'
      }
    } catch {
      return 'Link không hợp lệ. Dán đầy đủ dạng https://...'
    }
    if (t.length > 2048) return 'Link quá dài (tối đa 2048 ký tự).'
    return undefined
  }

  const goToStep4FromDocs = () => {
    const err: { identity?: string; family?: string } = {}
    const idErr = validateHttpsUrl(identityDocLink, 'Link minh chứng bản thân')
    if (idErr) err.identity = idErr
    if (familyDocLink.trim()) {
      const fErr = validateHttpsUrl(familyDocLink, 'Link minh chứng hoàn cảnh')
      if (fErr) err.family = fErr
    }
    setDocLinkErrors(err)
    if (Object.keys(err).length === 0) setStep(4)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const documents = [identityDocLink.trim(), familyDocLink.trim()].filter(Boolean)
      const payload: Record<string, unknown> = {
        preferredRoomTypeId: selectedRoomType,
        desiredStartDate: moveInDate,
        documents,
      }
      if (selectedRoom) payload.preferredRoomId = selectedRoom.id
      if (notes) payload.notes = notes
      await api.post('/registrations', payload)
      setSuccess(true)
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = 'w-full px-4 py-2.5 text-sm rounded-xl border border-surface-300 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
  const inputErrorClasses = 'w-full px-4 py-2.5 text-sm rounded-xl border border-danger-400 bg-white font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-danger-500 focus:ring-2 focus:ring-danger-100'

  const getInputClass = (fieldName: string) => profileErrors[fieldName] ? inputErrorClasses : inputClasses

  if (initializing) {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-fade-in">
        <Card padding className="animate-pulse">
          <div className="h-7 w-48 bg-surface-200 rounded-xl mb-4" />
          <div className="h-4 w-80 bg-surface-200 rounded-lg mb-8" />
          <div className="space-y-3">
            <div className="h-10 bg-surface-200 rounded-xl" />
            <div className="h-10 bg-surface-200 rounded-xl" />
            <div className="h-10 bg-surface-200 rounded-xl" />
          </div>
        </Card>
      </div>
    )
  }

  if (hasActiveContract) {
    return (
      <div className="max-w-2xl mx-auto py-10 animate-fade-in space-y-6">
        <div className="flex items-center gap-2 text-sm text-navy-400 font-body">
          <Link href="/student" className="hover:text-navy-600 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-navy-600 font-medium">Đăng ký phòng</span>
        </div>

        <Card padding>
          <div className="flex items-start gap-3 bg-warning-50 border border-warning-200 text-warning-800 p-4 rounded-xl mb-5">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-body">
              Bạn đang có hợp đồng ở KTX còn hiệu lực nên không thể đăng ký phòng mới.
              Nếu muốn thay đổi chỗ ở, vui lòng dùng chức năng chuyển phòng.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/student/transfer">
              <Button>
                <ArrowRightLeft className="w-4 h-4" />
                Đi tới Chuyển phòng
              </Button>
            </Link>
            <Link href="/student/contract">
              <Button variant="outline">Xem hợp đồng hiện tại</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-12 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-success-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success-600" />
          </div>
          <h1 className="text-2xl font-bold font-sans text-navy-700">Đăng ký thành công!</h1>
          <p className="text-navy-400 mt-2 font-body">Hồ sơ đăng ký đã được gửi. Vui lòng chờ quản lý duyệt.</p>
        </div>
        <div className="flex justify-center gap-3">
          <Link href="/student">
            <Button variant="outline">Về trang chủ</Button>
          </Link>
          <Link href="/student/registrations">
            <Button>Theo dõi đơn đăng ký</Button>
          </Link>
        </div>
      </div>
    )
  }

  const steps = [
    { num: 1, label: 'Thông tin sinh viên' },
    { num: 2, label: 'Chọn phòng' },
    { num: 3, label: 'Tài liệu' },
    { num: 4, label: 'Xác nhận' },
  ]

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-navy-400 mb-6 font-body">
        <Link href="/student" className="hover:text-navy-600 transition-colors">Trang chủ</Link>
        <span>/</span>
        <span className="text-navy-600 font-medium">Đăng ký phòng</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-sans text-navy-700">Đăng ký phòng</h1>
        <p className="text-navy-400 mt-1 font-body">Hoàn tất các bước để gửi yêu cầu đăng ký phòng ký túc xá</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center flex-1 last:flex-initial">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-sans transition-all duration-200 ${
                step > s.num ? 'bg-success-500 text-white' :
                step === s.num ? 'bg-navy-600 text-white ring-4 ring-navy-100' :
                'bg-surface-200 text-navy-400'
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-sm font-medium font-sans hidden sm:block ${step >= s.num ? 'text-navy-700' : 'text-navy-400'}`}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 rounded-full transition-colors ${step > s.num ? 'bg-success-500' : 'bg-surface-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-start gap-3 bg-danger-50 border border-danger-200 text-danger-700 p-4 rounded-xl text-sm mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="font-body">{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Student Info - Editable Form */}
      {step === 1 && (
        <Card padding className="animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold font-sans text-navy-700">Thông tin sinh viên</h2>
          </div>
          <p className="text-sm text-navy-400 font-body mb-6">
            {profileSaved
              ? 'Thông tin đã hoàn thiện. Bạn có thể chỉnh sửa hoặc chuyển sang bước tiếp theo.'
              : 'Vui lòng hoàn thiện các thông tin bắt buộc (*) trước khi đăng ký phòng.'}
          </p>

          {/* Read-only info section */}
          <div className="bg-surface-50 rounded-xl border border-surface-200/60 p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-navy-400 font-body">Họ và tên</p>
                <p className="text-sm font-semibold font-sans text-navy-700">{studentProfile?.fullName || studentProfile?.user?.fullName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 font-body">Mã sinh viên</p>
                <p className="text-sm font-semibold font-sans text-navy-700">{studentProfile?.studentCode || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 font-body">Khoa</p>
                <p className="text-sm font-semibold font-sans text-navy-700">{studentProfile?.faculty || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 font-body">Email</p>
                <p className="text-sm font-semibold font-sans text-navy-700">{studentProfile?.email || studentProfile?.user?.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Editable form fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold font-sans text-navy-700 mb-1.5">
                  <Phone className="w-4 h-4 text-navy-500" />
                  Số điện thoại <span className="text-danger-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setProfileErrors(prev => ({ ...prev, phone: '' })) }}
                  className={getInputClass('phone')}
                  placeholder="0912345678"
                  maxLength={11}
                />
                {profileErrors.phone && <p className="text-xs text-danger-500 mt-1 font-body">{profileErrors.phone}</p>}
              </div>

              {/* CCCD */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold font-sans text-navy-700 mb-1.5">
                  <CreditCard className="w-4 h-4 text-navy-500" />
                  Số CCCD <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={idCardNumber}
                  onChange={(e) => { setIdCardNumber(e.target.value); setProfileErrors(prev => ({ ...prev, idCardNumber: '' })) }}
                  className={getInputClass('idCardNumber')}
                  placeholder="079299001234"
                  maxLength={12}
                />
                {profileErrors.idCardNumber && <p className="text-xs text-danger-500 mt-1 font-body">{profileErrors.idCardNumber}</p>}
              </div>
            </div>

            {/* Nơi thường trú */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold font-sans text-navy-700 mb-1.5">
                <MapPin className="w-4 h-4 text-navy-500" />
                Nơi thường trú <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={hometown}
                onChange={(e) => { setHometown(e.target.value); setProfileErrors(prev => ({ ...prev, hometown: '' })) }}
                className={getInputClass('hometown')}
                placeholder="Tỉnh/Thành phố, Quận/Huyện..."
              />
              {profileErrors.hometown && <p className="text-xs text-danger-500 mt-1 font-body">{profileErrors.hometown}</p>}
            </div>

            {/* Nơi tạm trú */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold font-sans text-navy-700 mb-1.5">
                <MapPin className="w-4 h-4 text-navy-500" />
                Nơi tạm trú hiện tại <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setProfileErrors(prev => ({ ...prev, address: '' })) }}
                className={getInputClass('address')}
                placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành..."
              />
              {profileErrors.address && <p className="text-xs text-danger-500 mt-1 font-body">{profileErrors.address}</p>}
            </div>

            {/* Ngày sinh & Giới tính */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold font-sans text-navy-700 mb-1.5">
                  <Calendar className="w-4 h-4 text-navy-500" />
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={inputClasses}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-sm font-semibold font-sans text-navy-700 mb-1.5 block">
                  Giới tính <span className="text-danger-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => { setGender(e.target.value); setProfileErrors(prev => ({ ...prev, gender: '' })) }}
                  className={getInputClass('gender')}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                {profileErrors.gender && <p className="text-xs text-danger-500 mt-1 font-body">{profileErrors.gender}</p>}
                <p className="text-xs text-navy-400 mt-1 font-body">Dùng để chỉ hiển thị phòng nam hoặc phòng nữ phù hợp.</p>
              </div>
            </div>
          </div>

          {profileSaved && (
            <div className="flex items-start gap-2 bg-success-50 border border-success-200 text-success-700 p-3 rounded-xl text-sm mt-6">
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="font-body">Thông tin đã được lưu. Bạn có thể chỉnh sửa hoặc chuyển sang bước tiếp theo.</span>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Link href="/student">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
            </Link>
            <div className="flex gap-3">
              <Button onClick={handleSaveProfile} loading={savingProfile} variant={profileSaved ? 'outline' : 'primary'}>
                <Save className="w-4 h-4" />
                {profileSaved ? 'Cập nhật' : 'Lưu thông tin'}
              </Button>
              {profileSaved && (
                <Button onClick={() => setStep(2)}>
                  Tiếp theo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Room Selection */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          {/* Room Type Selection */}
          <Card padding>
            <div className="flex items-center gap-2 mb-2">
              <BedDouble className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold font-sans text-navy-700">Chọn loại phòng</h2>
            </div>
            <p className="text-sm text-navy-400 font-body mb-4">
              Chỉ hiển thị loại phòng phù hợp giới tính trong hồ sơ (nam/nữ riêng; &quot;Khác&quot; — loại hỗn hợp nếu BQL cấu hình).
            </p>
            {roomTypes.length === 0 && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 font-body">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Chưa có loại phòng phù hợp hoặc bạn chưa lưu giới tính ở bước 1. Vui lòng quay lại hoàn thiện hồ sơ.</span>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {roomTypes.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => setSelectedRoomType(rt.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                    selectedRoomType === rt.id
                      ? 'border-primary-500 bg-primary-50 shadow-focus-ring'
                      : 'border-surface-200 hover:border-surface-400'
                  }`}
                >
                  <p className="text-sm font-semibold font-sans text-navy-700">{rt.name}</p>
                  <p className="text-xs text-primary-600 font-medium font-body mt-0.5">
                    {ROOM_GENDER_LABELS[rt.genderRestriction] || rt.genderRestriction}
                  </p>
                  <p className="text-xs text-navy-400 font-body mt-1">{rt.capacity} người &middot; {formatVnd(rt.monthlyPrice)}/tháng</p>
                  {rt.amenities && rt.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rt.amenities.slice(0, 3).map((a: string) => (
                        <span key={a} className="px-2 py-0.5 bg-surface-100 rounded-md text-[10px] text-navy-500 font-body">{a}</span>
                      ))}
                      {rt.amenities.length > 3 && (
                        <span className="px-2 py-0.5 bg-surface-100 rounded-md text-[10px] text-navy-400 font-body">+{rt.amenities.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Room Browser - only show after room type selected */}
          {selectedRoomType && (
            <Card padding>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold font-sans text-navy-700">Chọn phòng</h2>
              </div>
              <p className="text-sm text-navy-400 font-body mb-4">Xem danh sách phòng còn trống và chọn phòng mong muốn.</p>

              {loadingRooms ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                  <span className="ml-2 text-sm text-navy-400 font-body">Đang tải danh sách phòng...</span>
                </div>
              ) : buildings.length === 0 ? (
                <div className="text-center py-12 bg-surface-50 rounded-xl border border-surface-200/60">
                  <Info className="w-8 h-8 text-navy-300 mx-auto mb-2" />
                  <p className="text-sm text-navy-400 font-body">Hiện không có phòng nào còn trống cho loại phòng này.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Building & Floor Filters */}
                  <div className="flex flex-wrap gap-3">
                    <div>
                      <label className="block text-xs font-semibold font-sans text-navy-500 mb-1">Tòa nhà</label>
                      <div className="flex gap-1.5">
                        {buildings.map((b) => (
                          <button
                            key={b}
                            onClick={() => setSelectedBuilding(b)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all duration-200 cursor-pointer ${
                              selectedBuilding === b
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'bg-surface-100 text-navy-600 hover:bg-surface-200'
                            }`}
                          >
                            Tòa {b}
                          </button>
                        ))}
                      </div>
                    </div>
                    {floors.length > 1 && (
                      <div>
                        <label className="block text-xs font-semibold font-sans text-navy-500 mb-1">Tầng</label>
                        <div className="flex gap-1.5">
                          {floors.map((f) => (
                            <button
                              key={f}
                              onClick={() => setSelectedFloor(f)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all duration-200 cursor-pointer ${
                                selectedFloor === f
                                  ? 'bg-primary-500 text-white shadow-sm'
                                  : 'bg-surface-100 text-navy-600 hover:bg-surface-200'
                              }`}
                            >
                              Tầng {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Room Cards Grid */}
                  {roomsOnFloor.length === 0 ? (
                    <div className="text-center py-8 bg-surface-50 rounded-xl border border-surface-200/60">
                      <p className="text-sm text-navy-400 font-body">Tầng này hiện không có phòng trống.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {roomsOnFloor.map((room) => {
                        const isSelected = selectedRoom?.id === room.id
                        const capacityPercent = ((room.currentOccupancy + room.lockedBeds) / room.roomType.capacity) * 100
                        return (
                          <button
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50 shadow-focus-ring'
                                : 'border-surface-200 hover:border-surface-400 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-base font-bold font-sans text-navy-700">{room.roomNumber}</p>
                                <p className="text-[11px] text-navy-400 font-body">Tòa {room.building} &middot; Tầng {room.floor}</p>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Occupancy indicator */}
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] text-navy-400 font-body">
                                  {room.currentOccupancy + room.lockedBeds}/{room.roomType.capacity} người
                                </span>
                                <span className={`text-[11px] font-semibold font-sans ${room.slotsLeft > 0 ? 'text-success-600' : 'text-danger-500'}`}>
                                  Còn {room.slotsLeft} chỗ
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    capacityPercent >= 80 ? 'bg-danger-400' : capacityPercent >= 50 ? 'bg-warning-400' : 'bg-success-400'
                                  }`}
                                  style={{ width: `${capacityPercent}%` }}
                                />
                              </div>
                            </div>

                            {room.roomType.amenities && room.roomType.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {room.roomType.amenities.slice(0, 2).map((a: string) => (
                                  <span key={a} className="px-1.5 py-0.5 bg-surface-100 rounded text-[9px] text-navy-400 font-body">{a}</span>
                                ))}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {selectedRoom && (
                    <div className="flex items-start gap-2 bg-primary-50 border border-primary-200 text-primary-700 p-3 rounded-xl text-sm">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                      <span className="font-body">
                        Bạn đã chọn phòng <strong>{selectedRoom.roomNumber}</strong> (Tòa {selectedRoom.building}, Tầng {selectedRoom.floor}).
                        Quản lý sẽ xét duyệt và có thể điều chỉnh phòng khi cần.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Move-in Date & Notes */}
          <Card padding>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">
                  Ngày muốn nhận phòng <span className="text-danger-500">*</span>
                </label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className={inputClasses}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">Ghi chú</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputClasses} resize-none`}
                  rows={3}
                  placeholder="Yêu cầu đặc biệt (nếu có)..."
                />
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <Button onClick={() => setStep(3)} disabled={!selectedRoomType || !moveInDate}>
              Tiếp theo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Minh chứng qua link Google Drive (công khai) */}
      {step === 3 && (
        <Card padding className="animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold font-sans text-navy-700">Minh chứng (link Google Drive)</h2>
          </div>
          <p className="text-sm text-navy-400 font-body mb-4">
            Hệ thống <strong>không lưu file</strong> trên máy chủ. Bạn tự đăng tài liệu lên <strong>Google Drive</strong>, bật chia sẻ <strong>“Bất kỳ ai có liên kết đều xem được”</strong>, rồi dán link vào ô bên dưới
          </p>

          <div className="flex items-start gap-2 bg-primary-50 border border-primary-200 text-primary-800 p-4 rounded-xl text-xs mb-5 space-y-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="font-semibold">Hướng dẫn nhanh Google Drive</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Tạo thư mục hoặc tải file (ảnh CCCD, thẻ SV, giấy hoàn cảnh…) lên Drive.</li>
                <li>Chuột phải → <strong>Chia sẻ</strong> → “Chung” / <strong>Bất kỳ ai có liên kết</strong> → Quyền <strong>Người xem</strong>.</li>
                <li>Sao chép <strong>liên kết</strong> (dạng <code className="bg-white/80 px-1 rounded">https://drive.google.com/...</code>).</li>
              </ol>
              <p className="text-primary-700">
                <ExternalLink className="w-3.5 h-3.5 inline mr-1" />
                Một link có thể là cả thư mục (nhiều file) hoặc một file — miễn là <strong>https</strong> và mở được khi đăng xuất Google.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">
                Link minh chứng bản thân <span className="text-danger-500">*</span>
              </label>
              <p className="text-xs text-navy-400 mb-2">CCCD/CMND, thẻ sinh viên (ảnh hoặc PDF trên Drive).</p>
              <input
                type="url"
                inputMode="url"
                placeholder="https://drive.google.com/file/d/... hoặc https://drive.google.com/drive/folders/..."
                value={identityDocLink}
                onChange={(e) => {
                  setIdentityDocLink(e.target.value)
                  setDocLinkErrors(prev => ({ ...prev, identity: undefined }))
                }}
                className={docLinkErrors.identity ? inputErrorClasses : inputClasses}
              />
              {docLinkErrors.identity && <p className="text-xs text-danger-500 mt-1">{docLinkErrors.identity}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">
                Link minh chứng hoàn cảnh <span className="text-navy-400 font-normal">(tùy chọn)</span>
              </label>
              <p className="text-xs text-navy-400 mb-2">Giấy xác nhận hoàn cảnh khó khăn, hộ nghèo… nếu có.</p>
              <input
                type="url"
                inputMode="url"
                placeholder="https://drive.google.com/..."
                value={familyDocLink}
                onChange={(e) => {
                  setFamilyDocLink(e.target.value)
                  setDocLinkErrors(prev => ({ ...prev, family: undefined }))
                }}
                className={docLinkErrors.family ? inputErrorClasses : inputClasses}
              />
              {docLinkErrors.family && <p className="text-xs text-danger-500 mt-1">{docLinkErrors.family}</p>}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <Button onClick={goToStep4FromDocs}>
              Tiếp theo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <Card padding className="animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <Check className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold font-sans text-navy-700">Xác nhận thông tin</h2>
          </div>
          <div className="space-y-4">
            {/* Student info summary */}
            <div>
              <h3 className="text-sm font-semibold font-sans text-navy-500 mb-2">Thông tin sinh viên</h3>
              <div className="bg-surface-50 rounded-xl border border-surface-200/60 divide-y divide-surface-200">
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-navy-400 font-body">Họ và tên</span>
                  <span className="text-sm font-semibold font-sans text-navy-700">{studentProfile?.fullName || studentProfile?.user?.fullName || '-'}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-navy-400 font-body">Mã SV</span>
                  <span className="text-sm font-semibold font-sans text-navy-700">{studentProfile?.studentCode}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-navy-400 font-body">Số điện thoại</span>
                  <span className="text-sm font-semibold font-sans text-navy-700">{phone || '-'}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-navy-400 font-body">Số CCCD</span>
                  <span className="text-sm font-semibold font-sans text-navy-700">{idCardNumber || '-'}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-navy-400 font-body">Thường trú</span>
                  <span className="text-sm font-semibold font-sans text-navy-700 max-w-[200px] text-right">{hometown || '-'}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-navy-400 font-body">Tạm trú</span>
                  <span className="text-sm font-semibold font-sans text-navy-700 max-w-[200px] text-right">{address || '-'}</span>
                </div>
              </div>
            </div>

            {/* Room info summary */}
            <div>
              <h3 className="text-sm font-semibold font-sans text-navy-500 mb-2">Thông tin phòng</h3>
              <div className="bg-surface-50 rounded-xl border border-surface-200/60 divide-y divide-surface-200">
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-navy-400 font-body">Loại phòng</span>
                  <span className="text-sm font-semibold font-sans text-navy-700">{roomTypes.find(r => r.id === selectedRoomType)?.name}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-navy-400 font-body">Giá phòng</span>
                  <span className="text-sm font-semibold font-sans text-navy-700">
                    {formatVnd(roomTypes.find(r => r.id === selectedRoomType)?.monthlyPrice || 0)}/tháng
                  </span>
                </div>
                {selectedRoom && (
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-sm text-navy-400 font-body">Phòng mong muốn</span>
                    <span className="text-sm font-semibold font-sans text-primary-600">
                      {selectedRoom.roomNumber} (Tòa {selectedRoom.building}, Tầng {selectedRoom.floor}) &middot; Còn {selectedRoom.slotsLeft} chỗ
                    </span>
                  </div>
                )}
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-navy-400 font-body">Ngày nhận phòng</span>
                  <span className="text-sm font-semibold font-sans text-navy-700">{moveInDate ? new Date(moveInDate).toLocaleDateString('vi-VN') : '-'}</span>
                </div>
                {notes && (
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-sm text-navy-400 font-body">Ghi chú</span>
                    <span className="text-sm font-semibold font-sans text-navy-700 max-w-[200px] truncate">{notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Minh chứng (link Drive) */}
            <div>
              <h3 className="text-sm font-semibold font-sans text-navy-500 mb-2">Minh chứng (Google Drive)</h3>
              <div className="bg-surface-50 rounded-xl border border-surface-200/60 divide-y divide-surface-200 text-sm">
                <div className="px-4 py-3">
                  <p className="text-xs text-navy-400 mb-1">Bản thân</p>
                  <a href={identityDocLink.trim()} target="_blank" rel="noopener noreferrer" className="text-primary-600 font-medium break-all hover:underline inline-flex items-center gap-1">
                    {identityDocLink.trim()} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
                {familyDocLink.trim() && (
                  <div className="px-4 py-3">
                    <p className="text-xs text-navy-400 mb-1">Hoàn cảnh</p>
                    <a href={familyDocLink.trim()} target="_blank" rel="noopener noreferrer" className="text-primary-600 font-medium break-all hover:underline inline-flex items-center gap-1">
                      {familyDocLink.trim()} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              Gửi đăng ký
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
