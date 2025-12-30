
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, List, LayoutDashboard, Loader2 } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewInternalTicketForm, NewInternalTicketFormValues } from '@/components/internal-tickets/new-internal-ticket-form';
import type { InternalTicket, Comment, User, Sector } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { InternalTicketCard } from '@/components/internal-tickets/internal-ticket-card';
import { InternalTicketDetails } from '@/components/internal-tickets/internal-ticket-details';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { InternalTicketsTable } from '@/components/internal-tickets/internal-tickets-table';
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { ExternalTicketsFilterBar, StatusFilter } from '@/components/external-tickets/external-tickets-filter-bar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ViewMode = 'kanban' | 'list';

type ConfirmationState = {
    isOpen: boolean;
    action: 'concluído' | 'cancelado' | 'pegar' | null;
    ticket: InternalTicket | null;
};

export default function InternalTicketsPage() {
  const [tickets, setTickets] = useState<InternalTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<InternalTicket | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, action: null, ticket: null });
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pendente');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    const unsubscribes = [
      onSnapshot(collection(db, "internal-tickets"), snapshot => {
        setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InternalTicket)));
        setLoading(false);
      }),
      onSnapshot(collection(db, "users"), snapshot => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      }),
      onSnapshot(collection(db, "sectors"), snapshot => {
        setSectors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sector)));
      }),
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const handleAddTicket = async (values: NewInternalTicketFormValues) => {
    if (!user) return;

    const newTicketData: Omit<InternalTicket, 'id' | 'scheduledTo' | 'assigneeId' | 'sectorId'> & { scheduledTo?: string; assigneeId?: string; sectorId?: string } = {
      creatorId: user.id,
      title: values.title,
      description: values.description,
      status: 'pendente' as const,
      isPriority: values.isPriority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
    };
    
    if (values.scheduledTo) {
        newTicketData.scheduledTo = values.scheduledTo.toISOString();
    }
    
    // Assign sector
    if (values.sectorId) {
        newTicketData.sectorId = values.sectorId;
    } else if (user.sectorIds && user.sectorIds.length > 0) {
        newTicketData.sectorId = user.sectorIds[0];
    }

    // Assign user. If the user is a technician, auto-assign to them. Otherwise, use selection.
    if (user.role === 'tecnico') {
        newTicketData.assigneeId = user.id;
    } else if (values.assigneeId && values.assigneeId !== 'unassigned') {
        newTicketData.assigneeId = values.assigneeId;
    }


    try {
        await addDoc(collection(db, "internal-tickets"), newTicketData);
        setIsNewTicketDialogOpen(false);
        toast({
          title: 'Atendimento criado com sucesso!',
          description: `O atendimento "${values.title}" foi adicionado.`,
        });
    } catch (error) {
        console.error("Error adding internal ticket:", error);
        toast({ variant: 'destructive', title: "Erro ao criar atendimento" });
    }
  };
  
  const handleStatusChange = async (ticketId: string, status: InternalTicket['status']) => {
    const ticketRef = doc(db, "internal-tickets", ticketId);
    try {
        await updateDoc(ticketRef, { status, updatedAt: new Date().toISOString() });
    } catch (error) {
        console.error("Error updating status:", error);
        toast({ variant: 'destructive', title: "Erro ao atualizar status" });
    }
  };
  
  const handleConfirmAction = (action: 'concluído' | 'cancelado' | 'pegar', ticket: InternalTicket) => {
      setConfirmation({ isOpen: true, action, ticket });
  };
  
  const executeConfirmedAction = async () => {
    if (!confirmation.ticket || !confirmation.action) return;
    
    const { ticket, action } = confirmation;
    const ticketRef = doc(db, "internal-tickets", ticket.id);

    try {
        if (action === 'pegar') {
            if (!user) return;
            await updateDoc(ticketRef, { assigneeId: user.id, status: 'pendente', updatedAt: new Date().toISOString() });
            toast({ title: 'Atendimento pego!', description: 'A tarefa agora está na sua lista.'});
        } else {
            await handleStatusChange(ticket.id, action);
            toast({ title: `Atendimento ${action} com sucesso!`});
        }
    } catch (error) {
        console.error(`Error executing action ${action}:`, error);
        toast({ variant: 'destructive', title: `Erro ao ${action} atendimento` });
    } finally {
        setConfirmation({ isOpen: false, action: null, ticket: null });
    }
  };
  
  const handleViewDetails = (ticket: InternalTicket) => {
    setSelectedTicket(ticket);
    setIsDetailsOpen(true);
  };
  
  const handleAddComment = async (ticketId: string, commentText: string) => {
    if (!user) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      authorId: user.id,
      content: commentText,
      createdAt: new Date().toISOString(),
    };
    const ticketRef = doc(db, "internal-tickets", ticketId);
    try {
        await updateDoc(ticketRef, { comments: arrayUnion(newComment) });
    } catch (error) {
        console.error("Error adding comment:", error);
        toast({ variant: 'destructive', title: "Erro ao adicionar comentário" });
    }
  };

  const filteredTickets = useMemo(() => {
    if (!user) return [];

    let roleBasedVisibleTickets: InternalTicket[];

    switch (user.role) {
      case 'tecnico':
        roleBasedVisibleTickets = tickets.filter(
          (ticket) =>
            ticket.assigneeId === user.id || 
            ticket.creatorId === user.id ||
            (ticket.sectorId && user.sectorIds?.includes(ticket.sectorId) && !ticket.assigneeId) // Can also see unassigned in their sector
        );
        break;
      case 'encarregado':
        roleBasedVisibleTickets = tickets.filter(
          (ticket) => ticket.sectorId && user.sectorIds?.includes(ticket.sectorId)
        );
        break;
      case 'admin':
      case 'gerente':
        roleBasedVisibleTickets = tickets;
        break;
      default:
        roleBasedVisibleTickets = [];
    }
    
    // Sector Filter
    let sectorFilteredTickets = roleBasedVisibleTickets;
    if (sectorFilter !== 'all') {
        sectorFilteredTickets = roleBasedVisibleTickets.filter(ticket => ticket.sectorId === sectorFilter);
    }

    // Status Filter
    if (statusFilter === 'all') {
        return sectorFilteredTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const statusFilteredTickets = sectorFilteredTickets.filter(ticket => {
        // Special logic for the "Pendente" (Pending/Available) tab
        if (statusFilter === 'pendente') {
            if (user.role === 'tecnico') {
                // Technicians see tickets assigned to them that are pending, AND unassigned pending tickets in their sector.
                return ticket.status === 'pendente' && (ticket.assigneeId === user.id || !ticket.assigneeId);
            }
             if (user.role === 'encarregado') {
                // Supervisors see all pending tickets in their sector (assigned or unassigned).
                return ticket.status === 'pendente';
            }
        }
        // For all other roles and statuses, the filter is direct.
        return ticket.status === statusFilter;
    });
    
    return statusFilteredTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  }, [tickets, user, statusFilter, sectorFilter]);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  const renderGridView = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {filteredTickets.map(ticket => (
                <InternalTicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    currentUser={user!}
                    users={users}
                    onViewDetails={() => handleViewDetails(ticket)}
                    onStatusChange={handleStatusChange}
                    onConfirmAction={handleConfirmAction}
                    showGrabAction={ticket.status === 'pendente' && !ticket.assigneeId && (user?.role === 'tecnico' || user?.role === 'encarregado')}
                />
            ))}
             {filteredTickets.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                    Nenhum atendimento encontrado com os filtros selecionados.
                </div>
            )}
        </div>
    </div>
  )

  return (
    <>
    <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
      <PageHeader title="Atendimentos Internos" description="Gerencie suas tarefas e atendimentos internos.">
        <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
                <ToggleGroupItem value="kanban" aria-label="Kanban view"><LayoutDashboard className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Atendimento
                </Button>
            </DialogTrigger>
        </div>
      </PageHeader>
      
        <ExternalTicketsFilterBar
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter as (status: any) => void}
          technicianFilter={'all'}
          onTechnicianChange={() => {}}
          sectorFilter={sectorFilter}
          onSectorChange={setSectorFilter}
          contractOnly={false}
          onContractOnlyChange={() => {}}
          myTicketsOnly={false}
          onMyTicketsOnlyChange={() => {}}
          currentUser={user}
          sectors={sectors}
        />

      {viewMode === 'kanban' ? renderGridView() : <InternalTicketsTable data={tickets} users={users} />}

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
        <DialogTitle>Novo Atendimento Interno</DialogTitle>
        <DialogDescription>
            Crie uma nova tarefa ou lembrete para você ou sua equipe.
        </DialogDescription>
        </DialogHeader>
        <NewInternalTicketForm onFinished={handleAddTicket} users={users} sectors={sectors} />
      </DialogContent>
      
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
            <DialogTrigger asChild>
                <Button size="icon" className="rounded-full h-14 w-14 shadow-lg">
                    <PlusCircle className="h-6 w-6" />
                    <span className="sr-only">Novo Atendimento</span>
                </Button>
            </DialogTrigger>
        </div>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Atendimento</DialogTitle>
          </DialogHeader>
          {selectedTicket && <InternalTicketDetails ticket={selectedTicket} onAddComment={handleAddComment} currentUser={user} users={users} />}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={confirmation.isOpen} onOpenChange={(open) => !open && setConfirmation({isOpen: false, action: null, ticket: null})}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
                <AlertDialogDescription>
                    Você tem certeza que deseja {confirmation.action === 'pegar' ? 'pegar' : confirmation.action} este atendimento?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={executeConfirmedAction}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
    </>
  );
}
