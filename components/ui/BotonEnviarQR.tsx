'use client'
import { useState } from 'react'
import { toast } from 'sonner'

export function BotonEnviarQR({ 
  inscritoId, 
  estadoPago,
  qrEnviado: initialQrEnviado
}: { 
  inscritoId: string
  estadoPago: string
  qrEnviado: boolean
}) {
  const [enviando, setEnviando] = useState(false)
  const [qrEnviado, setQrEnviado] = useState(initialQrEnviado)
  const [confirmar, setConfirmar] = useState(false)

  if (estadoPago !== 'aprobado') return null

  async function enviar() {
    setConfirmar(false)
    setEnviando(true)
    try {
      const res = await fetch('/api/enviar-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inscrito_id: inscritoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('✅ QR enviado al correo del inscrito')
      setQrEnviado(true)
    } catch (e: any) {
      toast.error('Error al enviar: ' + (e?.message || 'intenta de nuevo'))
    } finally {
      setEnviando(false)
    }
  }

  // Si ya fue enviado, mostrar advertencia antes de reenviar
  if (qrEnviado && !confirmar) {
    return (
      <button
        onClick={() => setConfirmar(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100 transition-colors"
      >
        ⚠️ Ya enviado — ¿Reenviar?
      </button>
    )
  }

  if (confirmar) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">¿Seguro?</span>
        <button
          onClick={enviar}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 transition-colors"
        >
          Sí, reenviar
        </button>
        <button
          onClick={() => setConfirmar(false)}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={enviar}
      disabled={enviando}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors disabled:opacity-50"
    >
      {enviando ? <><span className="animate-spin">⏳</span> Enviando...</> : <>📧 Enviar QR por correo</>}
    </button>
  )
}