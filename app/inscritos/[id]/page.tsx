'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getInscrito, getComprobanteUrl, actualizarEstadoPago, actualizarInscrito } from '@/services/inscritos'
import type { Inscrito, EstadoPago } from '@/types'
import { calcularTotal, formatCOP, COSTOS } from '@/types'
import { validarArchivo } from '@/utils/imagen'
import { BotonEnviarQR } from '@/components/ui/BotonEnviarQR'
import { toast } from 'sonner'
import Link from 'next/link'

const schema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  cedula: z.string().min(6, 'Cédula inválida'),
  telefono: z.string().min(7, 'Teléfono inválido'),
  correo: z.string().email('Correo inválido'),
  programa1: z.string().min(2, 'Campo requerido'),
  anio_grado1: z.string().min(4, 'Año inválido'),
  programa2: z.string().optional(),
  anio_grado2: z.string().optional(),
  tipo_egresado: z.enum(['socio', 'no_socio', 'ceremonia_2020_2021', 'invitado_especial']),
  acompanantes: z.coerce.number().min(0).max(10),
  cantidad_botones: z.coerce.number().min(0).max(10),
})

type FormData = z.infer<typeof schema>

export default function InscritoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [inscrito, setInscrito] = useState<Inscrito | null>(null)
  const [urlComprobante, setUrlComprobante] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [eliminando, setEliminando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const tipo = watch('tipo_egresado')
  const acompanantes = watch('acompanantes')
  const cantidad_botones = watch('cantidad_botones')
  const totalCalculado = tipo ? calcularTotal(tipo, Number(acompanantes || 0), Number(cantidad_botones || 0)) : 0

  async function cargar() {
    const data = await getInscrito(id)
    setInscrito(data)
    if (data) {
      reset({
        nombre: data.nombre,
        cedula: data.cedula,
        telefono: data.telefono,
        correo: data.correo,
        programa1: data.programa1,
        anio_grado1: data.anio_grado1,
        programa2: data.programa2 || '',
        anio_grado2: data.anio_grado2 || '',
        tipo_egresado: data.tipo_egresado,
        acompanantes: data.acompanantes,
        cantidad_botones: data.cantidad_botones,
      })
    }
    if (data?.comprobante_url) {
      const url = await getComprobanteUrl(data.comprobante_url)
      setUrlComprobante(url)
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [id])

  async function cambiarEstado(estado: EstadoPago) {
    try {
      await actualizarEstadoPago(id, estado)
      setInscrito(prev => prev ? { ...prev, estado_pago: estado } : null)
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const error = validarArchivo(file)
    if (error) { toast.error(error); return }
    setArchivo(file)
  }

  async function onSubmit(data: FormData) {
    setGuardando(true)
    try {
      await actualizarInscrito(id, { ...data, total: totalCalculado }, archivo || undefined)
      toast.success('Inscrito actualizado')
      setEditando(false)
      setArchivo(null)
      await cargar()
    } catch (e: any) {
      if (e?.message?.includes('unique') || e?.code === '23505') {
        toast.error('Ya existe otro inscrito con esa cédula')
      } else {
        toast.error('Error al guardar los cambios')
      }
    } finally {
      setGuardando(false)
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
    preinscrito: 'bg-purple-100 text-purple-800',
    pendiente:   'bg-yellow-100 text-yellow-800',
    verificando: 'bg-blue-100 text-blue-800',
    aprobado:    'bg-green-100 text-green-800',
    rechazado:   'bg-red-100 text-red-800',
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  const campos = [
    { label: 'Teléfono',     valor: inscrito.telefono },
    { label: 'Correo',       valor: inscrito.correo },
    { label: 'Tipo',         valor: inscrito.tipo_egresado === 'socio' ? 'Socio ASEDUIS' : 'No socio' },
    { label: 'Acompañantes', valor: String(inscrito.acompanantes) },
    { label: 'Programa 1',   valor: inscrito.programa1 },
    { label: 'Año grado 1',  valor: inscrito.anio_grado1 },
    ...(inscrito.programa2   ? [{ label: 'Programa 2',  valor: inscrito.programa2 }]  : []),
    ...(inscrito.anio_grado2 ? [{ label: 'Año grado 2', valor: inscrito.anio_grado2 }]: []),
    { label: 'Cantidad botones', valor: `${inscrito.cantidad_botones ?? 0}` },
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
          {!editando && (
            <button
              onClick={() => setEditando(true)}
              className="text-blue-700 hover:text-blue-900 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Editar
            </button>
          )}
          <button
            onClick={eliminar}
            disabled={eliminando}
            className="text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>

      {editando ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 border-b pb-2">Datos personales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input {...register('nombre')} className={inputClass} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula *</label>
                <input {...register('cedula')} className={inputClass} />
                {errors.cedula && <p className="text-red-500 text-xs mt-1">{errors.cedula.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input {...register('telefono')} className={inputClass} />
                {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                <input {...register('correo')} type="email" className={inputClass} />
                {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo.message}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 border-b pb-2">Información académica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programa 1 *</label>
                <input {...register('programa1')} className={inputClass} />
                {errors.programa1 && <p className="text-red-500 text-xs mt-1">{errors.programa1.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año de grado 1 *</label>
                <input {...register('anio_grado1')} className={inputClass} />
                {errors.anio_grado1 && <p className="text-red-500 text-xs mt-1">{errors.anio_grado1.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programa 2 (opcional)</label>
                <input {...register('programa2')} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año de grado 2 (opcional)</label>
                <input {...register('anio_grado2')} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 border-b pb-2">Tipo y costos</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de egresado *</label>
              <select {...register('tipo_egresado')} className={inputClass}>
                <option value="socio">Egresado Socio ASEDUIS — {formatCOP(COSTOS.socio)}</option>
                <option value="no_socio">Egresado No Socio — {formatCOP(COSTOS.no_socio)}</option>
                <option value="ceremonia_2020_2021">Egresado Ceremonia 2020-2021 — {formatCOP(COSTOS.ceremonia_2020_2021)}</option>
                <option value="invitado_especial">Invitado Especial — {formatCOP(COSTOS.invitado_especial)}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de acompañantes</label>
              <input {...register('acompanantes')} type="number" min={0} max={10} className={inputClass} />
              <p className="text-xs text-gray-500 mt-1">Valor por acompañante: {formatCOP(COSTOS.acompanante)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de botones extra</label>
              <input {...register('cantidad_botones')} type="number" min={0} max={10} className={inputClass} />
              <p className="text-xs text-gray-500 mt-1">Valor unitario: {formatCOP(COSTOS.boton_extra)}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <span className="font-semibold text-blue-900">Total a pagar:</span>
              <span className="text-2xl font-bold text-blue-700">{formatCOP(totalCalculado)}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 border-b pb-2">Comprobante de pago</h2>
            {urlComprobante && !archivo && (
              <img src={urlComprobante} alt="Comprobante actual" className="max-w-full max-h-64 object-contain rounded-lg border border-gray-200 mb-2" />
            )}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {urlComprobante ? 'Reemplazar comprobante (opcional)' : 'Subir comprobante'}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleArchivo}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {archivo && <p className="text-xs text-gray-500 mt-1">Nuevo archivo seleccionado: {archivo.name}</p>}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => { setEditando(false); setArchivo(null); reset() }}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      ) : (
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
                {(['preinscrito', 'pendiente', 'verificando', 'aprobado', 'rechazado'] as EstadoPago[]).map(estado => (
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
      )}
    </div>
  )
}