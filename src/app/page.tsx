"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Aguarda a verificação da autenticação terminar
    if (!loading) {
      if (user) {
        // Se houver usuário, redireciona para o dashboard
        router.replace('/dashboard');
      } else {
        // Se não houver, redireciona para o login
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Exibe um loader enquanto a verificação acontece para evitar piscar a tela
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
