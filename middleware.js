import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'janstoll1993@googlemail.com'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Verhindert Laufzeit-Crashs in Dev/Preview, wenn Supabase ENV noch nicht gesetzt ist.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

  if (!hasSupabaseConfig) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/profile')) {
      return NextResponse.redirect(new URL('/login?message=Supabase-Konfiguration-fehlt', request.url))
    }

    // /login muss ohne Supabase-Konfiguration erreichbar bleiben.
    return NextResponse.next({
      request: { headers: request.headers },
    })
  }

  // 1. Erstelle eine initiale Response
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 2. Supabase Client mit KORREKTER Cookie-Logik
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value
      },
      set(name, value, options) {
        // WICHTIG: Setze den Cookie in der Request UND in der Response
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({
          request: { headers: request.headers },
        })
        response.cookies.set({ name, value, ...options })
      },
      remove(name, options) {
        // WICHTIG: Entferne den Cookie in der Request UND in der Response
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({
          request: { headers: request.headers },
        })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  // 3. User abrufen
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. Weiterleitungs-Logik

  // Schutz für Admin
  if (pathname.startsWith('/admin')) {
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Schutz für Profil
  if (pathname.startsWith('/profile') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Login-Seite verlassen, wenn bereits eingeloggt
  if (pathname === '/login' && user) {
    const target = user.email === ADMIN_EMAIL ? '/admin' : '/profile'
    return NextResponse.redirect(new URL(target, request.url))
  }

  return response
}

export const config = {
  // Wir überwachen admin, profile und login
  matcher: ['/admin/:path*', '/profile/:path*', '/login'],
}
