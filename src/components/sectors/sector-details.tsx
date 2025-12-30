
import type { Sector } from "@/lib/types";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

interface SectorDetailsProps {
    sector: Sector;
}

export function SectorDetails({ sector }: SectorDetailsProps) {
    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <p id="name" className="text-sm text-muted-foreground">{sector.name}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <p id="code" className="text-sm text-muted-foreground">{sector.code}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <p id="description" className="text-sm text-muted-foreground">{sector.description || 'N/A'}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div>
                     <Badge id="status" variant={sector.status === 'active' ? "default" : "destructive"} className="capitalize">{sector.status === 'active' ? 'Ativo' : 'Arquivado'}</Badge>
                </div>
            </div>
        </div>
    );
}
