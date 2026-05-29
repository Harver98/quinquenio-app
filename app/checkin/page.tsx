'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { BusquedaCedula } from '@/components/forms/BusquedaCedula'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
 
const Html5QrcodeScanner = dynamic(() => import('@/components/forms/QrScanner'), {
  ssr: false,
})
 
export default function CheckinPage() {
  const [tab, setTab] = useState<'scanner' | 'manual'>('scanner')
  const router = useRouter()
 
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
  }
 
  return (
    <div className="min-h-screen bg-blue-900 p-4">
      <div className="max-w-md mx-auto">
 
        {/* Header con botón cerrar sesión */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="text-center flex-1">
            <h1 className="text-white text-2xl font-bold">Check-in</h1>
            <p className="text-blue-200 text-sm mt-1">Quinquenio UIS 2025</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-blue-200 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-1"
          >
            🚪 Salir
          </button>
        </div>
 
        {/* Tabs */}
        <div className="flex bg-blue-800 rounded-xl p-1 mb-4">
          <button
            onClick={() => setTab('scanner')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'scanner' ? 'bg-white text-blue-900' : 'text-blue-200 hover:text-white'
            }`}
          >
            📷 Escáner QR
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'manual' ? 'bg-white text-blue-900' : 'text-blue-200 hover:text-white'
            }`}
          >
            🔍 Búsqueda manual
          </button>
        </div>
 
        {tab === 'scanner' ? <Html5QrcodeScanner /> : <BusquedaCedula />}
 
      </div>
    </div>
  )
}