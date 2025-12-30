
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { SupportPoint, Address } from "@/lib/types";
import { Loader2, MapPin } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  address: z.object({
    street: z.string().min(2, "O logradouro é obrigatório."),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "O bairro é obrigatório."),
    city: z.string().min(2, "A cidade é obrigatória."),
    state: z.string().min(2, "O estado é obrigatório."),
  }),
});

type SupportPointFormValues = z.infer<typeof formSchema>;

interface SupportPointsManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  supportPoints: SupportPoint[];
}

export function SupportPointsManager({
  isOpen,
  onOpenChange,
  supportPoints,
}: SupportPointsManagerProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SupportPointFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
    },
  });

  const onSubmit = async (values: SupportPointFormValues) => {
    setIsSaving(true);
    try {
      const newSupportPoint: Omit<SupportPoint, "id"> = {
        name: values.name,
        address: values.address,
      };
      await addDoc(collection(db, "support-points"), newSupportPoint);
      toast({
        title: "Ponto de Apoio Adicionado!",
        description: `O ponto de apoio "${values.name}" foi salvo com sucesso.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error adding support point: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível adicionar o ponto de apoio.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Pontos de Apoio</DialogTitle>
          <DialogDescription>
            Adicione ou remova os locais de partida para o planejamento de rotas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 py-4 max-h-[70vh] overflow-y-auto">
          {/* Coluna da Lista */}
          <div className="space-y-4">
            <h3 className="font-semibold">Pontos de Apoio Cadastrados</h3>
            <ScrollArea className="h-96 pr-6">
                <div className="space-y-4">
                {supportPoints.length > 0 ? (
                    supportPoints.map((point) => (
                    <div key={point.id} className="flex items-start gap-3 rounded-md border p-3">
                        <MapPin className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="font-medium">{point.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {`${point.address.street}, ${point.address.number || 'S/N'} - ${point.address.city}/${point.address.state}`}
                            </p>
                        </div>
                    </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center pt-10">
                    Nenhum ponto de apoio cadastrado.
                    </p>
                )}
                </div>
            </ScrollArea>
          </div>

          {/* Coluna do Formulário */}
          <div className="space-y-4">
             <h3 className="font-semibold">Adicionar Novo Ponto de Apoio</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Ponto de Apoio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Filial Porto Velho" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />
                <h4 className="font-medium text-sm">Endereço</h4>

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
                
                <DialogFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Ponto de Apoio
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
