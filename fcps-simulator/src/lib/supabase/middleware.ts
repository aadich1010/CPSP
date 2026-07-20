import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
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

  const pathname = request.nextUrl.pathname

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/register', '/auth/callback', '/']
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/auth/')
  )

  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin')

  // Protected student routes
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/exam')

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isProtectedRoute) {
    // Check subscription status from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (!profile) {
      // Prevent infinite redirect loop by clearing auth cookie if profile is missing
      const response = NextResponse.redirect(new URL('/login?error=missing_profile', request.url))
      response.cookies.delete('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0] + '-auth-token')
      return response
    }

    // Check if admin trying to access admin routes
    if (isAdminRoute && profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Check subscription for non-admin users
    if (profile.role !== 'admin') {
      const isActive = profile.subscription_status === 'active'
      const notExpired =
        !profile.subscription_expires_at ||
        new Date(profile.subscription_expires_at) > new Date()

      if (!isActive || !notExpired) {
        const url = request.nextUrl.clone()
        url.pathname = '/subscription-expired'
        return NextResponse.redirect(url)
      }
    }
  }

  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    // Determine if admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'admin' ? '/admin/users' : '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
