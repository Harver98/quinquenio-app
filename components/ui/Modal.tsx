'use client'
import { useEffect } from 'react'

interface ModalProps {
  abierto: boolean
  onCerrar: () => void
  titulo?: string
  children: React.ReactNode
  ancho?: 'sm' | 'md' | 'lg' | 'xl'
}

const anchos = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ abierto, onCerrar, titulo, children, ancho = 'md' }: ModalProps) {
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [abierto])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onCerrar}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${anchos[ancho]} max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        {titulo && (
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
            <button
              onClick={onCerrar}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
