
import * as React from "react"
import { flexRender, type Header, type Table as TableType } from "@tanstack/react-table"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Custom components from https://github.com/TanStack/table/issues/4352#issuecomment-1629737158
function TableHeaderRow<T>({ header, table }: { header: Header<T, any>; table: TableType<T> }) {
  const { style } = header.column.columnDef
  const stickyStyle =
    header.column.getIsPinned() && style
      ? {
          ...(typeof style === "function" ? style({ header, table }) : style),
          [header.column.getIsPinned() === "left" ? "left" : "right"]: `${header.getStart()}`
        }
      : {}
  return (
    <TableHead
      colSpan={header.colSpan}
      style={stickyStyle}
      className={cn(
        "whitespace-nowrap",
        header.column.getIsPinned() && "sticky z-10 bg-inherit"
      )}
    >
      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
    </TableHead>
  )
}

function TableBodyRow<T>({ table }: { table: TableType<T> }) {
  return (
    <>
      {table.getRowModel().rows.map((row) => (
        <TableRow key={row.id}>
          {row.getVisibleCells().map((cell) => {
            const { style } = cell.column.columnDef
            const stickyStyle =
              cell.column.getIsPinned() && style
                ? {
                    ...(typeof style === "function" ? style({ cell, table }) : style),
                    [cell.column.getIsPinned() === "left" ? "left" : "right"]: `${cell.column.getStart()}`
                  }
                : {}
            return (
              <TableCell key={cell.id} style={stickyStyle} className={cn(cell.column.getIsPinned() && "sticky z-10 bg-inherit")}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            )
          })}
        </TableRow>
      ))}
    </>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableHeaderRow,
  TableBodyRow
}
