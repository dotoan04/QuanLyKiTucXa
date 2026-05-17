'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { Mail, Lock, Eye, EyeOff, Building2, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { AxiosError } from 'axios'
import { getRoleHome } from '@/lib/role-home'

function validateEmail(email: string): string {
  if (!email.trim()) return 'Email không được để trống'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ'
  return ''
}
function validatePassword(pw: string): string {
  if (!pw) return 'Mật khẩu không được để trống'
  if (pw.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự'
  return ''
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setTokens, isAuthenticated, user, logout } = useAuthStore()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const hasTokenCookie = document.cookie.split(';').some(c => c.trim().startsWith('accessToken='))
      if (hasTokenCookie) {
        const redirectTo = searchParams.get('redirect') || getRoleHome(user.role)
        window.location.href = redirectTo
      } else {
        logout()
      }
    }
  }, [isAuthenticated, user])

  const validate = (field: 'email' | 'password', value: string) => {
    if (field === 'email') return validateEmail(value)
    if (field === 'password') return validatePassword(value)
    return ''
  }

  const handleChange = (field: 'email' | 'password', value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validate(field, value) }))
    }
    setServerError('')
  }

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setErrors(prev => ({ ...prev, [field]: validate(field, form[field]) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailErr = validateEmail(form.email)
    const passwordErr = validatePassword(form.password)
    setErrors({ email: emailErr, password: passwordErr })
    setTouched({ email: true, password: true })

    if (emailErr || passwordErr) return

    setLoading(true)
    setServerError('')

    try {
      const response = await api.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password
      })
      const { user, accessToken, refreshToken } = response.data.data

      setUser(user)
      setTokens(accessToken, refreshToken)

      const redirectTo = searchParams.get('redirect') ||
        (user.role === 'admin'
          ? '/admin'
          : user.role === 'director'
            ? '/director'
            : user.role === 'staff' || user.role === 'accountant' || user.role === 'technician'
              ? '/staff'
              : '/student')
      window.location.href = redirectTo
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = err.response?.data?.error?.message || err.response?.data?.message
        setServerError(msg || 'Email hoặc mật khẩu không đúng')
      } else {
        setServerError('Đăng nhập thất bại. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = (field: 'email' | 'password') =>
    `w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-all duration-200 font-body text-navy-700 placeholder-navy-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-surface-400 ${
      errors[field] && touched[field]
        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100 bg-danger-50/30'
        : 'border-surface-300 bg-white'
    }`

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-navy-500 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-navy-500/50 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight font-sans text-white">Ký Túc Xá</p>
            <p className="text-navy-200 text-sm">Hệ thống quản lý</p>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight mb-4 font-sans text-white">
            Chào mừng trở lại
          </h1>
          <p className="text-navy-200 text-lg font-body">
            Đăng nhập để quản lý phòng ở, hóa đơn và các dịch vụ ký túc xá.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { role: 'Sinh viên', desc: 'Xem phòng, hóa đơn, báo sự cố, chat AI' },
              { role: 'Nhân viên', desc: 'Quản lý phòng, xử lý sự cố, xác nhận thanh toán' },
              { role: 'Quản trị', desc: 'Toàn quyền quản lý hệ thống' },
            ].map(({ role, desc }) => (
              <div key={role} className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                <div>
                  <p className="font-semibold text-sm font-sans text-white">{role}</p>
                  <p className="text-navy-200 text-sm font-body">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-navy-200/60 text-sm font-body">
          &copy; 2024 Ký Túc Xá — Hệ thống quản lý sinh viên
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-surface py-12 px-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-navy-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-navy-700 font-sans">Ký Túc Xá</p>
              <p className="text-navy-400 text-sm font-body">Hệ thống quản lý</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-navy-700 font-sans">Đăng nhập</h2>
            <p className="text-navy-400 mt-1.5 text-sm font-body">
              Nhập thông tin tài khoản để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {serverError && (
              <div className="flex items-start gap-3 bg-danger-50 border border-danger-200 text-danger-700 p-3.5 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="font-body">{serverError}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold font-sans text-navy-700 mb-1.5">
                Email <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-300">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={inputClasses('email')}
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold font-sans text-navy-700">
                  Mật khẩu <span className="text-danger-500">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold font-sans"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-300">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`${inputClasses('password')} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-navy-300 hover:text-navy-500 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-navy-600 hover:bg-navy-700 disabled:bg-navy-400 text-white font-semibold font-sans rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-6 font-body">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold font-sans">
              Đăng ký sinh viên
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-navy-600 border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
