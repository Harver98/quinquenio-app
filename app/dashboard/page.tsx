import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCOP } from '@/types'
import { StatCard } from '@/components/ui/StatCard'
import Link from 'next/link'

async function getStats() {
  const supabase = await createServerSupabaseClient()
  const { data: inscritos } = await supabase.from('inscritos').select('*')
  const { data: checkins } = await supabase
    .from('checkins')
    .select('id, fecha')
    .order('fecha', { ascending: false })
    .limit(5)

  if (!inscritos) return null

  return {
    total_inscritos:    inscritos.length,
    pagos_aprobados:    inscritos.filter(i => i.estado_pago === 'aprobado').length,
    pagos_pendientes:   inscritos.filter(i => i.estado_pago === 'pendiente').length,
    pagos_verificando:  inscritos.filter(i => i.estado_pago === 'verificando').length,
    pagos_rechazados:   inscritos.filter(i => i.estado_pago === 'rechazado').length,
    ingresos_realizados:inscritos.filter(i => i.ingreso).length,
    total_acompanantes: inscritos.reduce((a, i) => a + (i.acompanantes || 0), 0),
    total_recaudado:    inscritos.filter(i => i.estado_pago === 'aprobado').reduce((a, i) => a + (i.total || 0), 0),
    recientes:          inscritos.slice(0, 5),
    checkins_recientes: checkins || [],
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  if (!stats) return (
    <div className="p-8 text-gray-500">Error cargando estadísticas. Verifica la conexión a Supabase.</div>
  )

  const porcentajeIngreso = stats.pagos_aprobados > 0
    ? Math.round((stats.ingresos_realizados / stats.pagos_aprobados) * 100)
    : 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general — Quinquenio UIS 2025</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Total inscritos"    valor={stats.total_inscritos}    icon="👥" colorBorde="border-blue-500" />
        <StatCard label="Pagos aprobados"    valor={stats.pagos_aprobados}    icon="✅" colorBorde="border-green-500" />
        <StatCard label="Pendientes"         valor={stats.pagos_pendientes}   icon="⏳" colorBorde="border-yellow-500" />
        <StatCard label="Ingresos al evento" valor={stats.ingresos_realizados}icon="🎓" colorBorde="border-purple-500"
          sub={`${porcentajeIngreso}% de aprobados`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <StatCard label="Verificando"      valor={stats.pagos_verificando}  icon="🔍" colorBorde="border-blue-400" />
        <StatCard label="Rechazados"       valor={stats.pagos_rechazados}   icon="❌" colorBorde="border-red-500" />
        <StatCard label="Total acompañantes" valor={stats.total_acompanantes} icon="👨‍👩‍👧" colorBorde="border-orange-500" />
      </div>

      {/* Total recaudado destacado */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-6 mb-8 text-white flex items-center justify-between">
        <div>
          <p className="text-blue-200 text-sm font-medium">Total recaudado (pagos aprobados)</p>
          <p className="text-4xl font-bold mt-1">{formatCOP(stats.total_recaudado)}</p>
        </div>
        <span className="text-5xl">💰</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barra de estados */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Estado de pagos</h2>
          <div className="space-y-4">
            {[
              { label: 'Aprobados',   valor: stats.pagos_aprobados,  color: 'bg-green-500' },
              { label: 'Pendientes',  valor: stats.pagos_pendientes,  color: 'bg-yellow-400' },
              { label: 'Verificando', valor: stats.pagos_verificando, color: 'bg-blue-400' },
              { label: 'Rechazados',  valor: stats.pagos_rechazados,  color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.valor}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: stats.total_inscritos > 0 ? `${(item.valor / stats.total_inscritos) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/inscritos/nuevo', icon: '➕', label: 'Nuevo inscrito',   color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { href: '/pagos',           icon: '💳', label: 'Revisar pagos',    color: 'bg-green-50 text-green-700 hover:bg-green-100' },
              { href: '/checkin',         icon: '📷', label: 'Abrir check-in',   color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
              { href: '/reportes',        icon: '📋', label: 'Exportar Excel',   color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`${item.color} rounded-xl p-4 flex flex-col items-center gap-2 text-center font-medium text-sm transition-colors`}
              >
                <span className="text-2xl">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Últimos inscritos */}
        {stats.recientes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Últimos inscritos</h2>
              <Link href="/inscritos" className="text-blue-600 text-sm font-medium hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Nombre', 'Cédula', 'Tipo', 'Total', 'Estado'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recientes.map((i: any) => (
                    <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-900">{i.nombre}</td>
                      <td className="py-2.5 px-3 text-gray-500">{i.cedula}</td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs">
                        {i.tipo_egresado === 'socio' ? 'Socio' : 'No socio'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{formatCOP(i.total)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                          i.estado_pago === 'aprobado'   ? 'bg-green-100 text-green-700' :
                          i.estado_pago === 'pendiente'  ? 'bg-yellow-100 text-yellow-700' :
                          i.estado_pago === 'rechazado'  ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {i.estado_pago}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
