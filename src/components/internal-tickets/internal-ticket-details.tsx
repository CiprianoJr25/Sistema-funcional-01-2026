
import { useState } from 'react';
import type { InternalTicket, User } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface InternalTicketDetailsProps {
  ticket: InternalTicket;
  onAddComment: (ticketId: string, commentText: string) => void;
  currentUser: User | null;
  users: User[];
}

export function InternalTicketDetails({ ticket, onAddComment, currentUser, users }: InternalTicketDetailsProps) {
  const [newComment, setNewComment] = useState('');
  const creator = users.find((u) => u.id === ticket.creatorId);
  const assignee = users.find((u) => u.id === ticket.assigneeId);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddComment(ticket.id, newComment);
    setNewComment('');
  };

  const getCommentAuthor = (authorId: string) => {
    return users.find((u) => u.id === authorId);
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

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


  return (
    <div className="grid max-h-[75vh] grid-rows-[auto_1fr] gap-6">
      
      {/* Ticket Details */}
      <ScrollArea className="pr-4">
        <div className="space-y-4">
            <div className="space-y-1">
                <Label htmlFor="title">Título</Label>
                <p id="title" className="font-semibold text-lg">{ticket.title}</p>
            </div>

            {ticket.description && (
                 <div className="space-y-1">
                    <Label htmlFor="description">Descrição</Label>
                    <p id="description" className="text-sm text-muted-foreground">{ticket.description}</p>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Status</Label>
                    <div className='flex'>
                        <Badge variant={getStatusVariant(ticket.status)} className="capitalize">{ticket.status}</Badge>
                    </div>
                </div>
                <div className="space-y-1">
                    <Label>Prioridade</Label>
                    <p className="text-sm">{ticket.isPriority ? 'Sim' : 'Não'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Criado por</Label>
                    <p className="text-sm text-muted-foreground">{creator?.name || 'Desconhecido'}</p>
                </div>
                <div className="space-y-1">
                    <Label>Criado em</Label>
                    <p className="text-sm text-muted-foreground">{format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label>Atribuído a</Label>
                    <p className="text-sm text-muted-foreground">{assignee?.name || 'Ninguém'}</p>
                </div>
                {ticket.scheduledTo && (
                    <div className="space-y-1">
                        <Label>Agendado para</Label>
                        <p className="text-sm text-muted-foreground">{format(parseISO(ticket.scheduledTo), 'dd/MM/yyyy', {locale: ptBR})}</p>
                    </div>
                )}
            </div>
        </div>
      </ScrollArea>
      
      <Separator />
      
      {/* Comments Section */}
      <div className='flex flex-col gap-4 overflow-hidden'>
        <h3 className="text-lg font-medium">Comentários</h3>
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4">
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map((comment) => {
                const author = getCommentAuthor(comment.authorId);
                return (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={author?.avatarUrl} />
                      <AvatarFallback>{author ? getInitials(author.name) : '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{author?.name || 'Desconhecido'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda.</p>
            )}
          </div>
        </ScrollArea>
        {currentUser && (
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3 pt-4 border-t">
            <Avatar className="h-8 w-8">
               <AvatarImage src={currentUser.avatarUrl} />
                <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="Adicionar um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!newComment.trim()}>Enviar</Button>
          </form>
        )}
      </div>

    </div>
  );
}
