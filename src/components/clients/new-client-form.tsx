
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
import { Sector } from "@/lib/types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, ArrowLeft, ArrowRight } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome é obrigatório." }),
  document: z.string().optional(),
  phone: z.string().min(10, { message: "O telefone é obrigatório." }),
  storeId: z.enum(["EUROINFO", "RONDOINFO"], { required_error: "Selecione uma loja." }),
  address: z.object({
    street: z.string().min(2, { message: "O logradouro é obrigatório."}),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, { message: "O bairro é obrigatório."}),
    city: z.string().min(2, { message: "A cidade é obrigatória."}),
    state: z.string().min(2, { message: "O estado é obrigatório."}),
  }),
  hasSla: z.boolean().default(false),
  slaHours: z.coerce.number().optional(),
  hasPreventiveContract: z.boolean().default(false),
  preventiveContract: z.object({
    sectorIds: z.array(z.string()).refine(value => value.length > 0, { message: "Selecione pelo menos um setor." }),
    frequencyDays: z.coerce.number().positive({ message: "A frequência deve ser maior que zero." }),
  }).optional()
}).refine(data => {
    if (data.hasPreventiveContract) {
        return !!data.preventiveContract;
    }
    return true;
}, {
    message: "As configurações do contrato preventivo são obrigatórias.",
    path: ["preventiveContract"],
});


export type NewClientFormValues = z.infer<typeof formSchema>;

interface NewClientFormProps {
  onSave: (values: NewClientFormValues) => void;
  onFinished: () => void;
}

const steps = [
    { step: 1, title: "Dados do Cliente" },
    { step: 2, title: "Endereço" },
    { step: 3, title: "SLA e Contratos" },
];

export function NewClientForm({ onSave, onFinished }: NewClientFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasSla, setHasSla] = useState(false);
  const [hasPreventive, setHasPreventive] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);

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

  const form = useForm<NewClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        document: "",
        phone: "",
        storeId: undefined,
        address: {
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
        },
        hasSla: false,
        slaHours: undefined,
        hasPreventiveContract: false,
        preventiveContract: undefined,
    },
  });

  async function handleNextStep() {
    let fieldsToValidate: (keyof NewClientFormValues)[] = [];
    if (currentStep === 1) {
        fieldsToValidate = ['name', 'phone', 'storeId'];
    } else if (currentStep === 2) {
        fieldsToValidate = ['address.street', 'address.neighborhood', 'address.city', 'address.state'];
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    }
  }

  function handlePreviousStep() {
    if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
    }
  }

  function onSubmit(values: NewClientFormValues) {
    onSave(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-6 p-2 rounded-lg bg-muted">
            {steps.map((item, index) => (
                <React.Fragment key={item.step}>
                    <div className="flex items-center">
                        <div
                            className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all",
                            currentStep > item.step ? "bg-primary text-primary-foreground" :
                            currentStep === item.step ? "bg-primary text-primary-foreground scale-110" : "bg-muted-foreground/30 text-muted-foreground"
                            )}
                        >
                           {currentStep > item.step ? <Check className="w-4 h-4" /> : item.step}
                        </div>
                        <div
                            className={cn(
                            "ml-2 text-sm hidden md:block",
                            currentStep === item.step ? "font-semibold text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {item.title}
                        </div>
                    </div>
                    {index < steps.length - 1 && (
                         <div className={cn(
                             "flex-1 h-1 rounded-full",
                             currentStep > item.step ? "bg-primary" : "bg-muted-foreground/30"
                             )} />
                    )}
                </React.Fragment>
            ))}
        </div>

        <div className="min-h-[350px]">
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in-0 duration-300">
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
               <FormField
                control={form.control}
                name="storeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loja</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a loja de origem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EUROINFO">EUROINFO</SelectItem>
                        <SelectItem value="RONDOINFO">RONDOINFO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {currentStep === 2 && (
             <div className="space-y-4 animate-in fade-in-0 duration-300">
                <h3 className="text-lg font-medium">Endereço</h3>
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
             </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in-0 duration-300">
                <h3 className="text-lg font-medium">SLA (Opcional)</h3>
                <FormField
                        control={form.control}
                        name="hasSla"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    setHasSla(!!checked);
                                }}
                            />
                            </FormControl>
                            <FormLabel className="font-normal">
                                Este cliente possui um Acordo de Nível de Serviço (SLA)?
                            </FormLabel>
                        </FormItem>
                        )}
                    />
                    {hasSla && (
                        <FormField
                            control={form.control}
                            name="slaHours"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tempo de Atendimento (em horas)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="Ex: 4" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}

                    <Separator className="!my-6"/>

                    <h3 className="text-lg font-medium">Contrato de Manutenção Preventiva</h3>
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
                                    setHasPreventive(!!checked);
                                    if (checked) {
                                        form.setValue("preventiveContract", { sectorIds: [], frequencyDays: 30 });
                                    } else {
                                        form.setValue("preventiveContract", undefined);
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
          )}
        </div>

        <div className="flex justify-between gap-2 pt-4 border-t">
          <div>
            {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handlePreviousStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onFinished}>Cancelar</Button>
            {currentStep < 3 && (
                <Button type="button" onClick={handleNextStep}>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
            {currentStep === 3 && (
                <Button type="submit">Salvar Cliente</Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
