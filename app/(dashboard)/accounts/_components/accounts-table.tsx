// app/(dashboard)/accounts/_components/accounts-table.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { columns } from "../_columns/columns";
import { NelogicaAccount } from "../_actions";

interface AccountsTableProps {
  accounts: NelogicaAccount[];
  isLoading: boolean;
}

export function AccountsTable({ accounts, isLoading }: AccountsTableProps) {
  const [filter, setFilter] = useState("");

  // Filtrar contas
  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.account.toLowerCase().includes(filter.toLowerCase()) ||
      acc.name.toLowerCase().includes(filter.toLowerCase()) ||
      acc.client?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      acc.client?.email?.toLowerCase().includes(filter.toLowerCase()) ||
      acc.client?.cpf?.includes(filter)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Input
          placeholder="Filtrar por conta, nome, cliente..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm bg-zinc-800 border-zinc-700"
        />
      </div>

      <div className="rounded-md border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-zinc-800/50">
              {columns.map((column) => (
                <TableHead
                  key={
                    typeof column.header === "string"
                      ? column.header
                      : column.id
                  }
                  className="text-zinc-400"
                >
                  {typeof column.header === "string"
                    ? column.header
                    : column.id}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-zinc-500"
                >
                  Carregando contas...
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-zinc-500"
                >
                  Nenhuma conta encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((acc) => (
                <TableRow key={acc.account} className="hover:bg-zinc-800/50">
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {column.cell
                        ? column.cell({
                            row: {
                              original: acc,
                              getValue: (key) =>
                                acc[key as keyof NelogicaAccount],
                            },
                          })
                        : acc[column.accessorKey as keyof NelogicaAccount]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
