import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este middleware gerencia os redirecionamentos de autenticação
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Idealmente, o estado de autenticação seria verificado via token, mas
  // para esta implementação baseada em cookie, vamos assumir que a presença
  // do cookie indica uma sessão potencialmente válida.
  // A verificação real acontece no lado do cliente com o useAuth.
  const isAuthenticated = request.cookies.has('firebase-auth-state');
  
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/accept-invitation');

  // Se o usuário está autenticado e tenta acessar uma página de autenticação,
  // redireciona para o dashboard.
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Se o usuário não está autenticado e tenta acessar qualquer página que não seja
  // de autenticação, redireciona para o login.
  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Executa o middleware em todas as rotas, exceto as de arquivos estáticos,
  // imagens e rotas da API.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|logo-dark.png|manifest.webmanifest).*)'],
}
