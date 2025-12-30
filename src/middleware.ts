
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este middleware não faz nada, mas o arquivo é necessário para que as reescritas (rewrites) funcionem corretamente.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Adicione aqui os caminhos que você quer que o middleware intercepte
    // Por enquanto, podemos deixar vazio.
  ],
}
