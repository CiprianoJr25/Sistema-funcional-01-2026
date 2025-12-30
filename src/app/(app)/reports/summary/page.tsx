

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
import { generateTicketReportSummary } from "@/ai/flows/generate-ticket-report-summary";
import type {
  ExternalTicket,
  InternalTicket,
  Sector,
  User,
} from "@/lib/types";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Bot, FileText, Loader2, Sparkles, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TicketReportSummary } from "@/ai/flows/generate-ticket-report-summary";
import ReactMarkdown from 'react-markdown';
import { DatePickerWithRange } from "@/components/shared/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

export default function SummaryReportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [externalTickets, setExternalTickets] = useState<ExternalTicket[]>([]);
  const [internalTickets, setInternalTickets] = useState<InternalTicket[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<TicketReportSummary | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);


  useEffect(() => {
    const unsubscribes = [
      onSnapshot(collection(db, "sectors"), (snapshot) =>
        setSectors(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sector)))
      ),
      onSnapshot(collection(db, "users"), (snapshot) =>
        setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User)))
      ),
      onSnapshot(collection(db, "external-tickets"), (snapshot) =>
        setExternalTickets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ExternalTicket)))
      ),
      onSnapshot(collection(db, "internal-tickets"), (snapshot) =>
        setInternalTickets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as InternalTicket)))
      ),
    ];
    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  const visibleSectors = useMemo(() => {
    if (user?.role === "admin" || user?.role === "gerente") {
      return sectors;
    }
    if (user?.role === "encarregado") {
      return sectors.filter((sector) => user.sectorIds?.includes(sector.id));
    }
    return [];
  }, [user, sectors]);

  const handleGenerateReport = async () => {
    if (!user) return;
    setIsLoading(true);
    setReport(null);

    // Filter by Date
    let dateFilteredExternal = externalTickets;
    let dateFilteredInternal = internalTickets;

    if (dateRange?.from) {
        const start = startOfDay(dateRange.from);
        const end = dateRange.to ? endOfDay(dateRange.to) : new Date(9999, 11, 31);
        
        dateFilteredExternal = externalTickets.filter(ticket => {
            const ticketDate = parseISO(ticket.createdAt);
            return isWithinInterval(ticketDate, { start, end });
        });
        dateFilteredInternal = internalTickets.filter(ticket => {
            const ticketDate = parseISO(ticket.createdAt);
            return isWithinInterval(ticketDate, { start, end });
        });
    }

    // Filter by Sector
    let sectorFilteredExternal = dateFilteredExternal;
    let sectorFilteredInternal = dateFilteredInternal;

    if (selectedSectorId !== "all") {
      sectorFilteredExternal = dateFilteredExternal.filter((t) => t.sectorId === selectedSectorId);
      sectorFilteredInternal = dateFilteredInternal.filter((t) => t.sectorId === selectedSectorId);
    } else if (user.role === 'encarregado' && user.sectorIds) {
      sectorFilteredExternal = dateFilteredExternal.filter(t => user.sectorIds?.includes(t.sectorId));
      sectorFilteredInternal = dateFilteredInternal.filter(t => t.sectorId && user.sectorIds?.includes(t.sectorId));
    }

    if (sectorFilteredExternal.length === 0 && sectorFilteredInternal.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Nenhum dado para analisar',
            description: 'Não há chamados no período ou setor selecionado para gerar o relatório.'
        });
        setIsLoading(false);
        return;
    }
    
    try {
        const summary = await generateTicketReportSummary({
            externalTickets: sectorFilteredExternal,
            internalTickets: sectorFilteredInternal,
            users: users,
            sectors: sectors,
            context: `Relatório para ${selectedSectorId === 'all' ? 'toda a empresa' : sectors.find(s=>s.id === selectedSectorId)?.name}. Solicitado por ${user.name} (${user.role}).`,
            userId: user.id,
        });
        startTransition(() => {
           setReport(summary);
        });
    } catch (error) {
        console.error("Error generating report:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Gerar Relatório",
            description: "A IA não conseguiu processar os dados. Verifique a chave da API e tente novamente."
        })
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Relatórios com IA"
        description="Gere análises e insights sobre os chamados da sua equipe."
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurar Relatório</CardTitle>
            <CardDescription>
              Selecione o escopo dos dados que a IA deve analisar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
             <div className="flex flex-col md:flex-row gap-4 flex-wrap items-center">
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
                <Button onClick={handleGenerateReport} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Analisando Dados..." : "Gerar Relatório"}
                </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border min-h-[400px] bg-card/50 text-center text-muted-foreground p-8">
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
            <p className="text-lg font-medium">Aguarde, a IA está processando os dados...</p>
            <p>Isso pode levar alguns instantes dependendo do volume de chamados.</p>
          </div>
        )}

        {report && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            
            <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Relatório Gerado com Sucesso!</AlertTitle>
                <AlertDescription>
                    {`Análise para ${selectedSectorId === 'all' ? (user?.role === 'encarregado' ? 'seus setores' : 'toda a empresa') : sectors.find(s => s.id === selectedSectorId)?.name} concluída.`}
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary" /> Sumário Geral e Tendências</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{report.summaryAndTrends}</ReactMarkdown>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-amber-500" /> Sugestões de Melhoria</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                       <ReactMarkdown>{report.improvementSuggestions}</ReactMarkdown>
                    </CardContent>
                </Card>
            </div>
          </div>
        )}

        {!isLoading && !report && (
             <div className="flex flex-col items-center justify-center gap-4 rounded-lg border min-h-[400px] bg-card/50 text-center text-muted-foreground p-8">
                <Bot className="h-12 w-12" />
                <p className="text-lg font-medium">Selecione o escopo e gere um relatório</p>
                <p>A IA irá analisar os dados e fornecer insights sobre a operação.</p>
            </div>
        )}
      </div>
    </>
  );
}
