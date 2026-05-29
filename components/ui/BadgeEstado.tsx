import type { EstadoPago } from '@/types'

const clases: Record<EstadoPago, string> = {
  pendiente:   'bg-yellow-100 text-yellow-800 border border-yellow-300',
  verificando: 'bg-blue-100 text-blue-800 border border-blue-300',
  aprobado:    'bg-green-100 text-green-800 border border-green-300',
  rechazado:   'bg-red-100 text-red-800 border border-red-300',
}

const etiquetas: Record<EstadoPago, string> = {
  pendiente:   'Pendiente',
  verificando: 'Verificando',
  aprobado:    'Aprobado',
  rechazado:   'Rechazado',
}

export function BadgeEstado({ estado }: { estado: EstadoPago }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${clases[estado]}`}>
      {etiquetas[estado]}
    </span>
  )
}
