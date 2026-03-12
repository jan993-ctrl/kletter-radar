import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'janstoll1993@googlemail.com'

export async function proxy(request) {
  const { pathname } = request.nextUrl

  const clearSupabaseAuthCookies = () => {
    const cookieNames = request.cookies
      .getAll()
      .map(({ name }) => name)
      .filter((name) => name.startsWith('sb-') && name.includes('auth-token'))

    for (const name of cookieNames) {
      request.cookies.set({ name, value: '' })
      response.cookies.set({ name, value: '', maxAge: 0, path: '/' })
    }
  }

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
  let user = null

  try {
    const {
      data: { user: resolvedUser },
    } = await supabase.auth.getUser()

    user = resolvedUser
  } catch (error) {
    const isStaleRefreshToken =
      error?.__isAuthError === true &&
      error?.status === 400 &&
      error?.code === 'refresh_token_not_found'

    // Nur bei genau diesem bekannten Supabase-Fehler (staler Refresh-Token)
    // werden Auth-Cookies bereinigt und der Request als ausgeloggt behandelt.
    if (isStaleRefreshToken) {
      clearSupabaseAuthCookies()
    } else {
      // Unerwartete Fehler nicht verschlucken, damit sie sichtbar bleiben.
      throw error
    }
  }

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
