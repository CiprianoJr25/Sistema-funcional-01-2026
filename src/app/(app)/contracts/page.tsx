
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
import { ServiceContract, Client, Sector } from "@/lib/types";
import { collection, addDoc, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ContractsTable } from "@/components/contracts/contracts-table";
import { NewContractForm, NewContractFormValues } from "@/components/contracts/new-contract-form";
import { EditContractForm, EditContractFormValues } from "@/components/contracts/edit-contract-form";

export default function ContractsPage() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsubContracts = onSnapshot(collection(db, "serviceContracts"), 
      (querySnapshot) => {
        setContracts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceContract)));
        if (!clients.length || !sectors.length) return;
        setLoading(false);
      }, 
      (error) => {
        console.error("Error fetching contracts:", error);
        toast({ variant: 'destructive', title: "Erro ao buscar contratos"});
        setLoading(false);
      }
    );
    
    const unsubClients = onSnapshot(collection(db, "clients"), 
      (querySnapshot) => {
        setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        if (!contracts.length || !sectors.length) return;
        setLoading(false);
      }
    );
    
    const unsubSectors = onSnapshot(collection(db, "sectors"), 
      (querySnapshot) => {
        setSectors(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sector)));
        if (!contracts.length || !clients.length) return;
        setLoading(false);
      }
    );

    return () => {
        unsubContracts();
        unsubClients();
        unsubSectors();
    }
  }, [toast, clients.length, sectors.length, contracts.length]);

  const handleAddContract = async (values: NewContractFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: "Erro de Autenticação"});
        return;
    }
    const client = clients.find(c => c.id === values.clientId);
    if (!client) {
        toast({ variant: 'destructive', title: "Cliente não encontrado"});
        return;
    }
    try {
      const newContractData: Omit<ServiceContract, 'id'> = {
        clientId: values.clientId,
        clientName: client.name,
        sectorIds: values.sectorIds,
        frequencyDays: values.frequencyDays,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await addDoc(collection(db, "serviceContracts"), newContractData);
      
      toast({
        title: "Contrato adicionado com sucesso!",
        description: `O contrato para ${client.name} foi criado.`,
      });
      setIsNewDialogOpen(false);

    } catch (error) {
      console.error("Error adding contract: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar contrato",
        description: "Ocorreu um erro ao salvar os dados. Tente novamente.",
      });
    }
  };

  const handleUpdateContract = async (contractId: string, values: EditContractFormValues) => {
    const contractRef = doc(db, "serviceContracts", contractId);
    try {
        const updatedData = { 
            ...values,
            updatedAt: new Date().toISOString(),
        };
        await updateDoc(contractRef, updatedData);
        toast({ title: "Contrato atualizado com sucesso!" });
        return true;
    } catch (error) {
        console.error("Error updating contract: ", error);
        toast({ variant: 'destructive', title: "Erro ao atualizar contrato" });
        return false;
    }
  };
  
  const handleStatusChange = async (contract: ServiceContract, newStatus: 'active' | 'inactive') => {
    const contractRef = doc(db, "serviceContracts", contract.id);
    try {
        await updateDoc(contractRef, { status: newStatus });
        toast({
            title: "Status do Contrato Atualizado!",
            description: `O contrato para ${contract.clientName} foi ${newStatus === 'active' ? 'reativado' : 'desativado'}.`,
        });
    } catch (error) {
        console.error("Error updating contract status: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao atualizar status",
            description: "Ocorreu um erro ao alterar o status do contrato.",
        });
    }
  };

  return (
    <>
      <PageHeader title="Contratos de Serviço" description="Gerencie os contratos de manutenção preventiva dos clientes.">
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Novo Contrato de Serviço</DialogTitle>
            </DialogHeader>
            <NewContractForm 
                clients={clients.filter(c => c.status === 'active')} 
                sectors={sectors.filter(s => s.status === 'active')}
                onSave={handleAddContract} 
                onFinished={() => setIsNewDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </PageHeader>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ContractsTable 
          data={contracts}
          sectors={sectors}
          onStatusChange={handleStatusChange}
          onUpdateContract={handleUpdateContract}
        />
      )}
    </>
  );
}
