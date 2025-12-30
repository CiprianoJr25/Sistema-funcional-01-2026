"use client";

import React from 'react';

// Este é um layout simples para páginas de autenticação (login, etc.)
// que não devem exibir a barra lateral e o cabeçalho principal da aplicação.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {children}
    </div>
  );
}
