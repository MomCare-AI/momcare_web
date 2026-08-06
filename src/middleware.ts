import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
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
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isRootRoute = request.nextUrl.pathname === '/'

  if (!user) {
    if (!isAuthRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  const role = request.cookies.get('user_role')?.value

  // Redirect authenticated users away from login or root
  if (isAuthRoute || isRootRoute) {
    if (role === 'doctor') return NextResponse.redirect(new URL('/doctor', request.url))
    if (role === 'ngo_coordinator') return NextResponse.redirect(new URL('/ngo', request.url))
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    // A Supabase session exists but no valid role cookie - e.g. a prior
    // login attempt where auth succeeded but the role-fetch step
    // failed. If we're already on /login, render it instead of
    // redirecting to itself (that redirect-to-self was an infinite
    // loop - ERR_TOO_MANY_REDIRECTS). The login form can just be
    // submitted again.
    if (isAuthRoute) return supabaseResponse
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role gating
  const path = request.nextUrl.pathname
  if (path.startsWith('/doctor') && role !== 'doctor') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (path.startsWith('/ngo') && role !== 'ngo_coordinator') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
