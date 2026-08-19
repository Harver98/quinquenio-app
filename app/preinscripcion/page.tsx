'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { crearPreinscrito } from '@/services/inscritos'
import { toast } from 'sonner'

const schema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  cedula: z.string().min(6, 'Cédula inválida'),
  telefono: z.string().min(7, 'Teléfono inválido'),
  correo: z.string().email('Correo inválido'),
})

type FormData = z.infer<typeof schema>

export default function PreinscripcionPage() {
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await crearPreinscrito(data)
      setEnviado(true)
    } catch (e: any) {
      if (e?.message?.includes('unique') || e?.code === '23505') {
        toast.error('Ya existe una preinscripción con esa cédula')
      } else {
        toast.error('Error al enviar la preinscripción')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  if (enviado) {
    return (
      <div className="p-8 max-w-md mx-auto text-center mt-20">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-bold text-gray-900">¡Preinscripción recibida!</h1>
          <p className="text-gray-600 text-sm">
            Gracias por registrarte. Pronto te contactaremos con más información sobre el evento y los siguientes pasos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Preinscripción</h1>
        <p className="text-gray-500 mt-1 text-sm">Déjanos tus datos y te contactaremos pronto</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
          <input {...register('nombre')} className={inputClass} placeholder="Juan Pérez García" />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula *</label>
          <input {...register('cedula')} className={inputClass} placeholder="1234567890" />
          {errors.cedula && <p className="text-red-500 text-xs mt-1">{errors.cedula.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
          <input {...register('telefono')} className={inputClass} placeholder="3001234567" />
          {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
          <input {...register('correo')} type="email" className={inputClass} placeholder="correo@email.com" />
          {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          {loading ? 'Enviando...' : 'Enviar preinscripción'}
        </button>
      </form>
    </div>
  )
}