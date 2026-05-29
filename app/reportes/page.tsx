'use client'
import { useState } from 'react'
import { getInscritos } from '@/services/inscritos'
import { createClient } from '@/lib/supabase/client'
import { formatCOP } from '@/types'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function ReportesPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function exportarInscritos() {
    setLoading('inscritos')
    try {
      const data = await getInscritos()
      const rows = data.map(i => ({
        Nombre: i.nombre,
        Cédula: i.cedula,
        Teléfono: i.telefono,
        Correo: i.correo,
        'Tipo egresado': i.tipo_egresado === 'socio' ? 'Socio ASEDUIS' : 'No socio',
        Programa1: i.programa1,
        'Año grado 1': i.anio_grado1,
        Programa2: i.programa2 || '',
        'Año grado 2': i.anio_grado2 || '',
        Acompañantes: i.acompanantes,
        'Botón extra': i.boton_extra ? 'Sí' : 'No',
        Total: i.total,
        'Estado pago': i.estado_pago,
        Ingresó: i.ingreso ? 'Sí' : 'No',
        'Fecha ingreso': i.fecha_ingreso ? new Date(i.fecha_ingreso).toLocaleString('es-CO') : '',
        Registrado: new Date(i.created_at).toLocaleString('es-CO'),
      }))
      exportarExcel(rows, 'Inscritos_Quinquenio')
      toast.success(`${rows.length} inscritos exportados`)
    } catch {
      toast.error('Error al exportar')
    } finally {
      setLoading(null)
    }
  }

  async function exportarCheckins() {
    setLoading('checkins')
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('checkins')
        .select('*, inscritos(nombre, cedula, programa1, acompanantes)')
        .order('fecha', { ascending: false })
      if (error) throw error

      const rows = (data || []).map((c: any) => ({
        'Nombre': c.inscritos?.nombre || '',
        'Cédula': c.inscritos?.cedula || '',
        'Programa': c.inscritos?.programa1 || '',
        'Acompañantes': c.inscritos?.acompanantes || 0,
        'Fecha ingreso': new Date(c.fecha).toLocaleString('es-CO'),
        'Operador': c.operador,
        'Dispositivo': c.dispositivo?.substring(0, 50),
      }))
      exportarExcel(rows, 'Checkins_Quinquenio')
      toast.success(`${rows.length} registros exportados`)
    } catch {
      toast.error('Error al exportar checkins')
    } finally {
      setLoading(null)
    }
  }

  async function exportarPagos() {
    setLoading('pagos')
    try {
      const data = await getInscritos()
      const rows = data.map(i => ({
        Nombre: i.nombre,
        Cédula: i.cedula,
        'Tipo egresado': i.tipo_egresado === 'socio' ? 'Socio ASEDUIS' : 'No socio',
        Acompañantes: i.acompanantes,
        'Botón extra': i.boton_extra ? 'Sí' : 'No',
        Total: i.total,
        'Estado pago': i.estado_pago,
        'Tiene comprobante': i.comprobante_url ? 'Sí' : 'No',
        Registrado: new Date(i.created_at).toLocaleString('es-CO'),
      }))

      // Totales por estado
      const resumen = [
        { Estado: 'Aprobados', Cantidad: data.filter(i => i.estado_pago === 'aprobado').length, Total: data.filter(i => i.estado_pago === 'aprobado').reduce((a, i) => a + i.total, 0) },
        { Estado: 'Pendientes', Cantidad: data.filter(i => i.estado_pago === 'pendiente').length, Total: data.filter(i => i.estado_pago === 'pendiente').reduce((a, i) => a + i.total, 0) },
        { Estado: 'Rechazados', Cantidad: data.filter(i => i.estado_pago === 'rechazado').length, Total: 0 },
      ]

      const wb = XLSX.utils.book_new()
      const ws1 = XLSX.utils.json_to_sheet(rows)
      const ws2 = XLSX.utils.json_to_sheet(resumen)
      XLSX.utils.book_append_sheet(wb, ws1, 'Detalle pagos')
      XLSX.utils.book_append_sheet(wb, ws2, 'Resumen')
      XLSX.writeFile(wb, `Pagos_Quinquenio_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.xlsx`)
      toast.success('Reporte de pagos exportado')
    } catch {
      toast.error('Error al exportar pagos')
    } finally {
      setLoading(null)
    }
  }

  function exportarExcel(data: object[], nombre: string) {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, nombre)
    XLSX.writeFile(wb, `${nombre}_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.xlsx`)
  }

  const botones = [
    {
      id: 'inscritos',
      titulo: 'Inscritos completo',
      desc: 'Todos los inscritos con datos personales, académicos y estado',
      icon: '👥',
      action: exportarInscritos,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    },
    {
      id: 'pagos',
      titulo: 'Reporte de pagos',
      desc: 'Detalle de pagos y resumen por estado con totales',
      icon: '💳',
      action: exportarPagos,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
    },
    {
      id: 'checkins',
      titulo: 'Registro de checkins',
      desc: 'Historial de ingresos al evento con operador y dispositivo',
      icon: '✅',
      action: exportarCheckins,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    },
  ]

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 mt-1">Exporta la información del evento en formato Excel</p>
      </div>

      <div className="grid gap-4">
        {botones.map(btn => (
          <div key={btn.id} className={`border rounded-xl p-5 ${btn.color} transition-colors`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{btn.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{btn.titulo}</p>
                  <p className="text-gray-600 text-sm mt-0.5">{btn.desc}</p>
                </div>
              </div>
              <button
                onClick={btn.action}
                disabled={loading === btn.id}
                className="ml-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loading === btn.id ? 'Exportando...' : '⬇ Exportar XLSX'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-2">ℹ️ Información sobre los reportes</p>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Los archivos se descargan directamente en tu dispositivo</li>
          <li>El reporte de pagos incluye dos pestañas: detalle y resumen</li>
          <li>Los checkins incluyen el dispositivo y operador que registró el ingreso</li>
          <li>Puedes abrir los archivos en Excel, Google Sheets o LibreOffice</li>
        </ul>
      </div>
    </div>
  )
}
