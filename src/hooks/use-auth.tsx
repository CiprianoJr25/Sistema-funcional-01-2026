
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useToast } from './use-toast';
import app, { db } from '@/firebase/config';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const auth = getAuth(app);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Ignora o onAuthStateChanged se um usuário mock já estiver setado
      if (user?.id === 'mock-admin-id') {
        setLoading(false);
        return;
      }
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          let userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const appUser = { id: userDocSnap.id, ...userDocSnap.data() } as User;
            
            // Camada de compatibilidade para garantir que sectorIds seja sempre um array
            if (!appUser.sectorIds || !Array.isArray(appUser.sectorIds)) {
                appUser.sectorIds = [];
            }

            setUser(appUser);
          } else {
            toast({
              variant: "destructive",
              title: "Erro de Dados do Usuário",
              description: "Seu perfil não foi encontrado no banco de dados. Contate o suporte.",
            });
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          toast({
            variant: "destructive",
            title: "Erro ao buscar dados",
            description: "Não foi possível carregar seu perfil. Tente novamente.",
          });
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast, user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // --- Login Mestre (Sua Ideia) ---
    if (email === 'dev@nexus.com' && password === '123456') {
      const mockUser: User = {
        id: 'mock-admin-id',
        name: 'Usuário Mestre',
        email: 'dev@nexus.com',
        role: 'admin',
        status: 'active',
        sectorIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: {
            dashboard: 'write', external_tickets: 'write', internal_tickets: 'write',
            routes: 'write', planning: 'write', reports: 'write', history: 'write',
            clients: 'write', technicians: 'write', location: 'write', monitoring: 'write',
        }
      };
      setUser(mockUser);
      setLoading(false);
      toast({ title: 'Bem-vindo, Mestre!', description: 'Acesso de desenvolvimento concedido.' });
      return true;
    }
    // --- Fim do Login Mestre ---
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: "Email ou senha incorretos. Por favor, tente novamente.",
      });
      return false;
    }
  };

  const logout = async () => {
    // Se for o usuário mock, apenas limpa o estado local
    if (user?.id === 'mock-admin-id') {
      setUser(null);
      router.push('/login');
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout Error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Sair",
        description: "Ocorreu um problema ao tentar fazer logout.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
