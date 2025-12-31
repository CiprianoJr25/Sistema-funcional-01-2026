
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
import { Checkbox } from "../ui/checkbox";
import { useEffect, useState } from "react";
import { Separator } from "../ui/separator";
import { Client, Sector } from "@/lib/types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import React from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome é obrigatório." }),
  document: z.string().optional(),
  phone: z.string().min(10, { message: "O telefone é obrigatório." }),
  address: z.object({
    street: z.string().min(2, { message: "O logradouro é obrigatório."}),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, { message: "O bairro é obrigatório."}),
    city: z.string().min(2, { message: "A cidade é obrigatória."}),
    state: z.string().min(2, { message: "O estado é obrigatório."}),
  }),
  hasPreventiveContract: z.boolean().default(false),
  preventiveContract: z.object({
    sectorIds: z.array(z.string()).refine(value => value.length > 0, { message: "Selecione pelo menos um setor." }),
    frequencyDays: z.coerce.number().positive({ message: "A frequência deve ser maior que zero." }),
  }).optional(),
  euroInfoId: z.string().optional(),
  rondoInfoId: z.string().optional(),
});


export type EditClientFormValues = z.infer<typeof formSchema>;

interface EditClientFormProps {
  client: Client;
  onSave: (clientId: string, values: EditClientFormValues) => Promise<boolean>;
  onFinished: () => void;
}

export function EditClientForm({ client, onSave, onFinished }: EditClientFormProps) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isSaving, setIsSaving] = useState(false);

   useEffect(() => {
    const fetchSectors = async () => {
      try {
        const sectorsSnapshot = await getDocs(collection(db, "sectors"));
        const sectorsData = sectorsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Sector))
          .filter(sector => sector.status === 'active');
        setSectors(sectorsData);
      } catch (error) {
        console.error("Error fetching sectors: ", error);
      }
    };
    fetchSectors();
  }, []);

  const form = useForm<EditClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: client.name,
        document: client.document,
        phone: client.phone,
        address: client.address,
        hasPreventiveContract: !!client.preventiveContract,
        preventiveContract: client.preventiveContract ? {
            sectorIds: client.preventiveContract.sectorIds,
            frequencyDays: client.preventiveContract.frequencyDays,
        } : { sectorIds: [], frequencyDays: 30 },
        euroInfoId: client.euroInfoId,
        rondoInfoId: client.rondoInfoId,
    },
  });
  
  const hasPreventive = form.watch("hasPreventiveContract");

  async function onSubmit(values: EditClientFormValues) {
    setIsSaving(true);
    await onSave(client.id, values);
    setIsSaving(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-4">
            {/* Dados do Cliente */}
            <h3 className="text-lg font-medium border-b pb-2">Dados do Cliente</h3>
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo / Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF / CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
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
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(99) 99999-9999" {...field} />
                    </FormControl>
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

            {/* Endereço */}
            <h3 className="text-lg font-medium border-b pb-2 pt-4">Endereço</h3>
            <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl>
                    <Input placeholder="Rua, Avenida..." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="address.number"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                        <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address.complement"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                        <Input placeholder="Apto, Bloco..." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="address.neighborhood"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                    <Input placeholder="Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <div className="grid grid-cols-[2fr_1fr] gap-4">
                <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                        <Input placeholder="Sua cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address.state"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>UF</FormLabel>
                        <FormControl>
                        <Input placeholder="SP" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            {/* Contrato de Manutenção Preventiva */}
            <h3 className="text-lg font-medium border-b pb-2 pt-4">Contrato de Manutenção Preventiva</h3>
            <FormField
                control={form.control}
                name="hasPreventiveContract"
                render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                    <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (!checked) {
                                form.setValue("preventiveContract", undefined);
                            } else {
                                form.setValue("preventiveContract", { sectorIds: [], frequencyDays: 30 });
                            }
                        }}
                    />
                    </FormControl>
                    <FormLabel className="font-normal">
                        Este cliente possui contrato de manutenção preventiva?
                    </FormLabel>
                </FormItem>
                )}
            />
            {hasPreventive && (
                <div className="space-y-4 rounded-md border p-4">
                    <FormField
                        control={form.control}
                        name="preventiveContract.frequencyDays"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Frequência da Visita Preventiva (em dias)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Ex: 30" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="preventiveContract.sectorIds"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Setores do Contrato</FormLabel>
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
            )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
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
