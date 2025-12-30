
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sector, User } from "@/lib/types";
import { useMemo } from "react";
import { Badge } from "../ui/badge";

interface LocationFilterBarProps {
    allSectors: Sector[];
    currentUser: User | null;
    sectorFilter: string;
    onSectorChange: (sectorId: string) => void;
}

export function LocationFilterBar({
    allSectors,
    currentUser,
    sectorFilter,
    onSectorChange
}: LocationFilterBarProps) {

    const canFilterBySector = useMemo(() => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin' || currentUser.role === 'gerente') return true;
        if (currentUser.role === 'encarregado' && (currentUser.sectorIds?.length ?? 0) > 0) return true;
        return false;
    }, [currentUser]);
    
    const visibleSectors = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'encarregado') {
            return allSectors.filter(sector => currentUser.sectorIds?.includes(sector.id));
        }
        return allSectors;
    }, [currentUser, allSectors]);


    if (!canFilterBySector) {
        return null; // Don't render the filter bar if it's not needed
    }

    return (
         <div className="flex items-center gap-4 rounded-lg border bg-card p-3 w-fit">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filtrar por Setor:</span>
                <Select value={sectorFilter} onValueChange={onSectorChange}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Selecione um setor..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Setores</SelectItem>
                        {visibleSectors.map(sector => (
                            <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
