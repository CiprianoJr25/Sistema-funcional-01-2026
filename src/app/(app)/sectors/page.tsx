
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
import { NewSectorForm, NewSectorFormValues } from "@/components/sectors/new-sector-form";
import { SectorsTable } from "@/components/sectors/sectors-table";
import { Sector } from "@/lib/types";
import { collection, addDoc, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { EditSectorForm, EditSectorFormValues } from "@/components/sectors/edit-sector-form";


export default function SectorsPage() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "sectors"), 
      (snapshot) => {
        const sectorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sector));
        setSectors(sectorsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching sectors in real-time:", error);
        toast({ variant: 'destructive', title: "Erro ao buscar setores"});
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const handleAddSector = async (values: NewSectorFormValues) => {
    try {
        const newSectorData: Omit<Sector, 'id'> = {
            ...values,
            status: 'active'
        };
        const docRef = await addDoc(collection(db, "sectors"), newSectorData);
        // No need to update state, onSnapshot will handle it.
        toast({ title: "Setor adicionado com sucesso!" });
        setIsNewDialogOpen(false);
    } catch (error) {
        console.error("Error adding sector: ", error);
        toast({ variant: 'destructive', title: "Erro ao adicionar setor" });
    }
  };

  const handleUpdateSector = async (sectorId: string, values: EditSectorFormValues) => {
    const sectorRef = doc(db, "sectors", sectorId);
    try {
        await updateDoc(sectorRef, values);
        toast({ title: "Setor atualizado com sucesso!" });
        return true; // Indicate success to close dialog
    } catch (error) {
        console.error("Error updating sector: ", error);
        toast({ variant: 'destructive', title: "Erro ao atualizar setor" });
        return false;
    }
  };
  
  const handleStatusChange = async (sector: Sector, newStatus: 'active' | 'archived') => {
    const sectorRef = doc(db, "sectors", sector.id);
    try {
        await updateDoc(sectorRef, { status: newStatus });
        toast({
            title: "Status do Setor Atualizado!",
            description: `O setor ${sector.name} foi ${newStatus === 'active' ? 'reativado' : 'arquivado'}.`,
        });
    } catch (error) {
        console.error("Error updating sector status: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao atualizar status",
        });
    }
  };

  return (
    <>
      <PageHeader title="Setores" description="Gerencie os setores da empresa.">
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Setor</DialogTitle>
            </DialogHeader>
            <NewSectorForm onSave={handleAddSector} onFinished={() => setIsNewDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>
      {loading ? (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      ) : (
        <SectorsTable 
            data={sectors} 
            onStatusChange={handleStatusChange}
            onUpdateSector={handleUpdateSector}
        />
      )}
    </>
  );
}
