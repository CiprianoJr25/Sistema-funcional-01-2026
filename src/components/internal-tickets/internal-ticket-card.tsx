
import type { InternalTicket, User } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal, Star, Calendar, MessageSquare, Hand, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import React from "react";

interface InternalTicketCardProps {
  ticket: InternalTicket;
  currentUser: User;
  users: User[];
  onStatusChange: (ticketId: string, status: InternalTicket['status']) => void;
  onViewDetails: () => void;
  onConfirmAction: (action: 'concluído' | 'cancelado' | 'pegar', ticket: InternalTicket) => void;
  showGrabAction?: boolean;
}

export function InternalTicketCard({ ticket, currentUser, users, onStatusChange, onViewDetails, onConfirmAction, showGrabAction = false }: InternalTicketCardProps) {
  const creator = users.find((u) => u.id === ticket.creatorId);
  const assignee = users.find((u) => u.id === ticket.assigneeId);

  const getStatusVariant = (status: InternalTicket['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'concluído':
        return 'default';
      case 'em andamento':
        return 'secondary';
      case 'cancelado':
        return 'destructive';
      case 'pendente':
      default:
        return 'outline';
    }
  }
  
  const getCardClasses = (status: InternalTicket['status'], isPriority?: boolean) => {
    const classes = {
        'pendente': 'bg-card',
        'em andamento': 'bg-blue-500/10',
        'concluído': 'bg-green-500/10',
        'cancelado': 'bg-red-500/10',
    };

    return cn(
        "flex flex-col cursor-pointer transition-colors h-full",
        isPriority ? 'border-amber-500 hover:border-amber-400' : 'border-border',
        status === 'pendente' && 'hover:bg-muted/50',
        status === 'em andamento' && 'border-blue-500/20',
        status === 'concluído' && 'border-green-500/20',
        status === 'cancelado' && 'border-red-500/20',
        classes[status]
    );
  }


  const canStart = ticket.status === 'pendente' && ticket.assigneeId === currentUser.id;
  const canConclude = ticket.status === 'em andamento' && ticket.assigneeId === currentUser.id;
  const canCancel = (ticket.status === 'pendente' || ticket.status === 'em andamento') && (ticket.assigneeId === currentUser.id || ticket.creatorId === currentUser.id);

  return (
    <Card 
        className={getCardClasses(ticket.status, ticket.isPriority)}
        onClick={onViewDetails}
    >
      <CardHeader className="flex-grow flex flex-col">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-1 overflow-hidden">
            <div className="flex items-center gap-2">
                {ticket.isPriority && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Atendimento prioritário</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <CardTitle className="text-lg break-words">{ticket.title}</CardTitle>
            </div>
            {ticket.scheduledTo && (
                <div className="flex items-center text-xs text-red-600 dark:text-red-500 font-medium pt-1">
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    Agendado para: {format(parseISO(ticket.scheduledTo), 'dd/MM/yyyy', {locale: ptBR})}
                </div>
            )}
          </div>
          <div className="flex items-center">
            {showGrabAction && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onConfirmAction('pegar', ticket); }}>
                      <Hand className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pegar atendimento</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={onViewDetails}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ver / Comentar
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => navigator.clipboard.writeText(ticket.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!canStart} onClick={() => onStatusChange(ticket.id, 'em andamento')}>
                  Iniciar Atendimento
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canConclude} onClick={() => onConfirmAction('concluído', ticket)}>
                  Concluir
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canCancel} onClick={() => onConfirmAction('cancelado', ticket)}>
                  Cancelar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-auto pt-2">
            <CardDescription className="text-xs">
              Criado por: {creator?.name || 'Desconhecido'} em {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow min-h-[40px] flex flex-col justify-center">
        {ticket.description && (
          <div className="border rounded-md p-3 bg-background/50 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <Badge variant={getStatusVariant(ticket.status)} className="capitalize">{ticket.status}</Badge>
        <span className="text-xs text-muted-foreground">
            {assignee ? `Atribuído a: ${assignee.name}` : 'Não atribuído'}
        </span>
      </CardFooter>
    </Card>
  );
}
