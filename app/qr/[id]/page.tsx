'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import { getInscrito } from '@/services/inscritos'
import type { Inscrito } from '@/types'
import { formatCOP } from '@/types'
import { toast } from 'sonner'

export default function QRPage() {
  const { id } = useParams<{ id: string }>()
  const [inscrito, setInscrito] = useState<Inscrito | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    async function cargar() {
      const data = await getInscrito(id)
      if (!data) return
      setInscrito(data)

      if (data.estado_pago === 'aprobado' && data.qr_token) {
        const url = `${window.location.origin}/checkin/${data.qr_token}`
        const dataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: { dark: '#1e3a8a', light: '#ffffff' },
        })
        setQrUrl(dataUrl)
      }
    }
    cargar()
  }, [id])

  function descargar() {
    if (!qrUrl || !inscrito) return
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `QR-${inscrito.nombre}-${inscrito.cedula}.png`
    a.click()
    toast.success('QR descargado')
  }

  if (!inscrito) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  )

  if (inscrito.estado_pago !== 'aprobado') return (
    <div className="p-8 text-center">
      <p className="text-yellow-600 font-semibold text-lg">
        ⚠️ El QR solo se genera cuando el pago está aprobado
      </p>
      <p className="text-gray-500 mt-2">Estado actual: {inscrito.estado_pago}</p>
    </div>
  )

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-blue-900 p-6 text-center">
          <h1 className="text-white font-bold text-xl">Quinquenio UIS 2026</h1>
          <p className="text-blue-200 text-sm mt-1">Código de ingreso</p>
        </div>

        <div className="p-8 text-center">
          {qrUrl && (
            <img
              src={qrUrl}
              alt="Código QR de ingreso"
              className="mx-auto w-64 h-64 border-4 border-blue-100 rounded-xl"
            />
          )}

          <div className="mt-6 space-y-1">
            <p className="text-xl font-bold text-gray-900">{inscrito.nombre}</p>
            <p className="text-gray-500 text-sm">CC: {inscrito.cedula}</p>
            <p className="text-gray-500 text-sm">{inscrito.programa1} · {inscrito.anio_grado1}</p>
            {inscrito.acompanantes > 0 && (
              <p className="text-blue-600 text-sm font-medium">
                + {inscrito.acompanantes} acompañante{inscrito.acompanantes > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block">
            <p className="text-green-700 text-sm font-semibold">
              ✅ Pago aprobado — {formatCOP(inscrito.total)}
            </p>
          </div>

          {inscrito.ingreso && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-blue-700 text-sm font-medium">
                🎓 Ingresó al evento el {new Date(inscrito.fecha_ingreso!).toLocaleString('es-CO')}
              </p>
            </div>
          )}
        </div>

        <div className="px-8 pb-8">
          <button
            onClick={descargar}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            ⬇️ Descargar QR
          </button>
        </div>
      </div>
    </div>
  )
}
