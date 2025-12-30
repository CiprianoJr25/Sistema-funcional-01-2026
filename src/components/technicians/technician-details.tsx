
import type { Sector, Technician } from "@/lib/types";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

interface TechnicianDetailsProps {
    technician: Technician;
    sectors: Sector[];
}

export function TechnicianDetails({ technician, sectors }: TechnicianDetailsProps) {
    const technicianSectors = sectors.filter(s => technician.sectorIds.includes(s.id));
    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <p id="name" className="text-sm text-muted-foreground">{technician.name}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <p id="email" className="text-sm text-muted-foreground">{technician.email}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="sector">Setor(es)</Label>
                 <div id="sector" className="flex flex-wrap gap-2">
                    {technicianSectors.length > 0 ? (
                        technicianSectors.map(sector => (
                            <Badge key={sector.id} variant="secondary">{sector.name}</Badge>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">N/A</p>
                    )}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div>
                     <Badge id="status" variant={technician.status === 'active' ? "default" : "destructive"} className="capitalize">{technician.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                </div>
            </div>
        </div>
    );
}
