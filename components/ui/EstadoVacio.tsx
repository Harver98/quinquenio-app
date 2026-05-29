export function EstadoVacio({
  icon = '📭',
  titulo = 'Sin resultados',
  descripcion,
  accion,
}: {
  icon?: string
  titulo?: string
  descripcion?: string
  accion?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-lg font-semibold text-gray-700">{titulo}</p>
      {descripcion && <p className="text-gray-400 text-sm mt-1 max-w-xs">{descripcion}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}
