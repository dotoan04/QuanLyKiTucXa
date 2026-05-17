'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CheckCircle, Settings, Building2, Bell, Shield } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

export default function AdminSettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'notifications' | 'security'>('profile')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [systemLoading, setSystemLoading] = useState(true)

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  const [systemForm, setSystemForm] = useState({
    dormName: '',
    address: '',
    hotline: '',
    email: '',
    electricityPrice: '',
    waterPrice: '',
    lateFee: ''
  })

  const NOTIFICATION_KEYS = [
    'notif_invoice_due',
    'notif_new_incident',
    'notif_contract_expiry',
    'notif_payment_received',
    'notif_new_registration',
  ] as const

  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (activeTab === 'system') {
      loadSystemConfig()
    }
    if (activeTab === 'notifications') {
      loadNotifSettings()
    }
  }, [activeTab])

  const loadSystemConfig = async () => {
    setSystemLoading(true)
    try {
      const res = await api.get('/system-config')
      const config = res.data.data || {}
      setSystemForm({
        dormName: config.dormName || 'Ký túc xá Đại học',
        address: config.dormAddress || '',
        hotline: config.hotline || '',
        email: config.contactEmail || '',
        electricityPrice: config.electricityPrice || '3500',
        waterPrice: config.waterPrice || '15000',
        lateFee: config.lateFee || '50000'
      })
    } catch (error) {
      console.error('Failed to load system config:', error)
    } finally {
      setSystemLoading(false)
    }
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleSaveSystem = async () => {
    try {
      setLoading(true)
      await api.post('/system-config/batch', [
        { key: 'dormName', value: systemForm.dormName, description: 'Tên ký túc xá' },
        { key: 'dormAddress', value: systemForm.address, description: 'Địa chỉ ký túc xá' },
        { key: 'hotline', value: systemForm.hotline, description: 'Số hotline' },
        { key: 'contactEmail', value: systemForm.email, description: 'Email liên hệ' },
        { key: 'electricityPrice', value: systemForm.electricityPrice, description: 'Giá điện mặc định' },
        { key: 'waterPrice', value: systemForm.waterPrice, description: 'Giá nước mặc định' },
        { key: 'lateFee', value: systemForm.lateFee, description: 'Phí trả trễ mặc định' }
      ])
      showSuccess('Đã lưu cài đặt hệ thống!')
    } catch (error) {
      console.error('Failed to save system config:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNotifSettings = async () => {
    try {
      const res = await api.get('/system-config')
      const config = res.data.data || {}
      const loaded: Record<string, boolean> = {}
      NOTIFICATION_KEYS.forEach(key => {
        const val = config[key]
        loaded[key] = val === undefined ? true : val === 'true' || val === true
      })
      setNotifSettings(loaded)
    } catch {
      const defaults: Record<string, boolean> = {}
      NOTIFICATION_KEYS.forEach(key => { defaults[key] = true })
      setNotifSettings(defaults)
    }
  }

  const handleSaveNotif = async () => {
    try {
      setLoading(true)
      const batch = NOTIFICATION_KEYS.map(key => ({
        key,
        value: String(notifSettings[key]),
        description: `Notification setting: ${key}`
      }))
      await api.post('/system-config/batch', batch)
      showSuccess('Đã lưu cài đặt thông báo!')
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      await api.put('/auth/me', {
        fullName: profileForm.fullName,
        phone: profileForm.phone
      })
      showSuccess('Đã cập nhật thông tin cá nhân!')
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {}
    if (!passwordForm.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    if (!passwordForm.newPassword) errors.newPassword = 'Vui lòng nhập mật khẩu mới'
    if (passwordForm.newPassword.length < 6) errors.newPassword = 'Mật khẩu tối thiểu 6 ký tự'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    setPasswordErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setLoading(true)
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showSuccess('Đã đổi mật khẩu thành công!')
    } catch (error: any) {
      setPasswordErrors({ currentPassword: 'Mật khẩu hiện tại không đúng' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: Settings },
    { id: 'system', label: 'Cài đặt hệ thống', icon: Building2 },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'security', label: 'Bảo mật', icon: Shield },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600 mt-1">Quản lý tài khoản và cấu hình hệ thống</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          {/* Profile tab */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cá nhân</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <Input
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    value={profileForm.email}
                    disabled
                    className="bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                  <Input value={user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'staff' ? 'Nhân viên' : 'Sinh viên'} disabled className="bg-gray-50 text-gray-500" />
                </div>
                <div className="pt-2">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* System settings tab */}
          {activeTab === 'system' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Cài đặt hệ thống</h2>
              <div className="space-y-6 max-w-lg">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Thông tin ký túc xá</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên ký túc xá</label>
                      <Input
                        value={systemForm.dormName}
                        onChange={(e) => setSystemForm({ ...systemForm, dormName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <Input
                        value={systemForm.address}
                        onChange={(e) => setSystemForm({ ...systemForm, address: e.target.value })}
                        placeholder="Nhập địa chỉ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hotline</label>
                      <Input
                        value={systemForm.hotline}
                        onChange={(e) => setSystemForm({ ...systemForm, hotline: e.target.value })}
                        placeholder="Nhập số hotline"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email liên hệ</label>
                      <Input
                        value={systemForm.email}
                        onChange={(e) => setSystemForm({ ...systemForm, email: e.target.value })}
                        placeholder="Nhập email liên hệ"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Giá dịch vụ mặc định</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá điện (đ/kWh)</label>
                      <Input
                        type="number"
                        value={systemForm.electricityPrice}
                        onChange={(e) => setSystemForm({ ...systemForm, electricityPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá nước (đ/m³)</label>
                      <Input
                        type="number"
                        value={systemForm.waterPrice}
                        onChange={(e) => setSystemForm({ ...systemForm, waterPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phí trả trễ (đ/tháng)</label>
                      <Input
                        type="number"
                        value={systemForm.lateFee}
                        onChange={(e) => setSystemForm({ ...systemForm, lateFee: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={handleSaveSystem} disabled={loading || systemLoading}>
                    {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Notifications tab */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Cài đặt thông báo</h2>
              <div className="space-y-4 max-w-lg">
                {[
                  { id: 'notif_invoice_due', label: 'Nhắc hóa đơn sắp đến hạn', desc: 'Gửi thông báo trước 3 ngày khi hóa đơn đến hạn' },
                  { id: 'notif_new_incident', label: 'Sự cố mới được báo cáo', desc: 'Thông báo khi có sinh viên báo sự cố mới' },
                  { id: 'notif_contract_expiry', label: 'Hợp đồng sắp hết hạn', desc: 'Thông báo trước 30 ngày khi hợp đồng hết hạn' },
                  { id: 'notif_payment_received', label: 'Thanh toán thành công', desc: 'Thông báo khi sinh viên thanh toán hóa đơn' },
                  { id: 'notif_new_registration', label: 'Đăng ký phòng mới', desc: 'Thông báo khi có sinh viên đăng ký phòng mới' },
                ].map((item) => (
                  <div key={item.id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={notifSettings[item.id] ?? true}
                        onChange={(e) => setNotifSettings({ ...notifSettings, [item.id]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
                <div className="pt-2">
                  <Button onClick={handleSaveNotif} disabled={loading}>
                    {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Security tab */}
          {activeTab === 'security' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Bảo mật tài khoản</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Nhập mật khẩu hiện tại"
                    className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    className={passwordErrors.newPassword ? 'border-red-500' : ''}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                    className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
                <div className="pt-2">
                  <Button onClick={handleChangePassword} disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Phiên đăng nhập</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phiên hiện tại</p>
                        <p className="text-xs text-gray-500 mt-0.5">Đăng nhập với tài khoản {user?.email}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Đang hoạt động</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
