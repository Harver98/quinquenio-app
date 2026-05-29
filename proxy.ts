import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(
          cookiesToSet: {
            name: string
            value: string
            options?: any
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          supabaseResponse = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isLoginPage = path.startsWith('/login')
  const isCheckinPage = path.startsWith('/checkin')
  const isApiRoute = path.startsWith('/api')

  // 1. Si NO está logueado y no es login ni api → ir al login
  if (!user && !isLoginPage && !isApiRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Si está logueado y va al login → redirigir según rol
  if (user && isLoginPage) {
    const role = user.user_metadata?.role

    if (role === 'checkin') {
      return NextResponse.redirect(new URL('/checkin', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. Si está logueado con rol checkin e intenta acceder a algo que no es checkin → bloquearlo
  if (user && !isCheckinPage && !isApiRoute) {
    const role = user.user_metadata?.role

    if (role === 'checkin') {
      return NextResponse.redirect(new URL('/checkin', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}