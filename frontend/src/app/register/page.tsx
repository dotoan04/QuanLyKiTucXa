'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import {
  Mail, Lock, Eye, EyeOff, User, Phone, GraduationCap,
  BookOpen, Building2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react'
import api from '@/lib/api'
import { AxiosError } from 'axios'

// ─── Validators ────────────────────────────────────────────────────────────────
const validators = {
  fullName(v: string) {
    if (!v.trim()) return 'Họ và tên không được để trống'
    if (v.trim().length < 3) return 'Họ và tên phải có ít nhất 3 ký tự'
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(v.trim())) return 'Họ và tên chỉ được chứa chữ cái'
    return ''
  },
  phone(v: string) {
    if (!v.trim()) return ''   // optional
    if (!/^(0|\+84)[0-9]{9}$/.test(v.trim())) return 'Số điện thoại không hợp lệ (VD: 0912345678)'
    return ''
  },
  studentCode(v: string) {
    if (!v.trim()) return 'Mã sinh viên không được để trống'
    if (v.trim().length < 4) return 'Mã sinh viên không hợp lệ'
    return ''
  },
  faculty(v: string) {
    if (!v.trim()) return ''   // optional
    return ''
  },
  academicYear(v: string) {
    if (!v) return ''   // optional
    const n = parseInt(v)
    if (isNaN(n) || n < 1 || n > 6) return 'Năm học phải từ 1 đến 6'
    return ''
  },
  email(v: string) {
    if (!v.trim()) return 'Email không được để trống'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email không hợp lệ'
    return ''
  },
  password(v: string) {
    if (!v) return 'Mật khẩu không được để trống'
    if (v.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự'
    if (!/[A-Z]/.test(v)) return 'Mật khẩu phải có ít nhất 1 chữ hoa'
    if (!/[0-9]/.test(v)) return 'Mật khẩu phải có ít nhất 1 chữ số'
    return ''
  },
  confirmPassword(v: string, pw: string) {
    if (!v) return 'Vui lòng xác nhận mật khẩu'
    if (v !== pw) return 'Mật khẩu xác nhận không khớp'
    return ''
  },
}

// Password strength indicator
function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { level: score, label: 'Yếu', color: 'bg-red-400' }
  if (score <= 3) return { level: score, label: 'Trung bình', color: 'bg-yellow-400' }
  return { level: score, label: 'Mạnh', color: 'bg-green-500' }
}

type FieldName = 'fullName' | 'phone' | 'studentCode' | 'faculty' | 'academicYear' | 'email' | 'password' | 'confirmPassword'

const STEP1_FIELDS: FieldName[] = ['fullName', 'phone', 'studentCode', 'faculty', 'academicYear']
const STEP2_FIELDS: FieldName[] = ['email', 'password', 'confirmPassword']

export default function RegisterPage() {
  const { setUser, setTokens } = useAuthStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const [form, setForm] = useState({
    fullName: '', phone: '', studentCode: '', faculty: '', academicYear: '',
    email: '', password: '', confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<FieldName, string>>({
    fullName: '', phone: '', studentCode: '', faculty: '', academicYear: '',
    email: '', password: '', confirmPassword: ''
  })
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    fullName: false, phone: false, studentCode: false, faculty: false, academicYear: false,
    email: false, password: false, confirmPassword: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const validate = (field: FieldName, value: string): string => {
    if (field === 'confirmPassword') return validators.confirmPassword(value, form.password)
    return (validators[field] as (v: string) => string)(value)
  }

  const handleChange = (field: FieldName, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validate(field, value) }))
    }
    // Re-validate confirmPassword when password changes
    if (field === 'password' && touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validators.confirmPassword(form.confirmPassword, value) }))
    }
    setServerError('')
  }

  const handleBlur = (field: FieldName) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setErrors(prev => ({ ...prev, [field]: validate(field, form[field]) }))
  }

  const validateStep = (fields: FieldName[]) => {
    const newErrors = { ...errors }
    const newTouched = { ...touched }
    let hasError = false
    for (const f of fields) {
      newTouched[f] = true
      const err = validate(f, form[f])
      newErrors[f] = err
      if (err) hasError = true
    }
    setErrors(newErrors)
    setTouched(newTouched)
    return !hasError
  }

  const handleNextStep = () => {
    if (validateStep(STEP1_FIELDS)) setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(STEP2_FIELDS)) return

    setLoading(true)
    setServerError('')

    try {
      const response = await api.post('/auth/register', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        studentCode: form.studentCode.trim(),
        faculty: form.faculty.trim() || undefined,
        academicYear: form.academicYear ? parseInt(form.academicYear) : undefined,
      })
      const { user, accessToken, refreshToken } = response.data.data
      setUser(user)
      setTokens(accessToken, refreshToken)
      window.location.href = '/student'
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = err.response?.data?.error?.message || err.response?.data?.message
        setServerError(msg || 'Đăng ký thất bại. Vui lòng thử lại.')
        // If it's an email/studentCode conflict, go back to step 1
        if (msg?.toLowerCase().includes('student') || msg?.toLowerCase().includes('mã')) setStep(1)
      } else {
        setServerError('Đăng ký thất bại. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(form.password)

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-primary-600 to-primary-900 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">Ký Túc Xá</p>
            <p className="text-primary-200 text-sm">Hệ thống quản lý</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Tạo tài khoản mới
          </h1>
          <p className="text-primary-200 text-lg mb-8">
            Đăng ký để truy cập đầy đủ dịch vụ ký túc xá.
          </p>

          {/* Steps */}
          <div className="space-y-4">
            {[
              { n: 1, title: 'Thông tin sinh viên', desc: 'Họ tên, mã SV, khoa' },
              { n: 2, title: 'Tài khoản đăng nhập', desc: 'Email và mật khẩu' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                  step > n ? 'bg-green-400 text-white' :
                  step === n ? 'bg-white text-primary-700' :
                  'bg-white/20 text-white/60'
                }`}>
                  {step > n ? <CheckCircle2 className="w-5 h-5" /> : n}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${step === n ? 'text-white' : 'text-primary-200'}`}>{title}</p>
                  <p className="text-primary-300 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-300 text-sm">© 2024 Ký Túc Xá</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-6 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <p className="font-bold text-gray-900">Ký Túc Xá</p>
          </div>

          {/* Progress bar (mobile) */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Bước {step} / 2</span>
              <span>{step === 1 ? 'Thông tin sinh viên' : 'Tài khoản đăng nhập'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Thông tin sinh viên' : 'Tài khoản đăng nhập'}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              {step === 1
                ? 'Nhập thông tin cá nhân và mã sinh viên'
                : 'Tạo email và mật khẩu cho tài khoản'}
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep() } : handleSubmit} noValidate>
            {step === 1 ? (
              <div className="space-y-4">
                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={form.fullName}
                      onChange={e => handleChange('fullName', e.target.value)}
                      onBlur={() => handleBlur('fullName')}
                      className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                        errors.fullName && touched.fullName
                          ? 'border-red-400 focus:ring-red-300 bg-red-50'
                          : 'border-gray-300 focus:ring-primary-300 focus:border-primary-400 bg-white'
                      }`}
                    />
                  </div>
                  {errors.fullName && touched.fullName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      placeholder="0912345678"
                      value={form.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                        errors.phone && touched.phone
                          ? 'border-red-400 focus:ring-red-300 bg-red-50'
                          : 'border-gray-300 focus:ring-primary-300 focus:border-primary-400 bg-white'
                      }`}
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.phone}
                    </p>
                  )}
                </div>

                {/* Student code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mã sinh viên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="SV123456"
                      value={form.studentCode}
                      onChange={e => handleChange('studentCode', e.target.value.toUpperCase())}
                      onBlur={() => handleBlur('studentCode')}
                      className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                        errors.studentCode && touched.studentCode
                          ? 'border-red-400 focus:ring-red-300 bg-red-50'
                          : 'border-gray-300 focus:ring-primary-300 focus:border-primary-400 bg-white'
                      }`}
                    />
                  </div>
                  {errors.studentCode && touched.studentCode && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.studentCode}
                    </p>
                  )}
                </div>

                {/* Faculty + Academic year */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Khoa / Ngành
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="CNTT"
                        value={form.faculty}
                        onChange={e => handleChange('faculty', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 focus:ring-primary-300 focus:border-primary-400 bg-white transition-colors focus:outline-none focus:ring-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Năm học
                    </label>
                    <select
                      value={form.academicYear}
                      onChange={e => handleChange('academicYear', e.target.value)}
                      onBlur={() => handleBlur('academicYear')}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:ring-primary-300 focus:border-primary-400 bg-white transition-colors focus:outline-none focus:ring-2"
                    >
                      <option value="">-- Chọn --</option>
                      {[1,2,3,4,5,6].map(y => (
                        <option key={y} value={y}>Năm {y}</option>
                      ))}
                    </select>
                    {errors.academicYear && touched.academicYear && (
                      <p className="mt-1 text-xs text-red-600">{errors.academicYear}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Tiếp theo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                        errors.email && touched.email
                          ? 'border-red-400 focus:ring-red-300 bg-red-50'
                          : 'border-gray-300 focus:ring-primary-300 focus:border-primary-400 bg-white'
                      }`}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Ít nhất 8 ký tự, 1 chữ hoa, 1 số"
                      value={form.password}
                      onChange={e => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                        errors.password && touched.password
                          ? 'border-red-400 focus:ring-red-300 bg-red-50'
                          : 'border-gray-300 focus:ring-primary-300 focus:border-primary-400 bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${
                        passwordStrength.level <= 2 ? 'text-red-500' :
                        passwordStrength.level <= 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        Độ mạnh: {passwordStrength.label}
                      </p>
                    </div>
                  )}
                  {errors.password && touched.password && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu"
                      value={form.confirmPassword}
                      onChange={e => handleChange('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                        errors.confirmPassword && touched.confirmPassword
                          ? 'border-red-400 focus:ring-red-300 bg-red-50'
                          : form.confirmPassword && !errors.confirmPassword
                            ? 'border-green-400 focus:ring-green-300 bg-green-50'
                            : 'border-gray-300 focus:ring-primary-300 focus:border-primary-400 bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.confirmPassword}
                    </p>
                  )}
                  {form.confirmPassword && !errors.confirmPassword && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />Mật khẩu khớp
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Đang đăng ký...
                      </>
                    ) : (
                      'Hoàn tất đăng ký'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
