'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getInscritos } from '@/services/inscritos'
import type { Inscrito } from '@/types'
import { toast } from 'sonner'

export default function QRListPage() {
  const [inscritos, setInscritos] = useState<Inscrito[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInscritos()
      .then(data => setInscritos(data.filter(i => i.estado_pago === 'aprobado')))
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Códigos QR</h1>
        <p className="text-gray-500 mt-1">Solo aparecen inscritos con pago aprobado</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inscritos.map(i => (
            <Link
              key={i.id}
              href={`/qr/${i.id}`}
              className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-transparent hover:border-blue-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                  {i.nombre.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{i.nombre}</p>
                  <p className="text-gray-500 text-xs">{i.cedula}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  ✅ Aprobado
                </span>
                <span className="text-purple-600 text-xs font-medium">Ver QR →</span>
              </div>
              {i.ingreso && (
                <p className="text-xs text-blue-600 mt-2">Ya ingresó al evento</p>
              )}
            </Link>
          ))}
          {inscritos.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              No hay inscritos con pago aprobado aún
            </div>
          )}
        </div>
      )}
    </div>
  )
}
