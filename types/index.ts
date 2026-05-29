export type EstadoPago = 'pendiente' | 'verificando' | 'aprobado' | 'rechazado'
export type TipoEgresado = 'socio' | 'no_socio'
export type RolUsuario = 'admin' | 'checkin'

export interface Inscrito {
  id: string
  nombre: string
  cedula: string
  telefono: string
  correo: string
  acompanantes: number
  programa1: string
  anio_grado1: string
  programa2?: string
  anio_grado2?: string
  tipo_egresado: TipoEgresado
  cantidad_botones: number // Cambiado de boolean a number
  total: number
  estado_pago: EstadoPago
  qr_token: string
  ingreso: boolean
  fecha_ingreso?: string
  comprobante_url?: string
  created_at: string
}

export interface Checkin {
  id: string
  inscrito_id: string
  fecha: string
  operador: string
  dispositivo: string
  inscrito?: Inscrito
}

export interface DashboardStats {
  total_inscritos: number
  pagos_aprobados: number
  pagos_pendientes: number
  pagos_rechazados: number
  ingresos_realizados: number
  total_acompanantes: number
  total_recaudado: number
}

export const COSTOS = {
  socio: 100000,
  no_socio: 150000,
  acompanante: 80000,
  boton_extra: 15000,
} as const

export function calcularTotal(
  tipo: TipoEgresado,
  acompanantes: number,
  cantidad_botones: number // Cambiado de boolean a number
): number {
  const base = tipo === 'socio' ? COSTOS.socio : COSTOS.no_socio
  // Ahora multiplicamos la cantidad por el costo unitario
  return base + (acompanantes * COSTOS.acompanante) + (cantidad_botones * COSTOS.boton_extra)
}

export function formatCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor)
}