import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { request.cookies.set({ name, value, ...options }); response.cookies.set({ name, value, ...options }) },
        remove(name: string, options: CookieOptions) { request.cookies.set({ name, value: '', ...options }); response.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // If user is not logged in, redirect them to login page if they try to access a protected route
  if (!session && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user IS logged in
  if (session) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    
    // If they are an admin and try to go to the regular dashboard, send them to the admin panel
    if (profile?.role === 'admin' && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    // If they are NOT an admin and try to go to the admin panel, send them to their regular dashboard
    if (profile?.role !== 'admin' && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If they are logged in and on the login page, send them to their correct dashboard
    if (pathname === '/') {
       const destination = profile?.role === 'admin' ? '/admin' : '/dashboard';
       return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/admin/:path*',
  ],
}