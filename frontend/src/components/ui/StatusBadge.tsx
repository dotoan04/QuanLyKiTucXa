import React from 'react'

type StatusType = string

interface StatusBadgeProps {
  status: StatusType
  label?: string
  size?: 'sm' | 'md'
  pulse?: boolean
  className?: string
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang hoạt động',
  expired: 'Hết hạn',
  terminated: 'Đã chấm dứt',
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  overdue: 'Quá hạn',
  partial: 'Thanh toán một phần',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
  available: 'Còn trống',
  occupied: 'Đã thuê',
  maintenance: 'Bảo trì',
  reserved: 'Đã đặt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
  deposit_pending: 'Chờ nộp cọc',
  deposit_paid: 'Đã nộp cọc',
  completed: 'Hoàn thành',
  processed: 'Đã xử lý',
  appealed: 'Đang khiếu nại',
  returned: 'Đã về',
  scheduled: 'Đã lên lịch',
  inspected: 'Đã kiểm tra',
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-success-50 text-success-700 border-success-200',
  paid: 'bg-success-50 text-success-700 border-success-200',
  resolved: 'bg-success-50 text-success-700 border-success-200',
  available: 'bg-success-50 text-success-700 border-success-200',
  approved: 'bg-success-50 text-success-700 border-success-200',
  completed: 'bg-success-50 text-success-700 border-success-200',
  returned: 'bg-success-50 text-success-700 border-success-200',
  processed: 'bg-success-50 text-success-700 border-success-200',
  pending: 'bg-warning-50 text-warning-700 border-warning-200',
  unpaid: 'bg-warning-50 text-warning-700 border-warning-200',
  scheduled: 'bg-warning-50 text-warning-700 border-warning-200',
  partial: 'bg-warning-50 text-warning-700 border-warning-200',
  deposit_pending: 'bg-warning-50 text-warning-700 border-warning-200',
  in_progress: 'bg-primary-50 text-primary-700 border-primary-200',
  reserved: 'bg-primary-50 text-primary-700 border-primary-200',
  appealed: 'bg-primary-50 text-primary-700 border-primary-200',
  inspected: 'bg-primary-50 text-primary-700 border-primary-200',
  deposit_paid: 'bg-primary-50 text-primary-700 border-primary-200',
  overdue: 'bg-danger-50 text-danger-700 border-danger-200',
  terminated: 'bg-danger-50 text-danger-700 border-danger-200',
  rejected: 'bg-danger-50 text-danger-700 border-danger-200',
  expired: 'bg-danger-50 text-danger-700 border-danger-200',
  closed: 'bg-surface-100 text-navy-400 border-surface-300',
  cancelled: 'bg-surface-100 text-navy-400 border-surface-300',
  maintenance: 'bg-warning-50 text-warning-700 border-warning-200',
  occupied: 'bg-primary-50 text-primary-700 border-primary-200',
}

export function StatusBadge({ status, label, size = 'sm', pulse = false, className = '' }: StatusBadgeProps) {
  const displayLabel = label || STATUS_LABELS[status] || status
  const styles = STATUS_STYLES[status] || 'bg-surface-100 text-navy-400 border-surface-300'

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  }

  const isActiveStatus = ['active', 'in_progress'].includes(status)

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${styles} ${sizeStyles[size]} ${className}`}>
      {(pulse || isActiveStatus) && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'active' ? 'bg-success-400' : 'bg-primary-400'}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'active' ? 'bg-success-500' : 'bg-primary-500'}`} />
        </span>
      )}
      {displayLabel}
    </span>
  )
}
