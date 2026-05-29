'use client'
import { useState } from 'react'
import { toast } from 'sonner'

export function BotonEnviarQR({ inscritoId, estadoPago }: { inscritoId: string; estadoPago: string }) {
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  if (estadoPago !== 'aprobado') return null

  async function enviar() {
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
      setEnviado(true)
      setTimeout(() => setEnviado(false), 5000)
    } catch (e: any) {
      toast.error('Error al enviar: ' + (e?.message || 'intenta de nuevo'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <button
      onClick={enviar}
      disabled={enviando}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        enviado
          ? 'bg-green-100 text-green-700 border border-green-300'
          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
      }`}
    >
      {enviando ? (
        <><span className="animate-spin">⏳</span> Enviando...</>
      ) : enviado ? (
        <>✅ Correo enviado</>
      ) : (
        <>📧 Enviar QR por correo</>
      )}
    </button>
  )
}