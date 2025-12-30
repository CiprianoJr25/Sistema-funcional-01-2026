
import type { Client } from "@/lib/types";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

interface ClientDetailsProps {
    client: Client;
}

export function ClientDetails({ client }: ClientDetailsProps) {
    const fullAddress = `${client.address.street}, ${client.address.number || 'S/N'} - ${client.address.neighborhood}, ${client.address.city} - ${client.address.state}`;
    return (
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <p id="name" className="text-sm text-muted-foreground">{client.name}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="document">Documento</Label>
                <p id="document" className="text-sm text-muted-foreground">{client.document || 'N/A'}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <p id="phone" className="text-sm text-muted-foreground">{client.phone}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <p id="address" className="text-sm text-muted-foreground">{fullAddress}</p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <p id="complement" className="text-sm text-muted-foreground">{client.address.complement || 'N/A'}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div>
                     <Badge id="status" variant={client.status === 'active' ? "default" : "destructive"} className="capitalize">{client.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                </div>
            </div>
        </div>
    );
}
