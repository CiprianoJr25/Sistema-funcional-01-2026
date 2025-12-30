
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalTicket, User } from '@/lib/types';
import { AlertTriangle, Calendar, Clock, List, CheckCircle, ShieldCheck, ClipboardList, Info } from 'lucide-react';
import { isToday, isPast, parseISO, differenceInHours } from 'date-fns';
import { useMemo } from 'react';
import { ScrollArea } from '../ui/scroll-area';

interface WelcomeDialogProps {
  user: User;
  tickets: ExternalTicket[];
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeDialog({ user, tickets, isOpen, onClose }: WelcomeDialogProps) {
  
  const summary = useMemo(() => {
    if (!user || tickets.length === 0) {
      return { type: 'none' as const };
    }

    if (user.role === 'tecnico') {
        const myTickets = tickets.filter(t => t.technicianId === user.id);
        const mySectorTickets = tickets.filter(t => user.sectorIds?.includes(t.sectorId));
        
        const scheduledToday = myTickets.filter(
          (t) => t.status !== 'concluído' && t.status !== 'cancelado' && t.scheduledTo && isToday(parseISO(t.scheduledTo))
        );
        
        const overdue = myTickets.filter(
          (t) => t.status !== 'concluído' && t.status !== 'cancelado' && t.scheduledTo && isPast(parseISO(t.scheduledTo)) && !isToday(parseISO(t.scheduledTo))
        );
        
        const inProgressCount = myTickets.filter(t => t.status === 'em andamento').length;
        
        const pendingInSectorCount = mySectorTickets.filter(t => t.status === 'pendente').length;

        const expiringSla = myTickets.filter(t =>
          (t.status === 'pendente' || t.status === 'em andamento') &&
          t.slaExpiresAt &&
          differenceInHours(parseISO(t.slaExpiresAt), new Date()) <= 4 &&
          differenceInHours(parseISO(t.slaExpiresAt), new Date()) > 0
        );

        return {
          type: 'tecnico' as const,
          scheduledToday,
          overdue,
          inProgressCount,
          pendingInSectorCount,
          expiringSla,
        };
    }

    if (user.role === 'encarregado') {
        const mySectorTickets = tickets.filter(t => user.sectorIds?.includes(t.sectorId));
        const pendingCount = mySectorTickets.filter(t => t.status === 'pendente').length;
        const overdueCount = mySectorTickets.filter(t => t.status !== 'concluído' && t.status !== 'cancelado' && t.scheduledTo && isPast(parseISO(t.scheduledTo)) && !isToday(parseISO(t.scheduledTo))).length;
        const expiringSlaCount = mySectorTickets.filter(t => (t.status === 'pendente' || t.status === 'em andamento') && t.slaExpiresAt && differenceInHours(parseISO(t.slaExpiresAt), new Date()) <= 4 && differenceInHours(parseISO(t.slaExpiresAt), new Date()) > 0).length;

        return {
            type: 'encarregado' as const,
            pendingCount,
            overdueCount,
            expiringSlaCount
        }
    }
    
    if (user.role === 'admin' || user.role === 'gerente') {
        const pendingCount = tickets.filter(t => t.status === 'pendente').length;
        const overdueCount = tickets.filter(t => t.status !== 'concluído' && t.status !== 'cancelado' && t.scheduledTo && isPast(parseISO(t.scheduledTo)) && !isToday(parseISO(t.scheduledTo))).length;
        const expiringSlaCount = tickets.filter(t => (t.status === 'pendente' || t.status === 'em andamento') && t.slaExpiresAt && differenceInHours(parseISO(t.slaExpiresAt), new Date()) <= 4 && differenceInHours(parseISO(t.slaExpiresAt), new Date()) > 0).length;


        return {
            type: 'admin' as const,
            pendingCount,
            overdueCount,
            expiringSlaCount,
        }
    }

    return { type: 'none' as const };
  }, [user, tickets]);

  const renderContent = () => {
      switch(summary.type) {
          case 'tecnico':
              const { scheduledToday, overdue, inProgressCount, pendingInSectorCount, expiringSla } = summary;
              const hasAnyItems = scheduledToday.length > 0 || overdue.length > 0 || expiringSla.length > 0;
              return (
                  <>
                     {hasAnyItems ? (
                        <>
                            {overdue.length > 0 && (
                                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30">
                                    <h3 className="flex items-center text-red-600 font-semibold mb-2">
                                        <AlertTriangle className="h-5 w-5 mr-2" />
                                        Atendimentos Atrasados
                                    </h3>
                                    <ul className="space-y-1 text-sm text-destructive">
                                        {overdue.map(ticket => (
                                            <li key={ticket.id}>- {ticket.client.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {expiringSla.length > 0 && (
                                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30">
                                    <h3 className="flex items-center text-amber-600 font-semibold mb-2">
                                        <Clock className="h-5 w-5 mr-2" />
                                        SLA Próximo de Expirar
                                    </h3>
                                    <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                                        {expiringSla.map(ticket => (
                                            <li key={ticket.id}>- {ticket.client.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                             {scheduledToday.length > 0 && (
                                <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/30">
                                    <h3 className="flex items-center text-blue-600 dark:text-blue-400 font-semibold mb-2">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        Agendados para Hoje
                                    </h3>
                                    <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                                        {scheduledToday.map(ticket => (
                                            <li key={ticket.id}>- {ticket.client.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                         <div className="p-3 rounded-md bg-green-500/10 border border-green-500/30 text-center">
                            <h3 className="flex items-center justify-center text-green-600 dark:text-green-400 font-semibold mb-2">
                                <ShieldCheck className="h-5 w-5 mr-2" />
                                Tudo em Ordem!
                            </h3>
                            <p className="text-sm text-green-800 dark:text-green-300">Você não possui agendamentos ou pendências urgentes para hoje.</p>
                        </div>
                    )}
                    <div className="p-3 rounded-md bg-muted/50">
                        <h3 className="flex items-center font-semibold mb-2">
                            <List className="h-5 w-5 mr-2" />
                            Seus Chamados
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Você tem <strong>{inProgressCount}</strong> chamado(s) em andamento.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Há <strong>{pendingInSectorCount}</strong> chamado(s) pendente(s) no seu setor.
                        </p>
                    </div>
                  </>
              );
          case 'encarregado':
                const { pendingCount, overdueCount, expiringSlaCount } = summary;
                return (
                    <div className="p-3 rounded-md bg-muted/50 space-y-2">
                        <h3 className="flex items-center font-semibold mb-2">
                            <ClipboardList className="h-5 w-5 mr-2" />
                            Resumo dos Seus Setores
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">{pendingCount}</strong> chamados aguardando atribuição.
                        </p>
                         <p className="text-sm text-destructive">
                            <strong className="text-destructive">{overdueCount}</strong> chamados agendados estão atrasados.
                        </p>
                         <p className="text-sm text-amber-600">
                            <strong className="text-amber-600">{expiringSlaCount}</strong> chamados estão com SLA próximo de expirar.
                        </p>
                    </div>
                );
          case 'admin':
                return (
                     <div className="p-3 rounded-md bg-muted/50 space-y-2">
                        <h3 className="flex items-center font-semibold mb-2">
                            <Info className="h-5 w-5 mr-2" />
                            Resumo Geral do Sistema
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Atualmente há <strong className="text-foreground">{summary.pendingCount}</strong> chamados pendentes no total.
                        </p>
                         <p className="text-sm text-destructive">
                            <strong className="text-destructive">{summary.overdueCount}</strong> chamados agendados estão atrasados no sistema.
                        </p>
                         <p className="text-sm text-amber-600">
                            <strong className="text-amber-600">{summary.expiringSlaCount}</strong> chamados estão com SLA próximo de expirar.
                        </p>
                    </div>
                );
          default:
              return null;
      }
  }

  if (summary.type === 'none') {
    return null; // Don't render if there's nothing to show or dialog is closed
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Olá, {user.name.split(' ')[0]}!</DialogTitle>
          <DialogDescription>
            Aqui está um resumo rápido do seu dia.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
                {renderContent()}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            <CheckCircle className="mr-2 h-4 w-4" />
            Entendido, vamos lá!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
