
"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Columns, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ExternalTicket, Sector, Technician, User } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { useRouter } from "next/navigation"
import { Badge } from "../ui/badge"
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ptBR } from 'date-fns/locale';

const ActionsCell = ({ row }: { row: any }) => {
  const ticket = row.original as ExternalTicket
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => router.push(`/external-tickets/${ticket.id}`)}>
            Ver Detalhes
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(ticket.id)}
        >
          Copiar ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const getColumns = (sectors: Sector[], technicians: Technician[], users: User[]): ColumnDef<ExternalTicket>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="uppercase font-mono text-xs">{row.original.id}</div>,
  },
  {
    accessorKey: "client.name",
    header: "Cliente",
    cell: ({ row }) => <div>{row.original.client.name}</div>,
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.description}</div>,
  },
  {
    accessorKey: "sectorId",
    header: "Setor",
    cell: ({ row }) => {
      const sector = sectors.find(s => s.id === row.getValue("sectorId"))
      return <div>{sector?.name || 'N/A'}</div>
    },
  },
  {
    accessorKey: "technicianId",
    header: "Técnico",
    cell: ({ row }) => {
      const technicianId = row.getValue("technicianId") as string;
      const technician = technicians.find(t => t.id === technicianId) || users.find(u => u.id === technicianId);
      return <div>{technician?.name || 'N/A'}</div>
    },
  },
   {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <Badge variant="outline" className="capitalize">{type}</Badge>
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Data de Abertura
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{format(new Date(row.getValue("createdAt")), "dd/MM/yyyy")}</div>
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Data de Conclusão
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{format(new Date(row.getValue("updatedAt")), "dd/MM/yyyy")}</div>
    },
  },
  {
    id: "actions",
    cell: ActionsCell,
    enableHiding: false,
  },
]

interface HistoryTableProps {
    data: ExternalTicket[];
    technicians: Technician[];
    sectors: Sector[];
    users: User[];
    columnVisibility: VisibilityState;
    onColumnVisibilityChange: React.Dispatch<React.SetStateAction<VisibilityState>>;
}

const columnMapping: Record<string, string> = {
    id: "ID",
    "client.name": "Cliente",
    description: "Descrição",
    sectorId: "Setor",
    technicianId: "Técnico",
    type: "Tipo",
    createdAt: "Data de Abertura",
    updatedAt: "Data de Conclusão",
};

export function HistoryTable({ 
    data, 
    technicians, 
    sectors, 
    users, 
    columnVisibility,
    onColumnVisibilityChange 
}: HistoryTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
      { id: "updatedAt", desc: true }
  ])

  const columns = React.useMemo(() => getColumns(sectors, technicians, users), [sectors, technicians, users]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange,
    state: {
      sorting,
      columnVisibility,
    },
  })

  const getFormattedDataForExport = () => {
    const visibleColumnKeys = Object.keys(columnVisibility).filter(
      key => columnVisibility[key]
    ).concat(columns.filter(c => c.id && c.enableHiding === false).map(c => c.id!));
    
    let activeColumns = table.getVisibleLeafColumns().map(c => c.id);
    
    return data.map(ticket => {
        const technician = technicians.find(t => t.id === ticket.technicianId) || users.find(u => u.id === ticket.technicianId);
        const sector = sectors.find(s => s.id === ticket.sectorId);
        
        const row: Record<string, any> = {};

        activeColumns.forEach(key => {
            const header = columnMapping[key] || key;
             if (header && header !== 'actions') {
                 switch (key) {
                    case 'id': row[header] = ticket.id; break;
                    case 'client.name': row[header] = ticket.client.name; break;
                    case 'description': row[header] = ticket.description; break;
                    case 'sectorId': row[header] = sector?.name || 'N/A'; break;
                    case 'technicianId': row[header] = technician?.name || 'N/A'; break;
                    case 'type': row[header] = ticket.type; break;
                    case 'createdAt': row[header] = format(new Date(ticket.createdAt), "dd/MM/yyyy"); break;
                    case 'updatedAt': row[header] = format(new Date(ticket.updatedAt), "dd/MM/yyyy"); break;
                    default: break;
                }
            }
        });

        return row;
    });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableData = getFormattedDataForExport();
    if(tableData.length === 0) return;

    const tableColumn = Object.keys(tableData[0]);
    const tableRows = tableData.map(row => Object.values(row));
    const pageContent = (data: any) => {
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text("Relatório de Histórico de Atendimentos", data.settings.margin.left, 22);

        doc.setFontSize(8);
        const footerText = `© EuroInfo | Desenvolvido por Incode Dev`;
        const footerX = data.settings.margin.left;
        const footerY = doc.internal.pageSize.height - 10;
        doc.text(footerText, footerX, footerY);
        doc.text(`Página ${data.pageNumber} de ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.width - data.settings.margin.right - 10, footerY);
    };

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 32,
        didDrawPage: pageContent,
        margin: { top: 30 }
    });
    doc.save("historico_atendimentos.pdf");
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(getFormattedDataForExport());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");
    XLSX.writeFile(workbook, "historico_atendimentos.xlsx");
  };

  return (
    <div className="w-full">
      <div className="flex justify-between py-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} disabled={data.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exportar para PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={data.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exportar para Excel
            </Button>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Columns className="mr-2 h-4 w-4" />
                    Colunas
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                    .getAllColumns()
                    .filter(
                        (column) => column.getCanHide()
                    )
                    .map((column) => {
                        const header = column.columnDef.header;
                        const headerText = typeof header === 'string' ? header : column.id;
                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) =>
                                    column.toggleVisibility(!!value)
                                }
                            >
                                {headerText}
                            </DropdownMenuCheckboxItem>
                        )
                    })
                }
            </DropdownMenuContent>
        </DropdownMenu>
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum atendimento encontrado com os filtros selecionados.
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
    </div>
  )
}
