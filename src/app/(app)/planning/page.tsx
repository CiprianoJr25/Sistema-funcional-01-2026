
"use client";

import { useState, useEffect, useMemo, startTransition } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Client,
  Sector,
  ExternalTicket,
  PreventiveRoutePlan,
  SupportPoint,
  ServiceContract,
} from "@/lib/types";
import { collection, onSnapshot, query, where, getDocs, orderBy, limit, getDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Bot, FileText, Loader2, Sparkles, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ReactMarkdown from 'react-markdown';
import { DatePickerWithRange } from "@/components/shared/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { planPreventiveRoutes } from "@/ai/flows/plan-preventive-routes";
import { differenceInDays, parseISO, startOfDay, endOfDay, format } from "date-fns";
import { SupportPointsManager } from "@/components/planning/support-points-manager";

async function findLastPreventiveTicket(clientId: string, sectorId: string): Promise<ExternalTicket | null> {
    const ticketsRef = collection(db, 'external-tickets');
    const q = query(
        ticketsRef,
        where('client.id', '==', clientId),
        where('sectorId', '==', sectorId),
        where('type', '==', 'contrato'),
        orderBy('createdAt', 'desc'),
        limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const lastTicketDoc = querySnapshot.docs[0];
    return { id: lastTicketDoc.id, ...lastTicketDoc.data() } as ExternalTicket;
}


export default function PlanningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [supportPoints, setSupportPoints] = useState<SupportPoint[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState("all");
  const [selectedSupportPointId, setSelectedSupportPointId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<PreventiveRoutePlan | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  useEffect(() => {
    const unsubSectors = onSnapshot(collection(db, "sectors"), (snapshot) =>
      setSectors(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sector)))
    );
    const unsubClients = onSnapshot(collection(db, "clients"), (snapshot) => {
        setClients(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Client)));
    });
    const unsubContracts = onSnapshot(collection(db, "serviceContracts"), (snapshot) => {
        setContracts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ServiceContract)));
    });
    const unsubSupportPoints = onSnapshot(collection(db, "support-points"), (snapshot) => {
        setSupportPoints(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SupportPoint)));
    });

    return () => {
      unsubSectors();
      unsubClients();
      unsubContracts();
      unsubSupportPoints();
    };
  }, []);
  
  const visibleSectors = useMemo(() => {
    if (user?.role === "admin" || user?.role === "gerente") {
      return sectors.filter(s => s.status === 'active');
    }
    if (user?.role === "encarregado") {
      return sectors.filter((sector) => user.sectorIds?.includes(sector.id) && sector.status === 'active');
    }
    return [];
  }, [user, sectors]);

  const handleGeneratePlan = async () => {
    if (!user) return;
    if (!dateRange || !dateRange.from || !dateRange.to) {
        toast({
            variant: "destructive",
            title: "Período Inválido",
            description: "Por favor, selecione uma data de início e fim para o planejamento.",
        });
        return;
    }
    if (!selectedSupportPointId) {
        toast({
            variant: "destructive",
            title: "Ponto de Partida Necessário",
            description: "Por favor, selecione um ponto de partida para calcular a rota.",
        });
        return;
    }
    
    setIsLoading(true);
    setPlan(null);

    try {
        let contractsInScope = contracts.filter(c => c.status === 'active');
        
        if (selectedSectorId !== 'all') {
             contractsInScope = contractsInScope.filter(c => c.sectorIds.includes(selectedSectorId));
        } else if (user?.role === 'encarregado' && user.sectorIds) {
             contractsInScope = contractsInScope.filter(c => c.sectorIds.some(csId => user.sectorIds?.includes(csId)));
        }

        const clientsForPlanning: { id: string; name: string; address: string }[] = [];
        
        for (const contract of contractsInScope) {
            const clientDoc = await getDoc(doc(db, "clients", contract.clientId));
            if (!clientDoc.exists()) continue;
            const client = { id: clientDoc.id, ...clientDoc.data() } as Client;

            if (!client.address?.street) continue;

            const clientSectorsForPlanning = contract.sectorIds.filter(csId => 
                selectedSectorId === 'all' || csId === selectedSectorId
            );

            for (const sectorId of clientSectorsForPlanning) {
                const lastTicket = await findLastPreventiveTicket(client.id, sectorId);
                const lastVisitDate = lastTicket ? parseISO(lastTicket.updatedAt) : new Date(0);
                
                const nextDueDate = new Date(lastVisitDate);
                nextDueDate.setDate(nextDueDate.getDate() + contract.frequencyDays);
                
                if (nextDueDate >= startOfDay(dateRange.from) && nextDueDate <= endOfDay(dateRange.to)) {
                    if (!clientsForPlanning.some(c => c.id === client.id)) {
                        clientsForPlanning.push({
                            id: client.id,
                            name: client.name,
                            address: `${client.address.street}, ${client.address.number || 'S/N'}, ${client.address.neighborhood}, ${client.address.city}, ${client.address.state}`,
                        });
                    }
                }
            }
        }
        
        if (clientsForPlanning.length === 0) {
            toast({
                title: "Nenhuma Preventiva Encontrada",
                description: "Não há clientes precisando de manutenção preventiva no período e setor selecionados.",
            });
            setIsLoading(false);
            return;
        }

        const sectorContextName = selectedSectorId === 'all' 
            ? (user.role === 'encarregado' ? 'meus setores' : 'toda a empresa') 
            : sectors.find(s => s.id === selectedSectorId)?.name || '';

        const startPoint = supportPoints.find(p => p.id === selectedSupportPointId);
        if (!startPoint) {
            toast({ variant: 'destructive', title: 'Ponto de partida não encontrado' });
            setIsLoading(false);
            return;
        }
        const startAddress = `${startPoint?.address.street}, ${startPoint?.address.number || 'S/N'}, ${startPoint?.address.neighborhood}, ${startPoint?.address.city}, ${startPoint?.address.state}`;

        const aiResult = await planPreventiveRoutes({
            clients: clientsForPlanning,
            startAddress: startAddress,
            period: {
                start: format(dateRange.from, 'dd/MM/yyyy'),
                end: format(dateRange.to, 'dd/MM/yyyy'),
            },
            sectorName: sectorContextName,
            userId: user.id
        });

        startTransition(() => {
            setPlan(aiResult);
        });

    } catch (error) {
        console.error("Error generating preventive plan:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Planejar Rota",
            description: "A IA não conseguiu processar os dados. Verifique a chave da API e as configurações de fluxo.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Planejador de Rotas Preventivas"
        description="Use a IA para agrupar as manutenções preventivas em rotas diárias otimizadas."
      >
        <Button variant="outline" onClick={() => setIsManagerOpen(true)}>
            <MapPin className="mr-2 h-4 w-4" />
            Gerenciar Pontos de Apoio
        </Button>
      </PageHeader>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurar Planejamento</CardTitle>
            <CardDescription>
              Selecione o ponto de partida, o período e o escopo para gerar o plano de rotas.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col md:flex-row gap-4 flex-wrap items-center">
                 <Select value={selectedSupportPointId} onValueChange={setSelectedSupportPointId}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue placeholder="Selecione um ponto de partida..." />
                    </SelectTrigger>
                    <SelectContent>
                      {supportPoints.map((point) => (
                        <SelectItem key={point.id} value={point.id}>
                          {point.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                 {(user?.role === "admin" || user?.role === "gerente" || (user?.role === "encarregado" && (user.sectorIds?.length ?? 0) > 1)) && (
                  <Select value={selectedSectorId} onValueChange={setSelectedSectorId}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                      <SelectValue placeholder="Selecione um setor..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {user?.role === 'encarregado' ? 'Todos os meus setores' : 'Toda a empresa'}
                      </SelectItem>
                      {visibleSectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                <Button onClick={handleGeneratePlan} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Planejando..." : "Planejar Rotas"}
                </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border min-h-[400px] bg-card/50 text-center text-muted-foreground p-8">
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
            <p className="text-lg font-medium">Aguarde, a IA está analisando os contratos e montando o plano de rotas...</p>
            <p>Isso pode levar alguns instantes.</p>
          </div>
        )}

        {plan && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
             <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Plano de Rotas Gerado!</AlertTitle>
                <AlertDescription>
                    A IA agrupou os clientes em rotas diárias otimizadas.
                </AlertDescription>
            </Alert>
            
            <Card>
                <CardHeader>
                    <CardTitle>Resumo do Plano</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{plan.summary}</ReactMarkdown>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {plan.suggestedRoutes.map(route => (
                    <Card key={route.day}>
                        <CardHeader>
                            <CardTitle>Dia {route.day}</CardTitle>
                        </CardHeader>
                         <CardContent>
                           <ol className="list-decimal list-inside space-y-2">
                            {route.clients.map(client => (
                                <li key={client.id}>{client.name}</li>
                            ))}
                           </ol>
                        </CardContent>
                    </Card>
                ))}
            </div>
          </div>
        )}

        {!isLoading && !plan && (
             <div className="flex flex-col items-center justify-center gap-4 rounded-lg border min-h-[400px] bg-card/50 text-center text-muted-foreground p-8">
                <Bot className="h-12 w-12" />
                <p className="text-lg font-medium">Selecione o ponto de partida e o período para gerar um plano.</p>
                <p className='text-sm'>A IA irá agrupar os clientes com preventivas em rotas diárias eficientes.</p>
            </div>
        )}
      </div>

      <SupportPointsManager
        isOpen={isManagerOpen}
        onOpenChange={setIsManagerOpen}
        supportPoints={supportPoints}
      />
    </>
  );
}
