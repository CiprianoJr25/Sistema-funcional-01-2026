
"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Technician, ExternalTicket } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import Link from "next/link"
import { ArrowRight, Truck } from "lucide-react"

interface ActiveRoutesCardProps {
    technicians: Technician[];
    tickets: ExternalTicket[];
}

export function ActiveRoutesCard({ technicians, tickets }: ActiveRoutesCardProps) {
    
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    const techniciansOnRoute = technicians.filter(tech => 
        tickets.some(ticket => 
            ticket.technicianId === tech.id && 
            ticket.status === 'em andamento' && 
            ticket.checkIn && 
            !ticket.checkOut
        )
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Rotas Ativas</CardTitle>
                <CardDescription>Técnicos que estão em atendimento no momento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {techniciansOnRoute.length > 0 ? (
                    techniciansOnRoute.map(tech => {
                        const currentTicket = tickets.find(t => 
                            t.technicianId === tech.id && 
                            t.status === 'em andamento' && 
                            t.checkIn && 
                            !t.checkOut
                        );
                        return (
                            <div key={tech.id} className="flex items-center">
                                <Avatar>
                                    <AvatarImage src={tech.avatarUrl} alt={tech.name} />
                                    <AvatarFallback>{getInitials(tech.name)}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                    <p className="font-semibold">{tech.name}</p>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Truck className="mr-1.5 h-3 w-3" />
                                        <span>Em atendimento: {currentTicket?.client.name || 'Cliente'}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-4">
                        <p>Nenhum técnico em rota no momento.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button asChild variant="secondary" className="w-full">
                    <Link href="/location">
                        Ver Localização em Tempo Real <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
