export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-700 ${s}`} />
  )
}

export function SpinnerPage() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <Spinner size="md" />
    </div>
  )
}
