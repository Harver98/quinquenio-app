'use client'
import { useEffect, useRef, useState } from 'react'

type ResultadoCheckin = {
  ok: boolean
  tipo?: 'aprobado' | 'duplicado' | 'no_aprobado'
  mensaje: string
  inscrito?: {
    nombre: string
    cedula: string
    acompanantes?: number
    programa1?: string
    fecha_ingreso?: string
  }
}

const CONFIG_RESULTADO: Record<string, { bg: string; icon: string; titulo: string }> = {
  aprobado:    { bg: 'bg-green-50 border-green-400',  icon: '✅', titulo: 'INGRESO APROBADO'   },
  duplicado:   { bg: 'bg-red-50 border-red-400',      icon: '❌', titulo: 'QR YA UTILIZADO'    },
  no_aprobado: { bg: 'bg-yellow-50 border-yellow-400',icon: '⚠️', titulo: 'PAGO NO APROBADO'   },
}

export default function QrScanner() {
  const [escaneando, setEscaneando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoCheckin | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef<any>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  async function iniciar() {
    setResultado(null)
    setError('')
    setEscaneando(true)
    await new Promise(r => setTimeout(r, 100))

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader-box')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (texto: string) => {
          if (procesando) return
          setProcesando(true)
          await scanner.stop()
          setEscaneando(false)
          await procesarQR(texto)
          setProcesando(false)
        },
        () => {} // errores de frame, los ignoramos
      )
    } catch (e: any) {
      setEscaneando(false)
      setError('No se pudo acceder a la cámara. Revisa los permisos del navegador.')
    }
  }

  async function detener() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
        scannerRef.current = null
      }
    } catch {}
    setEscaneando(false)
  }

  async function procesarQR(url: string) {
    // Extrae el token UUID de la URL o usa el texto directo
    const match = url.match(/\/checkin\/([0-9a-f-]{36})/i)
    const token = match?.[1] || url.trim()

    try {
      const res = await fetch(`/api/checkin/${token}`)
      const data: ResultadoCheckin = await res.json()
      setResultado(data)
    } catch {
      setResultado({ ok: false, mensaje: 'Error de conexión al validar QR' })
    }

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setResultado(null), 8000)
  }

  useEffect(() => {
    return () => {
      detener()
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const cfg = resultado?.tipo ? CONFIG_RESULTADO[resultado.tipo] : null

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
      {/* Área de cámara */}
      <div className="relative bg-gray-900 flex items-center justify-center" style={{ minHeight: 320 }}>
        <div id="qr-reader-box" className="w-full" />

        {!escaneando && !resultado && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-6xl">📷</span>
            <p className="text-white text-sm opacity-75">Presiona iniciar para escanear</p>
          </div>
        )}

        {escaneando && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="border-2 border-white/60 rounded-xl w-64 h-64 relative">
              {/* esquinas animadas */}
              <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br" />
            </div>
          </div>
        )}
      </div>

      {/* Error de cámara */}
      {error && (
        <div className="bg-red-50 border-t-4 border-red-400 px-5 py-4 text-sm text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Resultado del escaneo */}
      {resultado && cfg && (
        <div className={`border-t-4 ${cfg.bg} p-5 text-center`}>
          <p className="text-4xl mb-1">{cfg.icon}</p>
          <p className="text-base font-black tracking-wide text-gray-900">{cfg.titulo}</p>

          {resultado.inscrito && (
            <div className="mt-3 bg-white rounded-xl px-4 py-3 text-left">
              <p className="font-bold text-gray-900 text-lg leading-tight">{resultado.inscrito.nombre}</p>
              <p className="text-gray-500 text-sm">CC: {resultado.inscrito.cedula}</p>
              {resultado.inscrito.programa1 && (
                <p className="text-gray-400 text-xs mt-0.5">{resultado.inscrito.programa1}</p>
              )}
              {!!resultado.inscrito.acompanantes && resultado.inscrito.acompanantes > 0 && (
                <p className="text-blue-600 font-semibold text-sm mt-1">
                  + {resultado.inscrito.acompanantes} acompañante{resultado.inscrito.acompanantes > 1 ? 's' : ''}
                </p>
              )}
              {resultado.inscrito.fecha_ingreso && (
                <p className="text-gray-400 text-xs mt-1">
                  Ingresó: {new Date(resultado.inscrito.fecha_ingreso).toLocaleString('es-CO')}
                </p>
              )}
            </div>
          )}

          {!resultado.inscrito && (
            <p className="text-sm text-gray-600 mt-2">{resultado.mensaje}</p>
          )}
        </div>
      )}

      {/* Botones de control */}
      <div className="px-5 py-4 flex gap-3">
        {!escaneando ? (
          <button
            onClick={iniciar}
            disabled={procesando}
            className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {procesando ? 'Procesando...' : '▶ Iniciar escáner'}
          </button>
        ) : (
          <button
            onClick={detener}
            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            ⏹ Detener
          </button>
        )}

        {resultado && (
          <button
            onClick={() => { setResultado(null); iniciar() }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            🔄 Siguiente
          </button>
        )}
      </div>

      <p className="text-center text-gray-400 text-xs pb-4">
        Apunta la cámara al código QR del asistente
      </p>
    </div>
  )
}
