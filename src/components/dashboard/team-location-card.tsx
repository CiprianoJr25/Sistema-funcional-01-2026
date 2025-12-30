
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Technician, User } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Building } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/firebase/config"

export function TeamLocationCard() {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [techSnapshot, userSnapshot] = await Promise.all([
                getDocs(collection(db, "technicians")),
                getDocs(collection(db, "users"))
            ]);
            const techData = techSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician));
            const userData = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setTechnicians(techData);
            setUsers(userData);
        };
        fetchData();
    }, []);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Localização da Equipe em Campo</CardTitle>
                <CardDescription>Status dos técnicos baseado no último check-in realizado no cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {technicians.map(tech => {
                    const user = users.find(u => u.id === tech.userId);
                    return (
                        <div key={tech.id} className="flex items-center">
                            <Avatar>
                                <AvatarImage src={user?.avatarUrl} alt={tech.name} />
                                <AvatarFallback>{getInitials(tech.name)}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                                <p className="font-semibold">{tech.name}</p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Building className="mr-1.5 h-3 w-3" />
                                    <span>Na empresa (Euroinfo)</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
