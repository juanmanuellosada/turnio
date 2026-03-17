import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-[#1e1b4b] mb-4">Dashboard</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-600">
          Bienvenido, <span className="font-semibold">{session.user.name}</span>
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Rol: {session.user.role} | Email: {session.user.email}
        </p>
      </div>
    </div>
  )
}
