
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useToast } from './use-toast';
import app, { db } from '@/firebase/config';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          let userDocSnap = await getDoc(userDocRef);

          // Special logic for dev1@euroinfo.com to ensure admin access
          if (firebaseUser.email === 'dev1@euroinfo.com' && !userDocSnap.exists()) {
              const adminUser: User = {
                  id: firebaseUser.uid,
                  name: 'Admin Dev',
                  email: 'dev1@euroinfo.com',
                  role: 'admin',
                  status: 'active',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  sectorIds: [],
              };
              await setDoc(userDocRef, adminUser);
              userDocSnap = await getDoc(userDocRef); // Re-fetch the document
          }


          if (userDocSnap.exists()) {
            const appUser = { id: userDocSnap.id, ...userDocSnap.data() } as User;
            
            // Robust Compatibility Layer
            if (!appUser.sectorIds || !Array.isArray(appUser.sectorIds)) {
                if ((appUser as any).sectorId) {
                    appUser.sectorIds = [(appUser as any).sectorId];
                } else {
                    appUser.sectorIds = [];
                }
            }

            setUser(appUser);
          } else {
            // User exists in Auth but not in Firestore.
            toast({
              variant: "destructive",
              title: "Erro de Dados do Usuário",
              description: "Seu perfil não foi encontrado no banco de dados. Contate o suporte.",
            });
            await signOut(auth); // Sign out to prevent inconsistent state
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
  }, [toast]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user and loading state.
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
    try {
      await signOut(auth);
      setUser(null); // Clear user state immediately
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
