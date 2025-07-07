/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/accounts/_components/accounts-table.tsx
"use client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { NelogicaAccount } from "../_actions";
import { columns } from "../_columns/columns";

interface AccountsTableProps {
  accounts: NelogicaAccount[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AccountsTable({
  accounts,
  isLoading,
  onRefresh,
}: AccountsTableProps) {
  // Se isLoading for true, podemos mostrar algum indicador de carregamento
  // ou passar isso para o DataTable se ele suportar

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
      <DataTable columns={columns} data={accounts} searchColumn="account" />
    </div>
  );
}
