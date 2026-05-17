export function formatVnd(value: unknown, withUnit = true): string {
  const numericValue = typeof value === 'string' ? Number(value) : Number(value ?? 0)
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0
  const formatted = safeValue.toLocaleString('vi-VN')
  return withUnit ? `${formatted}đ` : formatted
}
