
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

type AcceptInvitationFormValues = z.infer<typeof formSchema>;

function AcceptInvitationComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { toast } = useToast();

  const form = useForm<AcceptInvitationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: AcceptInvitationFormValues) => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Email não encontrado na URL.' });
      return;
    }
    
    console.log("Finalizando cadastro para:", email);
    console.log("Senha definida:", data.password);

    toast({
      title: 'Cadastro Finalizado!',
      description: 'Sua conta foi criada com sucesso. Você já pode fazer login.',
    });
    
    router.push('/login');
  };

  if (!email) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Link Inválido</CardTitle>
                    <CardDescription>O link de convite parece estar incompleto. Por favor, verifique o link ou peça um novo convite.</CardDescription>
                </CardHeader>
            </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center">
            <Logo />
            <CardTitle className="text-2xl font-bold">Finalize seu Cadastro</CardTitle>
            <CardDescription>
                Bem-vindo! Defina uma senha para sua conta <span className="font-medium">{email}</span>.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirme a Senha</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full">
                        Criar Conta
                    </Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <AcceptInvitationComponent />
        </Suspense>
    )
}
