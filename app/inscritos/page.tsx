'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { getInscritos, actualizarEstadoPago } from '@/services/inscritos'
import type { Inscrito, EstadoPago } from '@/types'
import { formatCOP } from '@/types'
import { DataTable } from '@/components/tables/DataTable'
import { BadgeEstado } from '@/components/ui/BadgeEstado'
import { SpinnerPage } from '@/components/ui/Spinner'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

export default function InscritosPage() {
  const [inscritos, setInscritos] = useState<Inscrito[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  async function cargar() {
    try {
      setInscritos(await getInscritos())
    } catch {
      toast.error('Error al cargar inscritos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  async function cambiarEstado(id: string, estado: EstadoPago) {
    try {
      await actualizarEstadoPago(id, estado)
      setInscritos(prev => prev.map(i => i.id === id ? { ...i, estado_pago: estado } : i))
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error al actualizar estado')
    }
  }

  const datos = filtroEstado === 'todos'
    ? inscritos
    : inscritos.filter(i => i.estado_pago === filtroEstado)

  const columns: ColumnDef<Inscrito, any>[] = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => (
        <Link href={`/inscritos/${row.original.id}`} className="font-medium text-blue-700 hover:underline">
          {row.original.nombre}
        </Link>
      ),
    },
    { accessorKey: 'cedula', header: 'Cédula' },
    { accessorKey: 'telefono', header: 'Teléfono' },
    {
      accessorKey: 'tipo_egresado',
      header: 'Tipo',
      cell: ({ getValue }) => (
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full whitespace-nowrap">
          {getValue() === 'socio' ? 'Socio ASEDUIS' : 'No socio'}
        </span>
      ),
    },
    { accessorKey: 'acompanantes', header: 'Acomp.' },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => <span className="font-semibold">{formatCOP(getValue())}</span>,
    },
    {
      accessorKey: 'estado_pago',
      header: 'Estado',
      cell: ({ row }) => (
        <select
          value={row.original.estado_pago}
          onChange={e => cambiarEstado(row.original.id, e.target.value as EstadoPago)}
          className="text-xs font-medium px-2 py-1 rounded-lg border border-gray-200 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="pendiente">Pendiente</option>
          <option value="verificando">Verificando</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </select>
      ),
    },
    {
      accessorKey: 'ingreso',
      header: 'Ingresó',
      cell: ({ getValue }) => getValue() ? (
        <span className="text-green-600 font-semibold text-xs">✅ Sí</span>
      ) : (
        <span className="text-gray-300 text-xs">—</span>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-3">
          <Link href={`/inscritos/${row.original.id}`} className="text-blue-600 hover:underline text-xs font-medium">
            Ver
          </Link>
          {row.original.estado_pago === 'aprobado' && (
            <Link href={`/qr/${row.original.id}`} className="text-purple-600 hover:underline text-xs font-medium">
              QR
            </Link>
          )}
        </div>
      ),
    },
  ], [inscritos])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inscritos</h1>
          <p className="text-gray-500 mt-1">{inscritos.length} personas registradas</p>
        </div>
        <Link
          href="/inscritos/nuevo"
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          + Nuevo inscrito
        </Link>
      </div>

      {/* Filtros rápidos por estado */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['todos', 'pendiente', 'verificando', 'aprobado', 'rechazado'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filtroEstado === e
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">
              {e === 'todos' ? inscritos.length : inscritos.filter(i => i.estado_pago === e).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <SpinnerPage />
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <DataTable data={datos} columns={columns} />
        </div>
      )}
    </div>
  )
}
