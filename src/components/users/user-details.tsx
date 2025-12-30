
import type { Sector, User } from "@/lib/types";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

interface UserDetailsProps {
    user: User;
    sectors: Sector[];
}

export function UserDetails({ user, sectors }: UserDetailsProps) {
    const userSectors = sectors.filter(s => user.sectorIds?.includes(s.id));
    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <p id="name" className="text-sm text-muted-foreground">{user.name}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <p id="email" className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <div>
                    <Badge id="role" variant="secondary" className="capitalize">{user.role}</Badge>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div>
                     <Badge id="status" variant={user.status === 'active' ? "default" : "destructive"} className="capitalize">{user.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                </div>
            </div>
            {user.sectorIds && user.sectorIds.length > 0 && userSectors.length > 0 && (
                 <div className="space-y-2">
                    <Label htmlFor="sector">Setor(es)</Label>
                     <div className="flex flex-wrap gap-2">
                        {userSectors.map(sector => (
                            <Badge key={sector.id} variant="outline">{sector.name}</Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
