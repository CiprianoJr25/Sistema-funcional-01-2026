
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
import { collection, getDocs, doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
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
    const fetchData = async () => {
      if (!adminUser) return;
      setLoading(true);
      
      try {
        const [techSnapshot, sectorsSnapshot, usersSnapshot] = await Promise.all([
          getDocs(collection(db, "technicians")),
          getDocs(collection(db, "sectors")),
          getDocs(collection(db, "users")),
        ]);
        
        const sectorsData = sectorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sector));
        const allUsersData = usersSnapshot.docs.map(doc => {
            const user = { id: doc.id, ...doc.data() } as User;
             // Compatibility layer: ensure sectorIds exists
            if ((user as any).sectorId && !user.sectorIds) {
                user.sectorIds = [(user as any).sectorId];
            } else if (!user.sectorIds) {
                user.sectorIds = [];
            }
            return user;
        });

        setSectors(sectorsData);
        setAllUsers(allUsersData);
        
        // Combine tech data with user data for a complete profile
        const combinedTechnicians = techSnapshot.docs.map(doc => {
            const techData = doc.data() as Omit<Technician, 'id'>;
            const correspondingUser = allUsersData.find(u => u.id === doc.id);
            return {
                id: doc.id,
                ...techData,
                // Ensure fields from 'users' collection are the source of truth
                sectorIds: correspondingUser?.sectorIds || [],
                status: correspondingUser?.status || techData.status,
                name: correspondingUser?.name || techData.name,
                email: correspondingUser?.email || techData.email,
                phone: correspondingUser?.phone || (techData as any).phone,
            };
        });

        // Apply visibility filter based on user role
        let visibleTechnicians = combinedTechnicians;
        if (adminUser.role === 'encarregado') {
          const userSectorIds = adminUser.sectorIds || [];
          if (userSectorIds.length > 0) {
            visibleTechnicians = combinedTechnicians.filter(tech => 
              tech.sectorIds && tech.sectorIds.some(techSectorId => userSectorIds.includes(techSectorId))
            );
          } else {
            visibleTechnicians = []; // Encarregado with no sectors sees no one
          }
        } else if (adminUser.role === 'tecnico') {
          visibleTechnicians = []; // Technicians should not see this page's content
        }
        
        setTechnicians(visibleTechnicians);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ variant: 'destructive', title: "Erro ao buscar dados" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [adminUser, toast]);
  
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
      };
      await setDoc(doc(db, "users", newUserId), newUser);
      
      const newTechnician: Omit<Technician, 'id'> = {
        userId: newUserId,
        name: values.name,
        email: values.email,
        status: 'active',
        sectorIds: [values.sectorId]
      };
      await setDoc(doc(db, "technicians", newUserId), newTechnician);
      
      let shouldAddToState = false;
      if (adminUser.role === 'admin' || adminUser.role === 'gerente') {
        shouldAddToState = true;
      } else if (adminUser.role === 'encarregado') {
        if (adminUser.sectorIds?.includes(values.sectorId)) {
           shouldAddToState = true;
        }
      }
      
      if (shouldAddToState) {
        setTechnicians(prev => [{ ...newUser, ...newTechnician, phone: values.phone } as Technician, ...prev]);
      }

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
        updatedAt: new Date().toISOString(),
    };
    
    batch.update(userRef, updateData);
    batch.update(techRef, { name: values.name, sectorIds: values.sectorIds });

    try {
        await batch.commit();
        setTechnicians(prev => prev.map(t => t.id === technicianId ? { ...t, ...values } : t));
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
        setTechnicians(prev => prev.map(t => t.id === technician.id ? { ...t, status: newStatus } : t));
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
