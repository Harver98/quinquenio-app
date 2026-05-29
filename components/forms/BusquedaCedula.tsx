'use client'
import { useState } from 'react'
import { getInscritoPorCedula } from '@/services/inscritos'
import type { Inscrito } from '@/types'
import { formatCOP } from '@/types'
import { BadgeEstado } from '@/components/ui/BadgeEstado'
import { toast } from 'sonner'
import Link from 'next/link'

export function BusquedaCedula() {
  const [cedula, setCedula] = useState('')
  const [resultado, setResultado] = useState<Inscrito | null | 'no_encontrado'>(null)
  const [buscando, setBuscando] = useState(false)

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    if (!cedula.trim()) return
    setBuscando(true)
    try {
      const data = await getInscritoPorCedula(cedula.trim())
      setResultado(data ?? 'no_encontrado')
    } catch {
      toast.error('Error al buscar')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
      <h2 className="font-semibold text-gray-900 mb-3">🔍 Búsqueda manual por cédula</h2>
      <form onSubmit={buscar} className="flex gap-2">
        <input
          type="text"
          value={cedula}
          onChange={e => setCedula(e.target.value)}
          placeholder="Número de cédula..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={buscando}
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {buscando ? '...' : 'Buscar'}
        </button>
      </form>

      {resultado === 'no_encontrado' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-700 font-semibold">❌ No se encontró ningún inscrito con esa cédula</p>
        </div>
      )}

      {resultado && resultado !== 'no_encontrado' && (
        <div className="mt-4 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900 text-lg">{resultado.nombre}</p>
              <p className="text-gray-500 text-sm">CC: {resultado.cedula}</p>
              <p className="text-gray-500 text-sm">{resultado.programa1} · {resultado.anio_grado1}</p>
              <p className="text-gray-500 text-sm">{resultado.correo}</p>
            </div>
            <BadgeEstado estado={resultado.estado_pago} />
          </div>

          <div className="flex gap-4 text-sm border-t pt-3">
            <span className="text-gray-600">
              Acompañantes: <strong>{resultado.acompanantes}</strong>
            </span>
            <span className="text-gray-600">
              Total: <strong>{formatCOP(resultado.total)}</strong>
            </span>
            {resultado.cantidad_botones > 0 && (
              <span className="text-gray-600">+ Botón extra</span>
            )}
          </div>

          {resultado.ingreso ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700 font-medium">
              🎓 Ya ingresó — {resultado.fecha_ingreso ? new Date(resultado.fecha_ingreso).toLocaleString('es-CO') : ''}
            </div>
          ) : resultado.estado_pago === 'aprobado' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 font-medium">
              ✅ Pago aprobado — puede ingresar
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-700 font-medium">
              ⚠️ Pago {resultado.estado_pago} — no puede ingresar
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Link
              href={`/inscritos/${resultado.id}`}
              className="text-blue-600 text-sm font-medium hover:text-blue-800"
            >
              Ver detalle →
            </Link>
            {resultado.estado_pago === 'aprobado' && (
              <Link
                href={`/qr/${resultado.id}`}
                className="text-purple-600 text-sm font-medium hover:text-purple-800 ml-3"
              >
                Ver QR →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
