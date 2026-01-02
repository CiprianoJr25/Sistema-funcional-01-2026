import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware desativado para resolver o problema de redirecionamento.
// A lógica de proteção de rota agora está centralizada no layout da aplicação.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [], // Desativa completamente o middleware
}
