'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getInscrito, getComprobanteUrl, actualizarEstadoPago, eliminarInscrito } from '@/services/inscritos'
import type { Inscrito, EstadoPago } from '@/types'
import { formatCOP } from '@/types'
import { BotonEnviarQR } from '@/components/ui/BotonEnviarQR'
import { toast } from 'sonner'
import Link from 'next/link'

export default function InscritoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [inscrito, setInscrito] = useState<Inscrito | null>(null)
  const [urlComprobante, setUrlComprobante] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    async function cargar() {
      const data = await getInscrito(id)
      setInscrito(data)
      if (data?.comprobante_url) {
        const url = await getComprobanteUrl(data.comprobante_url)
        setUrlComprobante(url)
      }
      setLoading(false)
    }
    cargar()
  }, [id])

  async function cambiarEstado(estado: EstadoPago) {
    try {
      await actualizarEstadoPago(id, estado)
      setInscrito(prev => prev ? { ...prev, estado_pago: estado } : null)
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este inscrito? Esta acción no se puede deshacer.')) return
    setEliminando(true)
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { error } = await supabase.from('inscritos').delete().eq('id', id)
      if (error) throw error
      toast.success('Inscrito eliminado')
      router.push('/inscritos')
      router.refresh()
    } catch (e: any) {
      toast.error('Error al eliminar: ' + (e?.message || 'intenta de nuevo'))
    } finally {
      setEliminando(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  if (!inscrito) return (
    <div className="p-8 text-center text-gray-500">Inscrito no encontrado</div>
  )

  const estadoBadge: Record<EstadoPago, string> = {
    pendiente:   'bg-yellow-100 text-yellow-800',
    verificando: 'bg-blue-100 text-blue-800',
    aprobado:    'bg-green-100 text-green-800',
    rechazado:   'bg-red-100 text-red-800',
  }

  const campos = [
    { label: 'Teléfono',     valor: inscrito.telefono },
    { label: 'Correo',       valor: inscrito.correo },
    { label: 'Tipo',         valor: inscrito.tipo_egresado === 'socio' ? 'Socio ASEDUIS' : 'No socio' },
    { label: 'Acompañantes', valor: String(inscrito.acompanantes) },
    { label: 'Programa 1',   valor: inscrito.programa1 },
    { label: 'Año grado 1',  valor: inscrito.anio_grado1 },
    ...(inscrito.programa2   ? [{ label: 'Programa 2',  valor: inscrito.programa2 }]  : []),
    ...(inscrito.anio_grado2 ? [{ label: 'Año grado 2', valor: inscrito.anio_grado2 }]: []),
    {label: 'Cantidad botones', valor: `${inscrito.cantidad_botones ?? 0}`},
    { label: 'Total',        valor: formatCOP(inscrito.total) },
  ]

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{inscrito.nombre}</h1>
          <p className="text-gray-500 mt-1">Cédula: {inscrito.cedula}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {inscrito.estado_pago === 'aprobado' && (
            <Link
              href={`/qr/${inscrito.id}`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Ver QR
            </Link>
          )}
          <BotonEnviarQR 
            inscritoId={inscrito.id} 
            estadoPago={inscrito.estado_pago}
            qrEnviado={inscrito.qr_enviado ?? false}
          />
          <button
            onClick={eliminar}
            disabled={eliminando}
            className="text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 border-b pb-2">Información personal</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {campos.map(({ label, valor }) => (
              <div key={label}>
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 border-b pb-2">Estado del pago</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${estadoBadge[inscrito.estado_pago]}`}>
              {inscrito.estado_pago.charAt(0).toUpperCase() + inscrito.estado_pago.slice(1)}
            </span>
            <div className="flex flex-wrap gap-2">
              {(['pendiente', 'verificando', 'aprobado', 'rechazado'] as EstadoPago[]).map(estado => (
                <button
                  key={estado}
                  onClick={() => cambiarEstado(estado)}
                  disabled={inscrito.estado_pago === estado}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>
          {inscrito.ingreso && (
            <p className="text-green-600 font-medium mt-3 text-sm">
              ✅ Ingresó al evento el {new Date(inscrito.fecha_ingreso!).toLocaleString('es-CO')}
            </p>
          )}
        </div>

        {urlComprobante && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 border-b pb-2">Comprobante de pago</h2>
            <img
              src={urlComprobante}
              alt="Comprobante de pago"
              className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>
    </div>
  )
}