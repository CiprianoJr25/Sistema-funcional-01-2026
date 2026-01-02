
"use client"

import { useState, useEffect, useMemo } from "react";
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
import { NewTechnicianForm, NewTechnicianFormValues } from "@/components/technicians/new-technician-form";
import { TechniciansTable } from "@/components/technicians/technicians-table";
import { Technician, Sector, User, ModulePermissions, UserStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, doc, setDoc, updateDoc, writeBatch, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/hooks/use-auth";
import { TechniciansFilterBar } from "@/components/technicians/technicians-filter-bar";
import { EditTechnicianFormValues } from "@/components/technicians/edit-technician-form";


export default function TechniciansPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const { toast } = useToast();
  const { user: adminUser } = useAuth(); 
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!adminUser) {
        setLoading(false);
        return;
    };
    setLoading(true);

    const unsubTechnicians = onSnapshot(collection(db, "technicians"), 
        (snapshot) => {
            const techsData = snapshot.docs.map(doc => doc.data() as Omit<Technician, 'id'> & { id: string });
            updateTechnicians(techsData, allUsers);
        }, 
        (error) => {
            console.error("Error fetching technicians:", error);
            setTechnicians([]);
        }
    );

    const unsubUsers = onSnapshot(collection(db, "users"), 
        (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setAllUsers(usersData);
            // Re-run technician update logic when users change
            getDocs(collection(db, "technicians")).then(techSnapshot => {
                const techsData = techSnapshot.docs.map(doc => doc.data() as Omit<Technician, 'id'> & { id: string });
                updateTechnicians(techsData, usersData);
            });
        }, 
        (error) => {
            console.error("Error fetching users:", error);
            setAllUsers([]);
        }
    );
    
    const unsubSectors = onSnapshot(collection(db, "sectors"),
        (snapshot) => setSectors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sector))),
        (error) => {
            console.error("Error fetching sectors:", error);
            setSectors([]);
        }
    );

    // Initial load might be fast, but give it a moment to avoid flashing loaders
    const timer = setTimeout(() => setLoading(false), 1000);

    return () => {
        unsubTechnicians();
        unsubUsers();
        unsubSectors();
        clearTimeout(timer);
    };
}, [adminUser]);

const updateTechnicians = (techsData: (Omit<Technician, 'id'> & { id: string })[], usersData: User[]) => {
    if (!adminUser) return;

    const combinedTechnicians = techsData.map(techData => {
        const correspondingUser = usersData.find(u => u.id === techData.id);
        return {
            ...techData,
            sectorIds: correspondingUser?.sectorIds || [],
            status: correspondingUser?.status || techData.status,
            name: correspondingUser?.name || techData.name,
            email: correspondingUser?.email || techData.email,
            phone: correspondingUser?.phone,
        };
    });

    let visibleTechnicians = combinedTechnicians;
    if (adminUser.role === 'encarregado') {
        const userSectorIds = adminUser.sectorIds || [];
        visibleTechnicians = userSectorIds.length > 0 
            ? combinedTechnicians.filter(tech => tech.sectorIds.some(techSectorId => userSectorIds.includes(techSectorId)))
            : [];
    } else if (adminUser.role === 'tecnico') {
        visibleTechnicians = [];
    }
    
    setTechnicians(visibleTechnicians);
};

  
  const filteredTechnicians = useMemo(() => {
    if (sectorFilter === 'all') {
        return technicians;
    }
    return technicians.filter(tech => tech.sectorIds && tech.sectorIds.includes(sectorFilter));
  }, [technicians, sectorFilter]);


  const handleAddTechnician = async (values: NewTechnicianFormValues) => {
    if (!adminUser) {
        toast({ variant: 'destructive', title: "Erro de autenticação", description: "Administrador não está logado."});
        return;
    }
    
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUserId = userCredential.user.uid;
      
      const newUser: User = {
        id: newUserId,
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: 'tecnico',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        avatarUrl: "",
        sectorIds: [values.sectorId],
        euroInfoId: values.euroInfoId,
        rondoInfoId: values.rondoInfoId,
      };
      await setDoc(doc(db, "users", newUserId), newUser);
      
      const newTechnician: Omit<Technician, 'id'> = {
        userId: newUserId,
        name: values.name,
        email: values.email,
        status: 'active',
        sectorIds: [values.sectorId],
        euroInfoId: values.euroInfoId,
        rondoInfoId: values.rondoInfoId,
      };
      // The ID for the technician document is the same as the user ID
      await setDoc(doc(db, "technicians", newUserId), newTechnician);
      
      setIsDialogOpen(false);
      toast({
        title: "Técnico Criado com Sucesso!",
        description: `${values.name} já pode acessar o sistema.`
      });

    } catch (error: any) {
      console.error("Error adding technician:", error);
      const errorMessage = error.code === 'auth/email-already-in-use' 
            ? "Este email já está em uso por outra conta."
            : "Ocorreu um erro ao criar o técnico.";
      toast({
        variant: "destructive",
        title: "Erro ao criar técnico",
        description: errorMessage,
      });
    }
  };
  
    const handleUpdateTechnician = async (technicianId: string, values: EditTechnicianFormValues) => {
    const batch = writeBatch(db);
    const techRef = doc(db, "technicians", technicianId);
    const userRef = doc(db, "users", technicianId);

    const updateData = {
        name: values.name,
        phone: values.phone,
        sectorIds: values.sectorIds,
        euroInfoId: values.euroInfoId,
        rondoInfoId: values.rondoInfoId,
        updatedAt: new Date().toISOString(),
    };
    
    batch.update(userRef, updateData);
    batch.update(techRef, { 
        name: values.name, 
        sectorIds: values.sectorIds,
        euroInfoId: values.euroInfoId,
        rondoInfoId: values.rondoInfoId,
    });

    try {
        await batch.commit();
        toast({ title: "Técnico atualizado com sucesso!" });
        return true;
    } catch (error) {
        console.error("Error updating technician:", error);
        toast({ variant: "destructive", title: "Erro ao atualizar técnico" });
        return false;
    }
  };

  const handleUpdatePermissions = async (userId: string, permissions: Partial<ModulePermissions>) => {
    const userDocRef = doc(db, "users", userId);
    try {
        await updateDoc(userDocRef, {
            permissions,
            updatedAt: new Date().toISOString(),
        });
        toast({ title: "Permissões atualizadas com sucesso!" });
    } catch (error) {
        console.error("Error updating permissions:", error);
        toast({ variant: "destructive", title: "Erro ao salvar permissões" });
    }
  };
  
  const handleStatusChange = async (technician: Technician, newStatus: UserStatus) => {
    const batch = writeBatch(db);
    const techRef = doc(db, "technicians", technician.id);
    const userRef = doc(db, "users", technician.id);

    batch.update(techRef, { status: newStatus });
    batch.update(userRef, { status: newStatus });

    try {
        await batch.commit();
        toast({
            title: "Status do Técnico Atualizado!",
            description: `O técnico ${technician.name} foi ${newStatus === 'active' ? 'reativado' : 'desativado'}.`,
        });
    } catch (error) {
        console.error("Error updating technician status:", error);
        toast({
            variant: "destructive",
            title: "Erro ao atualizar status",
        });
    }
  };


  return (
    <>
      <PageHeader title="Técnicos" description="Gerencie os técnicos internos e externos.">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Técnico
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Técnico</DialogTitle>
            </DialogHeader>
            <NewTechnicianForm sectors={sectors} onSave={handleAddTechnician} onFinished={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

       <div className="py-4">
        <TechniciansFilterBar
          allSectors={sectors}
          currentUser={adminUser}
          sectorFilter={sectorFilter}
          onSectorChange={setSectorFilter}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <TechniciansTable 
          data={filteredTechnicians} 
          sectors={sectors} 
          onDataChange={setTechnicians} 
          onSavePermissions={handleUpdatePermissions}
          onStatusChange={handleStatusChange}
          onUpdateTechnician={handleUpdateTechnician}
        />
      )}
    </>
  );
}
