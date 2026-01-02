
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Sector, Technician } from "@/lib/types";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome é obrigatório." }),
  phone: z.string().optional(),
  sectorIds: z.array(z.string()).min(1, { message: "Selecione pelo menos um setor." }),
  euroInfoId: z.string().optional(),
  rondoInfoId: z.string().optional(),
});

export type EditTechnicianFormValues = z.infer<typeof formSchema>;

interface EditTechnicianFormProps {
  technician: Technician;
  onSave: (technicianId: string, values: EditTechnicianFormValues) => Promise<boolean>;
  onFinished: () => void;
  sectors: Sector[];
}

export function EditTechnicianForm({ technician, onSave, onFinished, sectors }: EditTechnicianFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<EditTechnicianFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: technician.name,
      phone: (technician as any).phone || "",
      sectorIds: technician.sectorIds || [],
      euroInfoId: technician.euroInfoId || "",
      rondoInfoId: technician.rondoInfoId || "",
    },
  });

  async function onSubmit(values: EditTechnicianFormValues) {
    setIsSaving(true);
    await onSave(technician.id, values);
    setIsSaving(false);
  }

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
           <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="euroInfoId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>ID EuroInfo</FormLabel>
                    <FormControl>
                    <Input placeholder="ID do sistema legado" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="rondoInfoId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>ID RondoInfo</FormLabel>
                    <FormControl>
                    <Input placeholder="ID do sistema legado" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </div>
          <FormField
            control={form.control}
            name="sectorIds"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Setores</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value?.length && "text-muted-foreground"
                        )}
                      >
                        {field.value && field.value.length > 0
                          ? `${field.value.length} setor(es) selecionado(s)`
                          : "Selecione os setores"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar setor..." />
                      <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          {sectors.map((sector) => (
                            <CommandItem
                              value={sector.name}
                              key={sector.id}
                              onSelect={() => {
                                const currentIds = field.value || [];
                                const newIds = currentIds.includes(sector.id)
                                  ? currentIds.filter((id) => id !== sector.id)
                                  : [...currentIds, sector.id];
                                field.onChange(newIds);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value?.includes(sector.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {sector.name}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onFinished} disabled={isSaving}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
            </Button>
        </div>
      </form>
    </Form>
  );
}
