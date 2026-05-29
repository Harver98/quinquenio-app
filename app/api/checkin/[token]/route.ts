import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const cookieStore = await cookies()
  const { token } = await params

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  // Buscar inscrito por token
  const { data: inscrito, error } = await supabase
    .from('inscritos')
    .select('*')
    .eq('qr_token', token)
    .single()

  if (error || !inscrito) {
    return NextResponse.json({ ok: false, mensaje: 'QR inválido' }, { status: 404 })
  }

  if (inscrito.estado_pago !== 'aprobado') {
    return NextResponse.json({
      ok: false,
      tipo: 'no_aprobado',
      mensaje: `Pago no aprobado (${inscrito.estado_pago})`,
      inscrito: { nombre: inscrito.nombre, cedula: inscrito.cedula },
    })
  }

  if (inscrito.ingreso) {
    return NextResponse.json({
      ok: false,
      tipo: 'duplicado',
      mensaje: 'Este QR ya fue utilizado',
      inscrito: {
        nombre: inscrito.nombre,
        cedula: inscrito.cedula,
        fecha_ingreso: inscrito.fecha_ingreso,
      },
    })
  }

  // Registrar ingreso
  const ua = request.headers.get('user-agent') || 'desconocido'
  const { data: { user } } = await supabase.auth.getUser()
  const operador = user?.email || 'operador'

  await supabase.from('inscritos').update({
    ingreso: true,
    fecha_ingreso: new Date().toISOString(),
  }).eq('id', inscrito.id)

  await supabase.from('checkins').insert({
    inscrito_id: inscrito.id,
    operador,
    dispositivo: ua.substring(0, 200),
  })

  return NextResponse.json({
    ok: true,
    tipo: 'aprobado',
    mensaje: 'Ingreso aprobado',
    inscrito: {
      nombre: inscrito.nombre,
      cedula: inscrito.cedula,
      acompanantes: inscrito.acompanantes,
      programa1: inscrito.programa1,
    },
  })
}