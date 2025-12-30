
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "../ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Sector, User } from "@/lib/types";

const formSchema = z.object({
  title: z.string().min(5, { message: "O título deve ter pelo menos 5 caracteres." }),
  description: z.string().optional(),
  scheduledTo: z.date().optional(),
  isPriority: z.boolean().default(false).optional(),
  sectorId: z.string().optional(),
  assigneeId: z.string().optional(),
});

export type NewInternalTicketFormValues = z.infer<typeof formSchema>;

interface NewInternalTicketFormProps {
  onFinished: (values: NewInternalTicketFormValues) => void;
  users: User[];
  sectors: Sector[];
}

export function NewInternalTicketForm({ onFinished, users, sectors }: NewInternalTicketFormProps) {
  const { user } = useAuth();

  const form = useForm<NewInternalTicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      isPriority: false,
      sectorId: user?.role === 'encarregado' ? user.sectorIds?.[0] : undefined,
    },
  });

  const selectedSectorId = form.watch("sectorId");
  
  const technicians = users.filter(u => u.role === 'tecnico');
  
  const filteredTechnicians = selectedSectorId 
    ? technicians.filter(t => t.sectorIds.includes(selectedSectorId))
    : technicians;


  function onSubmit(values: NewInternalTicketFormValues) {
    onFinished(values);
    form.reset();
  }
  
  // Apenas gerentes, admins e encarregados podem selecionar setor ou atribuir a outros.
  const canAssignAndSelectSector = user?.role === 'admin' || user?.role === 'gerente' || user?.role === 'encarregado';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Lembrete de reunião" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva a tarefa ou lembrete..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {canAssignAndSelectSector ? (
            <>
              <FormField
                control={form.control}
                name="sectorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue('assigneeId', '')
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sectors.filter(s => s.status === 'active').map((sector) => (
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
              
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atribuir para (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedSectorId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedSectorId ? "Selecione um setor primeiro" : "Selecione um técnico"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Ninguém (ir para o quadro)</SelectItem>
                        {filteredTechnicians.map((technician) => (
                          <SelectItem key={technician.id} value={technician.id}>
                            {technician.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted">Este atendimento será automaticamente atribuído a você.</p>
          )}

          <FormField
            control={form.control}
            name="scheduledTo"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Agendar para (Opcional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0,0,0,0))
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPriority"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Atendimento prioritário
                  </FormLabel>
                  <FormDescription>
                    Marque esta opção se for uma tarefa urgente.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  );
}
