
"use client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalTicket, User } from "@/lib/types"

interface RecentTicketsListProps {
  tickets: ExternalTicket[];
  users: User[];
  title?: string;
  description?: string;
}

export function RecentTicketsList({ 
  tickets, 
  users, 
  title = "Chamados Recentes",
  description = "5 chamados externos abertos recentemente." 
}: RecentTicketsListProps) {

  const recent = tickets
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getAssignee = (id?: string) => users.find(u => u.id === id);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recent.length > 0 ? (
          <div className="space-y-8">
            {recent.map(ticket => {
              const assignee = getAssignee(ticket.technicianId);
              return (
                <div key={ticket.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={assignee?.avatarUrl} alt={assignee?.name} />
                    <AvatarFallback>{assignee ? getInitials(assignee.name) : '?'}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{ticket.client.name}</p>
                    <p className="text-sm text-muted-foreground">{ticket.description}</p>
                  </div>
                  <div className="ml-auto font-medium capitalize text-sm">{ticket.status}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            Nenhum chamado para exibir.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

    