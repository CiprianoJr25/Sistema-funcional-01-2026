
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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, user, loading: authLoading } = useAuth()
  const router = useRouter();
  const { setTheme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);


  const getRedirectPath = () => {
      // Redireciona para a página de configurações, que é mais leve e não depende de dados.
      return '/settings';
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
    const success = await login(email, password);
    if (success) {
      router.replace(getRedirectPath());
    } else {
      // Keep loading state false to allow another attempt
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
