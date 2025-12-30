
'use client';

import { PageHeader } from "@/components/page-header";
import { RouteOptimizer } from "@/components/routes/route-optimizer";
import { db } from "@/firebase/config";
import { ExternalTicket } from "@/lib/types";
import { collection, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function RoutesPage() {
  const [tickets, setTickets] = useState<ExternalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "external-tickets"));
      const ticketsData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ExternalTicket))
        .filter(ticket => ticket.technicianId === user.id && ticket.status === 'em andamento');

      setTickets(ticketsData);
      setLoading(false);
    };
    fetchTickets();
  }, [user]);

  return (
    <>
      <PageHeader 
        title="Otimizar Minha Rota" 
        description="Planeje a rota para seus atendimentos 'em andamento'."
      />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="mt-6">
          <RouteOptimizer externalTickets={tickets} />
        </div>
      )}
    </>
  );
}
