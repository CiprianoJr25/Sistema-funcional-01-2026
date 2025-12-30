
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalTicket, User } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle } from "lucide-react"

interface RecentActivityCardProps {
  tickets: ExternalTicket[];
  users: User[];
  title?: string;
}

export function RecentActivityCard({ 
  tickets, 
  users, 
  title = "Atividade Recente" 
}: RecentActivityCardProps) {

  const recentCompleted = tickets
    .filter(t => t.status === 'concluído' && t.updatedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getAssignee = (id?: string) => users.find(u => u.id === id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Últimos 5 chamados concluídos.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentCompleted.length > 0 ? (
          <ul className="space-y-4">
            {recentCompleted.map(ticket => {
              const technician = getAssignee(ticket.technicianId);
              return (
                <li key={ticket.id} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-semibold">{technician?.name || 'Técnico'}</span> concluiu o chamado para <span className="font-semibold">{ticket.client.name}</span>.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            Nenhuma atividade de conclusão recente.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
    

    