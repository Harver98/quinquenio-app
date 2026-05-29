export function StatCard({
  label,
  valor,
  icon,
  colorBorde = 'border-blue-500',
  sub,
}: {
  label: string
  valor: string | number
  icon: string
  colorBorde?: string
  sub?: string
}) {
  return (
    <div className={`bg-white rounded-xl p-5 border-l-4 ${colorBorde} shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{valor}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <span className="text-2xl ml-2">{icon}</span>
      </div>
    </div>
  )
}
