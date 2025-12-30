
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Sector } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"
import { SectorDetails } from "./sector-details"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog"
import { EditSectorForm, EditSectorFormValues } from "./edit-sector-form"


const ActionsCell = ({ row, onEdit, onStatusChange }: { row: any, onEdit: (sector: Sector) => void, onStatusChange: (sector: Sector, newStatus: 'active' | 'archived') => void }) => {
  const sector = row.original as Sector;
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [actionType, setActionType] = React.useState<'activate' | 'archive' | null>(null);

  const handleActionClick = (type: 'activate' | 'archive') => {
    setActionType(type);
    setIsAlertOpen(true);
  }

  const handleConfirmAction = () => {
    if (actionType) {
      onStatusChange(sector, actionType === 'activate' ? 'active' : 'archived');
    }
    setIsAlertOpen(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(sector.id)}
          >
            Copiar ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onEdit(sector)}>Editar</DropdownMenuItem>
          {sector.status === 'active' ? (
            <DropdownMenuItem onClick={() => handleActionClick('archive')} className="text-destructive focus:text-destructive">
              Arquivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleActionClick('activate')}>
              Reativar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você deseja {actionType === 'activate' ? 'reativar' : 'arquivar'} o setor {sector.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface SectorsTableProps {
    data: Sector[];
    onStatusChange: (sector: Sector, newStatus: 'active' | 'archived') => void;
    onUpdateSector: (sectorId: string, values: EditSectorFormValues) => Promise<boolean>;
}

export function SectorsTable({ data, onStatusChange, onUpdateSector }: SectorsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedSector, setSelectedSector] = React.useState<Sector | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [showArchived, setShowArchived] = React.useState(false);
  
  const filteredData = React.useMemo(() => {
    if (showArchived) return data;
    return data.filter(sector => sector.status === 'active');
  }, [data, showArchived]);
  
  const handleEdit = (sector: Sector) => {
    setSelectedSector(sector);
    setIsEditOpen(true);
  };
  
  const handleSaveEdit = async (sectorId: string, values: EditSectorFormValues) => {
      const success = await onUpdateSector(sectorId, values);
      if (success) {
          setIsEditOpen(false);
      }
  };
  
  const columns: ColumnDef<Sector>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "code",
    header: "Código",
    cell: ({ row }) => <div className="lowercase">{row.getValue("code")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === 'active' ? "default" : "destructive"} className="capitalize">{row.getValue("status") === 'active' ? 'Ativo' : 'Arquivado'}</Badge>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <ActionsCell row={row} onEdit={handleEdit} onStatusChange={onStatusChange} />,
  },
]


  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleRowDoubleClick = (row: any) => {
    setSelectedSector(row.original);
    setIsDetailsOpen(true);
  }

  React.useEffect(() => {
    if (!isDetailsOpen) {
      setSelectedSector(null);
    }
  }, [isDetailsOpen]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filtrar por nome..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
            <Checkbox
                id="show-archived"
                checked={showArchived}
                onCheckedChange={(checked) => setShowArchived(!!checked)}
            />
            <Label htmlFor="show-archived">Mostrar arquivados</Label>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onDoubleClick={() => handleRowDoubleClick(row)}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
      </div>
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Setor</DialogTitle>
            </DialogHeader>
            {selectedSector && <SectorDetails sector={selectedSector} />}
          </DialogContent>
        </Dialog>
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Setor</DialogTitle>
              <DialogDescription>Altere as informações do setor {selectedSector?.name}</DialogDescription>
            </DialogHeader>
            {selectedSector && <EditSectorForm sector={selectedSector} onSave={handleSaveEdit} onFinished={() => setIsEditOpen(false)} />}
          </DialogContent>
        </Dialog>
    </div>
  )
}
