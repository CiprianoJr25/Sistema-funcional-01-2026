
'use client';

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import type {
  ExternalTicket,
  InternalTicket,
  Sector,
  User,
} from '@/lib/types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Bot, Loader2, Send, Sparkles, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { askInteractiveReport } from '@/ai/flows/interactive-report-flow';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function InteractiveReportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [externalTickets, setExternalTickets] = useState<ExternalTicket[]>([]);
  const [internalTickets, setInternalTickets] = useState<InternalTicket[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribes = [
      onSnapshot(collection(db, 'sectors'), (snapshot) =>
        setSectors(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sector)))
      ),
      onSnapshot(collection(db, 'users'), (snapshot) =>
        setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User)))
      ),
      onSnapshot(collection(db, 'external-tickets'), (snapshot) =>
        setExternalTickets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ExternalTicket)))
      ),
      onSnapshot(collection(db, 'internal-tickets'), (snapshot) => {
        setInternalTickets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as InternalTicket)))
        setIsDataLoading(false);
      }),
    ];
    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);
  
  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askInteractiveReport({
        question: input,
        externalTickets,
        internalTickets,
        users,
        sectors,
        userId: user.id
      });
      
      const assistantMessage: Message = { role: 'assistant', content: response.answer };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error fetching interactive report:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na IA',
        description: 'Não foi possível obter a resposta. Verifique a chave da API e tente novamente.',
      });
      // Remove the user's message if the AI fails
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Relatório Interativo"
        description="Converse com a IA para obter insights sobre os dados da sua operação."
      />
      <div className="flex flex-col h-[75vh]">
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-4 md:p-6">
            <ScrollArea className="flex-1 mb-4 pr-4" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                    <Bot className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">Assistente de Relatórios</h3>
                    <p className="text-sm">
                      Faça uma pergunta sobre seus dados.
                      <br />
                      Ex: "Quantos chamados o João concluiu este mês?"
                      <br />
                      ou "Liste os chamados urgentes pendentes."
                    </p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 ${
                      message.role === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                        <Bot className="h-5 w-5" />
                      </div>
                    )}
                    <div
                      className={`max-w-xl rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted/60'
                      }`}
                    >
                      <article className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </article>
                    </div>
                     {message.role === 'user' && user && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary flex-shrink-0">
                        <UserIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="max-w-xl rounded-lg p-3 bg-muted/60 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <span>Analisando dados e gerando resposta...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t pt-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Faça uma pergunta..."
                className="flex-1"
                disabled={isLoading || isDataLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim() || isDataLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Enviar</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
