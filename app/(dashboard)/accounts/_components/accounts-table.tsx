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
import { NelogicaAccount } from "../_actions";
import { AccountActionButtons } from "./account-action-buttons";

interface AccountsTableProps {
  accounts: NelogicaAccount[];
  isLoading: boolean;
  onRefresh: () => void; // Nova prop para forçar atualização
}

export function AccountsTable({
  accounts,
  isLoading,
  onRefresh,
}: AccountsTableProps) {
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
              <TableHead className="text-zinc-400">Conta</TableHead>
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Cliente</TableHead>
              <TableHead className="text-zinc-400">Plano</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Bloqueio</TableHead>
              <TableHead className="text-zinc-400">Data de Validação</TableHead>
              <TableHead className="text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-zinc-500"
                >
                  Carregando contas...
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-zinc-500"
                >
                  Nenhuma conta encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow
                  key={account.account}
                  className="hover:bg-zinc-800/50"
                >
                  <TableCell className="font-mono text-sm text-zinc-100">
                    {account.account}
                  </TableCell>
                  <TableCell className="text-zinc-100">
                    {account.name}
                  </TableCell>
                  <TableCell>
                    {account.client ? (
                      <div>
                        <div className="text-zinc-100">
                          {account.client.name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {account.client.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Não associado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-100">
                    {account.client ? account.client.plan : "N/A"}
                  </TableCell>
                  <TableCell>
                    {account.client ? (
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                          account.client.traderStatus === "Em Curso"
                            ? "bg-blue-500/20 text-blue-400"
                            : account.client.traderStatus === "Aprovado"
                              ? "bg-green-500/20 text-green-400"
                              : account.client.traderStatus === "Reprovado"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {account.client.traderStatus}
                      </div>
                    ) : (
                      <span className="text-zinc-500">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                        account.isBlocked
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {account.isBlocked ? "Bloqueada" : "Ativa"}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-100">
                    {account.validatedAt
                      ? new Date(account.validatedAt).toLocaleDateString(
                          "pt-BR"
                        )
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AccountActionButtons
                        account={account}
                        onAccountUpdated={onRefresh} // Passa a função de atualização
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
