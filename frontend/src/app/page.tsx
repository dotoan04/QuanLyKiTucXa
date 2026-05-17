import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function RootPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  const authStorage = cookieStore.get('auth-storage')?.value

  if (accessToken && authStorage) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authStorage))
      const role = parsed?.state?.user?.role
      if (role) {
        const target =
          role === 'director'
            ? '/director'
            : role === 'accountant' || role === 'technician'
              ? '/staff'
              : `/${role}`
        redirect(target)
      }
    } catch {
      // invalid cookie — fall through to login
    }
  }

  redirect('/login')
}
