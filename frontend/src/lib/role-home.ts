export function getRoleHome(role?: string): string {
  if (!role) return '/login'
  if (role === 'director') return '/director'
  if (role === 'accountant' || role === 'technician' || role === 'staff') return '/staff'
  if (role === 'admin') return '/admin'
  if (role === 'student') return '/student'
  return `/${role}`
}
