import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/firebase/config'

// Este middleware gerencia os redirecionamentos de autenticação
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.get('firebase-auth-state')?.value

  // Se o usuário está autenticado e tenta acessar o login, redireciona para o dashboard
  if (isAuthenticated && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Se o usuário não está autenticado e tenta acessar uma página protegida, redireciona para o login
  if (!isAuthenticated && !pathname.startsWith('/login')) {
    if (pathname === '/' || pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|logo-dark.png).*)'],
}
