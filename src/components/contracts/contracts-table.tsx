
"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
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
import type { ServiceContract, Sector } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { EditContractForm, EditContractFormValues } from "./edit-contract-form"
import { format } from "date-fns"

type ActionType = 'activate' | 'deactivate';

const ActionsCell = ({ row, onStatusChange, onEdit }: { row: any, onStatusChange: (contract: ServiceContract, status: 'active' | 'inactive') => void, onEdit: (contract: ServiceContract) => void }) => {
  const contract = row.original as ServiceContract
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [actionType, setActionType] = React.useState<ActionType | null>(null);

  const handleActionClick = (type: ActionType) => {
    setActionType(type);
    setIsAlertOpen(true);
  }

  const handleConfirmAction = () => {
    if (actionType) {
      onStatusChange(contract, actionType === 'activate' ? 'active' : 'inactive');
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
          <DropdownMenuItem onClick={() => onEdit(contract)}>Editar Contrato</DropdownMenuItem>
          <DropdownMenuSeparator />
          {contract.status === 'active' ? (
              <DropdownMenuItem onClick={() => handleActionClick('deactivate')} className="text-destructive focus:text-destructive">
                  Desativar
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
              Você deseja {actionType === 'activate' ? 'reativar' : 'desativar'} o contrato para o cliente {contract.clientName}?
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

interface ContractsTableProps {
    data: ServiceContract[];
    sectors: Sector[];
    onStatusChange: (contract: ServiceContract, status: 'active' | 'inactive') => void;
    onUpdateContract: (contractId: string, values: EditContractFormValues) => Promise<boolean>;
}

export function ContractsTable({ data, sectors, onStatusChange, onUpdateContract }: ContractsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'clientName', desc: false }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedContract, setSelectedContract] = React.useState<ServiceContract | null>(null);
  const [showInactive, setShowInactive] = React.useState(false);

  const handleEdit = (contract: ServiceContract) => {
    setSelectedContract(contract);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (contractId: string, values: EditContractFormValues) => {
      const success = await onUpdateContract(contractId, values);
      if (success) {
          setIsEditOpen(false);
      }
  };

  const tableColumns = React.useMemo(() => {
    const columns: ColumnDef<ServiceContract>[] = [
      {
        accessorKey: "clientName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cliente
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="capitalize">{row.getValue("clientName")}</div>,
      },
      {
        accessorKey: "frequencyDays",
        header: "Frequência",
        cell: ({ row }) => <div>{row.getValue("frequencyDays")} dias</div>,
      },
      {
        accessorKey: "sectorIds",
        header: "Setores",
        cell: ({ row }) => {
            const sectorIds = row.getValue("sectorIds") as string[];
            const sectorNames = sectorIds.map(id => sectors.find(s => s.id === id)?.name).filter(Boolean);
            return (
                <div className="flex flex-wrap gap-1">
                    {sectorNames.map(name => <Badge key={name} variant="secondary">{name}</Badge>)}
                </div>
            )
        }
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.getValue("status") === 'active' ? "default" : "destructive"} className="capitalize">{row.getValue("status") === 'active' ? 'Ativo' : 'Inativo'}</Badge>
        ),
      },
       {
        accessorKey: "createdAt",
        header: "Criado em",
        cell: ({ row }) => <div>{format(new Date(row.getValue("createdAt")), "dd/MM/yyyy")}</div>,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => <ActionsCell row={row} onStatusChange={onStatusChange} onEdit={handleEdit} />,
      },
    ];
    return columns;
  }, [onStatusChange, sectors]);

  const filteredData = React.useMemo(() => {
    if (showInactive) return data;
    return data.filter(contract => contract.status === 'active');
  }, [data, showInactive]);

  const table = useReactTable({
    data: filteredData,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filtrar por cliente..."
          value={(table.getColumn("clientName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("clientName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
            <Checkbox
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={(checked) => setShowInactive(!!checked)}
            />
            <Label htmlFor="show-inactive">Mostrar inativos</Label>
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
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
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  Nenhum contrato encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar Contrato de Serviço</DialogTitle>
              <DialogDescription>Altere as informações do contrato para {selectedContract?.clientName}.</DialogDescription>
            </DialogHeader>
            {selectedContract && <EditContractForm 
                contract={selectedContract} 
                sectors={sectors}
                onSave={handleSaveEdit} 
                onFinished={() => setIsEditOpen(false)} />}
          </DialogContent>
        </Dialog>
    </div>
  )
}
