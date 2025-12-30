
'use client';

import type { ExternalTicket, OptimizedRoute } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { GripVertical, Info, Map as MapIcon, X, Save, Loader2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OptimizedRouteListProps {
    route: OptimizedRoute;
    onReorder: (reorderedTickets: ExternalTicket[]) => void;
    onDeleteTicket: (ticketId: string) => void;
    onSaveRoute: () => void;
    isSaving: boolean;
    isRouteSaved: boolean;
}

export function OptimizedRouteList({ 
    route, 
    onReorder, 
    onDeleteTicket, 
    onSaveRoute, 
    isSaving,
    isRouteSaved
}: OptimizedRouteListProps) {
    const handleOpenInMaps = () => {
        const baseUrl = 'https://www.google.com/maps/dir/?api=1';
        const destination = route.tickets.at(-1)?.client.address;
        const waypoints = route.tickets.slice(0, -1).map(t => encodeURIComponent(t.client.address!)).join('|');

        if (!destination) {
            return;
        }

        let mapsUrl = `${baseUrl}&destination=${encodeURIComponent(destination)}`;
        if (waypoints) {
            mapsUrl += `&waypoints=${waypoints}`;
        }
        
        window.open(mapsUrl, '_blank');
    };
    
    // Drag and Drop handlers
    const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.dataTransfer.setData("draggedIndex", index.toString());
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      const draggedIndex = parseInt(e.dataTransfer.getData("draggedIndex"), 10);
      const newTickets = [...route.tickets];
      const [draggedItem] = newTickets.splice(draggedIndex, 1);
      newTickets.splice(dropIndex, 0, draggedItem);
      onReorder(newTickets);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Sua Rota Otimizada</h2>
                <div className="flex gap-2">
                    <Button onClick={onSaveRoute} disabled={isSaving || isRouteSaved}>
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {isRouteSaved ? "Rota Salva" : "Salvar Rota"}
                    </Button>
                    {isRouteSaved && (
                        <Button onClick={handleOpenInMaps}>
                            <MapIcon className="mr-2 h-4 w-4" />
                            Abrir no Mapa
                        </Button>
                    )}
                </div>
            </div>
            
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Explicação da IA</AlertTitle>
                <AlertDescription>
                    {route.explanation}
                </AlertDescription>
            </Alert>
            
            <p className="text-sm text-muted-foreground">
                Esta é a sequência de atendimento sugerida. Você pode reordenar ou remover os chamados antes de salvar a rota.
            </p>

            <ScrollArea className="h-72 w-full pr-4">
                 <div className="space-y-2">
                    {route.tickets.map((ticket, index) => (
                         <div
                            key={ticket.id}
                            className="flex items-center gap-2 p-3 border rounded-lg bg-card"
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, index)}
                        >
                            <div 
                                className="cursor-grab"
                                draggable
                                onDragStart={(e) => onDragStart(e, index)}
                            >
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="font-bold text-lg mr-2">{index + 1}</div>
                            <div className="flex-1">
                                <p className="font-semibold">{ticket.client.name}</p>
                                <p className="text-xs text-muted-foreground">{ticket.client.address}</p>
                                {ticket.scheduledTo && (
                                     <p className="text-xs text-primary/80 font-medium">
                                        Agendado: {format(parseISO(ticket.scheduledTo), 'HH:mm', {locale: ptBR})}
                                    </p>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteTicket(ticket.id)}>
                                <X className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
