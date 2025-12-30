
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sector, User } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useState } from "react";


const formSchema = z.object({
  name: z.string().min(2, { message: "O nome é obrigatório." }),
  phone: z.string().optional(),
  role: z.enum(["gerente", "encarregado", "vendedor"], { required_error: "Selecione um cargo." }),
  sectorIds: z.array(z.string()).optional(),
}).refine(data => !(data.role === 'encarregado' && (!data.sectorIds || data.sectorIds.length === 0)), {
    message: "O setor é obrigatório para encarregados.",
    path: ["sectorIds"],
});


export type EditUserFormValues = z.infer<typeof formSchema>;

interface EditUserFormProps {
  user: User;
  onSave: (userId: string, values: EditUserFormValues) => Promise<boolean>;
  onFinished: () => void;
  sectors: Sector[];
}

export function EditUserForm({ user, onSave, onFinished, sectors }: EditUserFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone || "",
      role: user.role as 'gerente' | 'encarregado' | 'vendedor',
      sectorIds: user.sectorIds || [],
    },
  });

  const role = form.watch("role");

  async function onSubmit(values: EditUserFormValues) {
    setIsSaving(true);
    await onSave(user.id, values);
    setIsSaving(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do usuário" {...field} />
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
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo do usuário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="encarregado">Encarregado</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {role === 'encarregado' && (
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
                      <PopoverContent className="w-full p-0">
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
          )}
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
