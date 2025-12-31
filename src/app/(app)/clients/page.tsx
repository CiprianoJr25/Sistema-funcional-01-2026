
"use client"

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NewClientForm, NewClientFormValues } from "@/components/clients/new-client-form";
import { Client, ExternalTicket } from "@/lib/types";
import { collection, addDoc, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { ClientsTable } from "@/components/clients/clients-table";
import { EditClientFormValues } from "@/components/clients/edit-client-form";
import { useAuth } from "@/hooks/use-auth";

export default function ClientsPage() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();


  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "clients"), 
      (querySnapshot) => {
        const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        setClients(clientsData);
        setLoading(false);
      }, 
      (error) => {
        console.error("Error fetching clients in real-time:", error);
        toast({ variant: 'destructive', title: "Erro ao buscar clientes"});
        setLoading(false);
      }
    );

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [toast]);

  const handleAddClient = async (values: NewClientFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: "Erro de Autenticação"});
        return;
    }
    try {
      const newClientData: Omit<Client, 'id'> = {
        name: values.name,
        document: values.document,
        phone: values.phone,
        address: values.address,
        status: 'active',
        storeId: values.storeId,
        ...(values.preventiveContract && { preventiveContract: values.preventiveContract }),
      };
      
      const docRef = await addDoc(collection(db, "clients"), newClientData);
      
      // Se tiver contrato preventivo, cria a O.S. inicial
      if (values.hasPreventiveContract && values.preventiveContract) {
          const fullAddress = `${values.address.street}, ${values.address.number || 'S/N'} - ${values.address.neighborhood}, ${values.address.city} - ${values.address.state}`;

          for (const sectorId of values.preventiveContract.sectorIds) {
             const newTicketData: Omit<ExternalTicket, 'id'> = {
                client: {
                    id: docRef.id,
                    name: values.name,
                    phone: values.phone,
                    isWhats: false, 
                    address: fullAddress,
                },
                requesterName: 'Sistema (Criação de Contrato)',
                sectorId: sectorId,
                creatorId: user.id,
                description: `Manutenção preventiva inicial (Start de contrato). Frequência: ${values.preventiveContract.frequencyDays} dias.`,
                type: 'contrato',
                status: 'pendente',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
             };
             await addDoc(collection(db, "external-tickets"), newTicketData);
          }
          toast({
            title: "Contrato Ativado!",
            description: "A O.S. de manutenção inicial foi criada automaticamente."
          });
      }
      
      toast({
        title: "Cliente adicionado com sucesso!",
        description: `O cliente ${values.name} foi cadastrado.`,
      });
      setIsNewDialogOpen(false);

    } catch (error) {
      console.error("Error adding client: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar cliente",
        description: "Ocorreu um erro ao salvar os dados. Tente novamente.",
      });
    }
  };

  const handleUpdateClient = async (clientId: string, values: EditClientFormValues) => {
    const clientRef = doc(db, "clients", clientId);
    try {
        const updatedData = {
            ...values,
            // Ensure preventiveContract is either set or removed based on the checkbox
            preventiveContract: values.hasPreventiveContract ? values.preventiveContract : undefined
        };
        // Remove the helper boolean field before saving
        delete (updatedData as any).hasPreventiveContract;


        await updateDoc(clientRef, updatedData);
        // No need to update local state, onSnapshot will handle it.
        toast({ title: "Cliente atualizado com sucesso!" });
        return true;
    } catch (error) {
        console.error("Error updating client: ", error);
        toast({ variant: 'destructive', title: "Erro ao atualizar cliente" });
        return false;
    }
  };
  
  const handleStatusChange = async (client: Client, newStatus: 'active' | 'inactive') => {
    const clientRef = doc(db, "clients", client.id);
    try {
        await updateDoc(clientRef, { status: newStatus });
        // No need to update local state, onSnapshot will handle it.
        toast({
            title: "Status do Cliente Atualizado!",
            description: `O cliente ${client.name} foi ${newStatus === 'active' ? 'reativado' : 'desativado'}.`,
        });
    } catch (error) {
        console.error("Error updating client status: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao atualizar status",
            description: "Ocorreu um erro ao alterar o status do cliente.",
        });
    }
  };

  return (
    <>
      <PageHeader title="Clientes" description="Gerencie os clientes da empresa.">
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <NewClientForm onSave={handleAddClient} onFinished={() => setIsNewDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ClientsTable 
          data={clients} 
          onStatusChange={handleStatusChange}
          onUpdateClient={handleUpdateClient}
        />
      )}
    </>
  );
}
