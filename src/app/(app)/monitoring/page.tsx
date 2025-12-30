
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import type { SystemLog, User, ExternalTicket, InternalTicket } from '@/lib/types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Loader2, FileText, Bot, Network, Wrench, ClipboardList, Users, FilterX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/shared/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function MonitoringPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [externalTickets, setExternalTickets] = useState<ExternalTicket[]>([]);
  const [internalTickets, setInternalTickets] = useState<InternalTicket[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    setLoading(true);

    const unsubscribes = [
      onSnapshot(collection(db, "system-logs"), snapshot => {
        const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemLog));
        setLogs(logsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }),
      onSnapshot(collection(db, "external-tickets"), snapshot => {
        setExternalTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExternalTicket)));
      }),
      onSnapshot(collection(db, "internal-tickets"), snapshot => {
        setInternalTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InternalTicket)));
      }),
      onSnapshot(collection(db, "users"), snapshot => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      }),
    ];

    setLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());

  }, []);

  const filteredLogs = useMemo(() => {
    if (!dateRange?.from) {
      // If no date range is selected, return all logs.
      return logs;
    }
    
    const start = startOfDay(dateRange.from);
    // If there's no end date, use the start date as the end of the range.
    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

    return logs.filter(log => {
      const logDate = parseISO(log.timestamp);
      return isWithinInterval(logDate, { start, end });
    });
  }, [logs, dateRange]);


  const metrics = useMemo(() => {
    // Total metrics are always calculated on the full dataset
    const totalActiveUsers = allUsers.filter(u => u.role !== 'admin' && u.status === 'active').length;
    const totalExternalTickets = externalTickets.length;
    const totalInternalTickets = internalTickets.length;

    // Period-based metrics are calculated on filteredLogs
    const ticketsCreatedInPeriod = filteredLogs.filter(log => log.event === 'EXTERNAL_TICKET_CREATED').length;
    const aiCallsInPeriod = filteredLogs.filter(log => log.event === 'AI_CALL').length;
    const apiCallsInPeriod = filteredLogs.filter(log => log.event === 'API_CALL').length;
    
    return {
      totalExternalTickets,
      totalInternalTickets,
      totalActiveUsers,
      ticketsCreatedInPeriod,
      aiCallsInPeriod,
      apiCallsInPeriod,
    };
  }, [allUsers, externalTickets, internalTickets, filteredLogs]);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Monitoramento de Uso"
        description="Acompanhe as principais atividades e métricas do sistema."
      >
        <div className="flex items-center gap-2">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Button variant="ghost" onClick={() => setDateRange(undefined)} disabled={!dateRange}>
                <FilterX className="mr-2 h-4 w-4" />
                Limpar
            </Button>
        </div>
      </PageHeader>
      
      <div className="space-y-6 mt-6">
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requisições à IA</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.aiCallsInPeriod}</div>
              <p className="text-xs text-muted-foreground">O principal fator de custo variável. Inclui relatórios, chats e otimizações de rota.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O.S. Externas Criadas</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.ticketsCreatedInPeriod}</div>
              <p className="text-xs text-muted-foreground">Novos chamados abertos no período. Indica o volume de trabalho da equipe.</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalActiveUsers}</div>
               <p className="text-xs text-muted-foreground">Técnicos, gerentes e encarregados com acesso ao sistema. (Custo fixo)</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atendimentos Internos</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalInternalTickets}</div>
              <p className="text-xs text-muted-foreground">Total de tarefas internas. Impacta levemente o custo de banco de dados.</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chamadas de API (Externas)</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.apiCallsInPeriod}</div>
               <p className="text-xs text-muted-foreground">Buscas de dados em sistemas legados (Ex: Printwayy) no período.</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de O.S. no Sistema</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalExternalTickets}</div>
              <p className="text-xs text-muted-foreground">Volume total de dados armazenados. Impacta o custo de banco de dados.</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Futuramente podemos adicionar uma tabela de logs aqui */}

      </div>
    </>
  );
}
