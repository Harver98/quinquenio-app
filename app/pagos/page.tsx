'use client'
import { useEffect, useState } from 'react'
import { getInscritos, actualizarEstadoPago, getComprobanteUrl } from '@/services/inscritos'
import type { Inscrito, EstadoPago } from '@/types'
import { formatCOP } from '@/types'
import { toast } from 'sonner'

const estadoClases: Record<EstadoPago, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  verificando: 'bg-blue-100 text-blue-800 border-blue-300',
  aprobado: 'bg-green-100 text-green-800 border-green-300',
  rechazado: 'bg-red-100 text-red-800 border-red-300',
}

export default function PagosPage() {
  const [inscritos, setInscritos] = useState<Inscrito[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<string>('todos')
  const [verComprobante, setVerComprobante] = useState<{ url: string; nombre: string } | null>(null)

  async function cargar() {
    try {
      const data = await getInscritos()
      setInscritos(data)
    } catch {
      toast.error('Error cargando pagos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  async function cambiarEstado(id: string, estado: EstadoPago) {
    try {
      await actualizarEstadoPago(id, estado)
      setInscritos(prev => prev.map(i => i.id === id ? { ...i, estado_pago: estado } : i))
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  async function verImagenComprobante(inscrito: Inscrito) {
    if (!inscrito.comprobante_url) { toast.error('No hay comprobante'); return }
    try {
      const url = await getComprobanteUrl(inscrito.comprobante_url)
      setVerComprobante({ url, nombre: inscrito.nombre })
    } catch {
      toast.error('Error al cargar imagen')
    }
  }

  const filtrados = filtro === 'todos' ? inscritos : inscritos.filter(i => i.estado_pago === filtro)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de pagos</h1>
        <p className="text-gray-500 mt-1">Aprueba o rechaza comprobantes</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pendientes', estado: 'pendiente', color: 'text-yellow-700 bg-yellow-50' },
          { label: 'Verificando', estado: 'verificando', color: 'text-blue-700 bg-blue-50' },
          { label: 'Aprobados', estado: 'aprobado', color: 'text-green-700 bg-green-50' },
          { label: 'Rechazados', estado: 'rechazado', color: 'text-red-700 bg-red-50' },
        ].map(item => (
          <button
            key={item.estado}
            onClick={() => setFiltro(filtro === item.estado ? 'todos' : item.estado)}
            className={`${item.color} rounded-xl p-4 text-left transition-all ${filtro === item.estado ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
          >
            <p className="text-2xl font-bold">
              {inscritos.filter(i => i.estado_pago === item.estado).length}
            </p>
            <p className="text-sm font-medium">{item.label}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center h-48 items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filtrados.map(inscrito => (
            <div key={inscrito.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{inscrito.nombre}</p>
                  <p className="text-gray-500 text-sm">CC: {inscrito.cedula} · {inscrito.correo}</p>
                  <p className="text-gray-500 text-sm">
                    {inscrito.tipo_egresado === 'socio' ? 'Socio ASEDUIS' : 'No socio'} ·
                    {inscrito.acompanantes > 0 ? ` ${inscrito.acompanantes} acomp. ·` : ''} 
                    {inscrito.cantidad_botones > 0 ? ` + ${inscrito.cantidad_botones} botones extra ·` : ''}
                    <span className="font-semibold text-gray-900"> {formatCOP(inscrito.total)}</span>
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Registrado: {new Date(inscrito.created_at).toLocaleString('es-CO')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${estadoClases[inscrito.estado_pago]}`}>
                    {inscrito.estado_pago}
                  </span>
                  {inscrito.comprobante_url && (
                    <button
                      onClick={() => verImagenComprobante(inscrito)}
                      className="text-blue-600 text-sm font-medium hover:text-blue-800"
                    >
                      Ver comprobante
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4 border-t pt-4">
                {(['pendiente', 'verificando', 'aprobado', 'rechazado'] as EstadoPago[]).map(estado => (
                  <button
                    key={estado}
                    onClick={() => cambiarEstado(inscrito.id, estado)}
                    disabled={inscrito.estado_pago === estado}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${
                      inscrito.estado_pago === estado
                        ? 'bg-gray-100 border-gray-300 text-gray-600'
                        : estado === 'aprobado'
                        ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                        : estado === 'rechazado'
                        ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {estado}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {filtrados.length === 0 && (
            <div className="text-center py-12 text-gray-400">No hay pagos en este estado</div>
          )}
        </div>
      )}

      {/* Modal comprobante */}
      {verComprobante && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setVerComprobante(null)}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-semibold text-gray-900">{verComprobante.nombre}</p>
              <button onClick={() => setVerComprobante(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <img src={verComprobante.url} alt="Comprobante" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}
