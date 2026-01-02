
'use client';

import { PageHeader } from "@/components/page-header";
import { TechnicianRouteCard } from "@/components/location/technician-route-card";
import { db } from "@/firebase/config";
import { ExternalTicket, Sector, Technician, User } from "@/lib/types";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LocationFilterBar } from "@/components/location/location-filter-bar";
import { isToday, parseISO } from "date-fns";

export default function LocationPage() {
  const [allTickets, setAllTickets] = useState<ExternalTicket[]>([]);
  const [allTechnicians, setAllTechnicians] = useState<Technician[]>([]);
  const [allSectors, setAllSectors] = useState<Sector[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [sectorFilter, setSectorFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    const ticketsQuery = query(collection(db, "external-tickets"), where("status", "in", ["em andamento", "concluído"]));
    
    const unsubscribes = [
        onSnapshot(ticketsQuery, snapshot => {
            setAllTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExternalTicket)));
        }),
        onSnapshot(collection(db, "technicians"), snapshot => {
            setAllTechnicians(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician)));
        }),
        onSnapshot(collection(db, "users"), snapshot => {
            setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        }),
        onSnapshot(collection(db, 'sectors'), snapshot => {
            setAllSectors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sector)));
        }),
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const techniciansOnRoute = useMemo(() => {
    if (!user) return [];
  
    // 1. Filter technicians based on user role
    let visibleTechnicians: Technician[];
    if (user.role === 'admin' || user.role === 'gerente') {
      visibleTechnicians = allTechnicians;
    } else if (user.role === 'encarregado' && user.sectorIds) {
      visibleTechnicians = allTechnicians.filter(tech =>
        tech.sectorIds?.some(sectorId => user.sectorIds?.includes(sectorId))
      );
    } else {
      visibleTechnicians = allTechnicians.filter(tech => tech.id === user.id);
    }
  
    // 2. Apply sector filter if selected
    if (sectorFilter !== 'all') {
      visibleTechnicians = visibleTechnicians.filter(tech =>
        tech.sectorIds?.includes(sectorFilter)
      );
    }
  
    // 3. From the visible list, find who is actually on a route
    const techniciansWithTicketsInProgress = visibleTechnicians.filter(tech =>
      allTickets.some(ticket => {
        const isTechTicket = ticket.technicianId === tech.id;
        const isActive = ticket.status === 'em andamento';
        // Only consider tickets completed today for today's route view
        const isCompletedToday = ticket.status === 'concluído' && ticket.updatedAt && isToday(parseISO(ticket.updatedAt));
        return isTechTicket && (isActive || isCompletedToday);
      })
    );
    
    // 4. Map the final list to the card props
    return techniciansWithTicketsInProgress.map(tech => {
      const techUser = allUsers.find(u => u.id === tech.userId);
      
      const allTechTickets = allTickets.filter(t => {
        if (t.technicianId !== tech.id) return false;
        if (t.status === 'em andamento') return true;
        if (t.status === 'concluído' && t.updatedAt && isToday(parseISO(t.updatedAt))) return true;
        return false;
      });
      
      const routeOrder = tech.routeOrder || [];
      const enRouteTicket = allTechTickets.find(t => t.enRoute);

      let ticketsOnRoute = allTechTickets.filter(t => 
        routeOrder.includes(t.id) ||
        t.enRoute ||
        (t.status === 'concluído' && (t.enRoute || routeOrder.includes(t.id)))
      );
      
      if (routeOrder.length > 0) {
        ticketsOnRoute.sort((a, b) => {
            const indexA = routeOrder.indexOf(a.id);
            const indexB = routeOrder.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA === -1) return 1;  
            if (indexB === -1) return -1; 
            return 0;
        });
      } else {
         ticketsOnRoute.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      
      if (enRouteTicket && ticketsOnRoute.some(t => t.id === enRouteTicket.id)) {
          const enRouteIndex = ticketsOnRoute.findIndex(t => t.id === enRouteTicket.id);
          const lastCompletedIndex = ticketsOnRoute.map(t => t.status === 'concluído').lastIndexOf(true);
          
          if (enRouteIndex !== lastCompletedIndex + 1) {
              const [ticketToMove] = ticketsOnRoute.splice(enRouteIndex, 1);
              ticketsOnRoute.splice(lastCompletedIndex + 1, 0, ticketToMove);
          }
      }
      
      let otherTickets = allTechTickets.filter(t => 
        t.status === 'em andamento' && 
        !ticketsOnRoute.some(tr => tr.id === t.id)
      );
      
      const ticketsWithoutAddress = otherTickets.filter(t => !t.client.address);
      const offRouteTickets = otherTickets.filter(t => !!t.client.address);

      return {
        technician: { ...tech, avatarUrl: techUser?.avatarUrl, name: techUser?.name || tech.name, email: techUser?.email || tech.email },
        ticketsWithAddress: ticketsOnRoute,
        ticketsWithoutAddress: ticketsWithoutAddress,
        offRouteTickets: offRouteTickets,
      };
    });
  }, [allTickets, allTechnicians, allUsers, user, sectorFilter]);

  return (
    <>
      <PageHeader 
        title="Localização da Equipe" 
        description="Acompanhe o progresso das rotas dos técnicos em tempo real."
      />

       <div className="py-4">
        <LocationFilterBar
          allSectors={allSectors}
          currentUser={user}
          sectorFilter={sectorFilter}
          onSectorChange={setSectorFilter}
        />
      </div>

      <div className="mt-6 space-y-8">
        {techniciansOnRoute.length > 0 ? (
          techniciansOnRoute.map(({ technician, ticketsWithAddress, ticketsWithoutAddress, offRouteTickets }) => (
            <TechnicianRouteCard 
              key={technician.id} 
              technician={technician} 
              ticketsWithAddress={ticketsWithAddress}
              ticketsWithoutAddress={ticketsWithoutAddress}
              offRouteTickets={offRouteTickets}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-10 rounded-lg border bg-card">
              Nenhum técnico em rota no setor selecionado.
          </div>
        )}
      </div>
    </>
  );
}

    