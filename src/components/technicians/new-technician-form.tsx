
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sector } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome é obrigatório." }),
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  phone: z.string().optional(),
  sectorId: z.string({ required_error: "Selecione um setor." }),
});

export type NewTechnicianFormValues = z.infer<typeof formSchema>;

interface NewTechnicianFormProps {
  onSave: (values: NewTechnicianFormValues) => void;
  onFinished: () => void;
  sectors: Sector[];
}

export function NewTechnicianForm({ onSave, onFinished, sectors }: NewTechnicianFormProps) {
  const { user } = useAuth();
  
  const form = useForm<NewTechnicianFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      // If user is an encarregado with only one sector, pre-select it.
      sectorId: user?.role === 'encarregado' && user.sectorIds?.length === 1 ? user.sectorIds[0] : undefined,
    },
  });

  function onSubmit(values: NewTechnicianFormValues) {
    onSave(values);
  }
  
  // Determine which sectors should be visible in the dropdown
  const visibleSectors = useMemo(() => {
    if (user?.role === 'admin' || user?.role === 'gerente') {
      return sectors.filter(s => s.status === 'active');
    }
    if (user?.role === 'encarregado' && user.sectorIds) {
      return sectors.filter(s => user.sectorIds?.includes(s.id) && s.status === 'active');
    }
    return [];
  }, [user, sectors]);

  // Determine if the sector selection should be enabled
  const canSelectSector = user?.role === 'admin' || user?.role === 'gerente' || (user?.role === 'encarregado' && (user.sectorIds?.length ?? 0) > 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do técnico" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone (para notificações)</FormLabel>
                <FormControl>
                  <Input placeholder="+5569999999999" {...field} />
                </FormControl>
                <FormDescription>
                    Use o formato internacional (Ex: +55 DDD Numero).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
            <FormField
              control={form.control}
              name="sectorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={!canSelectSector}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o setor do técnico" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {visibleSectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onFinished}>Cancelar</Button>
            <Button type="submit">Salvar Técnico</Button>
        </div>
      </form>
    </Form>
  );
}
