'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { crearInscrito } from '@/services/inscritos'
import { calcularTotal, formatCOP, COSTOS } from '@/types'
import { validarArchivo } from '@/utils/imagen'
import { toast } from 'sonner'

const schema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  cedula: z.string().min(6, 'Cédula inválida'),
  telefono: z.string().min(7, 'Teléfono inválido'),
  correo: z.string().email('Correo inválido'),
  acompanantes: z.coerce.number().min(0).max(10),
  programa1: z.string().min(2, 'Campo requerido'),
  anio_grado1: z.string().min(4, 'Año inválido'),
  programa2: z.string().optional(),
  anio_grado2: z.string().optional(),
  tipo_egresado: z.enum(['socio', 'no_socio']),
  cantidad_botones: z.coerce.number().min(0).max(10), // Ahora es un número
})

type FormData = z.infer<typeof schema>

export default function NuevoInscritoPage() {
  const router = useRouter()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      acompanantes: 0, 
      tipo_egresado: 'no_socio', 
      cantidad_botones: 0 
    },
  })

  const tipo = watch('tipo_egresado')
  const acompanantes = watch('acompanantes')
  const cantidad_botones = watch('cantidad_botones')
  
  // Se pasa la cantidad numérica a la función de cálculo
  const total = calcularTotal(tipo, Number(acompanantes), Number(cantidad_botones))

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const error = validarArchivo(file)
    if (error) { toast.error(error); return }
    setArchivo(file)
  }

  async function onSubmit(data: FormData) {
    if (!archivo) { toast.error('Debes subir el comprobante de pago'); return }
    setLoading(true)
    try {
      await crearInscrito({ ...data, total }, archivo)
      toast.success('Inscrito registrado correctamente')
      router.push('/inscritos')
    } catch (e: any) {
      if (e?.message?.includes('unique') || e?.code === '23505') {
        toast.error('Ya existe un inscrito con esa cédula')
      } else {
        toast.error('Error al registrar inscrito')
      }
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo inscrito</h1>
        <p className="text-gray-500 mt-1">Completa todos los campos del formulario</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ... Datos personales e Información académica permanecen igual ... */}
        
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 border-b pb-2">Datos personales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre completo *" error={errors.nombre?.message}>
              <input {...register('nombre')} className={inputClass} placeholder="Juan Pérez García" />
            </Field>
            <Field label="Cédula *" error={errors.cedula?.message}>
              <input {...register('cedula')} className={inputClass} placeholder="1234567890" />
            </Field>
            <Field label="Teléfono *" error={errors.telefono?.message}>
              <input {...register('telefono')} className={inputClass} placeholder="3001234567" />
            </Field>
            <Field label="Correo electrónico *" error={errors.correo?.message}>
              <input {...register('correo')} type="email" className={inputClass} placeholder="correo@email.com" />
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 border-b pb-2">Información académica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Programa 1 *" error={errors.programa1?.message}>
              <input {...register('programa1')} className={inputClass} placeholder="Ej: Ingeniería de Sistemas" />
            </Field>
            <Field label="Año de grado 1 *" error={errors.anio_grado1?.message}>
              <input {...register('anio_grado1')} className={inputClass} placeholder="Ej: 2015" />
            </Field>
            <Field label="Programa 2 (opcional)" error={errors.programa2?.message}>
              <input {...register('programa2')} className={inputClass} placeholder="Ej: Derecho" />
            </Field>
            <Field label="Año de grado 2 (opcional)" error={errors.anio_grado2?.message}>
              <input {...register('anio_grado2')} className={inputClass} placeholder="Ej: 2018" />
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 border-b pb-2">Tipo y costos</h2>
          <Field label="Tipo de egresado *" error={errors.tipo_egresado?.message}>
            <select {...register('tipo_egresado')} className={inputClass}>
              <option value="socio">Egresado Socio ASEDUIS — {formatCOP(COSTOS.socio)}</option>
              <option value="no_socio">Egresado No Socio — {formatCOP(COSTOS.no_socio)}</option>
            </select>
          </Field>
          
          <Field label="Cantidad de acompañantes" error={errors.acompanantes?.message}>
            <input {...register('acompanantes')} type="number" min={0} max={10} className={inputClass} />
            <p className="text-xs text-gray-500 mt-1">Valor por acompañante: {formatCOP(COSTOS.acompanante)}</p>
          </Field>
          
          <Field label="Cantidad de botones extra" error={errors.cantidad_botones?.message}>
            <input {...register('cantidad_botones')} type="number" min={0} max={10} className={inputClass} />
            <p className="text-xs text-gray-500 mt-1">Valor unitario: {formatCOP(COSTOS.boton_extra)}</p>
          </Field>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <span className="font-semibold text-blue-900">Total a pagar:</span>
            <span className="text-2xl font-bold text-blue-700">{formatCOP(total)}</span>
          </div>
        </div>

        {/* ... El resto de secciones se mantienen iguales ... */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 border-b pb-2">Comprobante de pago</h2>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subir comprobante * (JPG, PNG o WEBP)</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleArchivo} className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors">{loading ? 'Guardando...' : 'Registrar inscrito'}</button>
        </div>
      </form>
    </div>
  )
}