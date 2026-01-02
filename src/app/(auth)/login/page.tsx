
"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, user, loading: authLoading, setUser } = useAuth()
  const router = useRouter();
  const { setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  const getRedirectPath = () => {
    // A rota principal do sistema após o login é o dashboard.
    if (isMobile) {
        return '/external-tickets';
    }
    return '/dashboard';
  }

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getRedirectPath());
    }
  }, [user, authLoading, router, isMobile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    // --- Login Mestre Implementado Diretamente Aqui ---
    if (email === 'dev@nexus.com' && password === '123456') {
      const mockUser = {
        id: 'mock-admin-id',
        name: 'Usuário Mestre',
        email: 'dev@nexus.com',
        role: 'admin' as const,
        status: 'active' as const,
        sectorIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: {
            dashboard: 'write' as const, external_tickets: 'write' as const, internal_tickets: 'write' as const,
            routes: 'write' as const, planning: 'write' as const, reports: 'write' as const, history: 'write' as const,
            clients: 'write' as const, technicians: 'write' as const, location: 'write' as const, monitoring: 'write' as const,
        }
      };
      setUser(mockUser);
      toast({ title: 'Bem-vindo, Mestre!', description: 'Acesso de desenvolvimento concedido.' });
      router.replace(getRedirectPath());
      return; // Impede a continuação para o login normal
    }
    // --- Fim do Login Mestre ---

    const success = await login(email, password);
    if (success) {
      router.replace(getRedirectPath());
    } else {
      setIsLoggingIn(false);
    }
  };
  
  if (authLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
  }
  
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Logo />
        <CardTitle className="pt-4">Bem-vindo ao Nexus Service</CardTitle>
        <CardDescription>
          Entre com suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoggingIn}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoggingIn}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoggingIn}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoggingIn}>
            {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
