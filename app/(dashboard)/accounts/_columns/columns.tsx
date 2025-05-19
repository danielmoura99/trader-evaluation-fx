// app/(dashboard)/accounts/_columns/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NelogicaAccount } from "../_actions";
import { AccountActionButtons } from "../_components/account-action-buttons";

export const columns: ColumnDef<NelogicaAccount>[] = [
  {
    accessorKey: "account",
    header: "Conta",
    cell: ({ row }) => {
      return (
        <div className="font-mono text-sm text-zinc-100">
          {row.getValue("account")}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      return <div className="text-zinc-100">{row.getValue("name")}</div>;
    },
  },
  {
    accessorKey: "client",
    header: "Cliente",
    cell: ({ row }) => {
      const client = row.original.client;
      return (
        <div>
          {client ? (
            <div>
              <div className="text-zinc-100">{client.name}</div>
              <div className="text-xs text-zinc-500">{client.email}</div>
            </div>
          ) : (
            <span className="text-zinc-500">Não associado</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "plan",
    header: "Plano",
    cell: ({ row }) => {
      const client = row.original.client;
      return (
        <div className="text-zinc-100">{client ? client.plan : "N/A"}</div>
      );
    },
  },
  {
    accessorKey: "traderStatus",
    header: "Status",
    cell: ({ row }) => {
      const client = row.original.client;
      if (!client) return <span className="text-zinc-500">N/A</span>;

      return (
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${
            client.traderStatus === "Em Curso"
              ? "bg-blue-500/20 text-blue-400"
              : client.traderStatus === "Aprovado"
                ? "bg-green-500/20 text-green-400"
                : client.traderStatus === "Reprovado"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {client.traderStatus}
        </div>
      );
    },
  },
  {
    accessorKey: "isBlocked",
    header: "Bloqueio",
    cell: ({ row }) => {
      const isBlocked = row.getValue("isBlocked");
      return (
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${
            isBlocked
              ? "bg-red-500/20 text-red-400"
              : "bg-green-500/20 text-green-400"
          }`}
        >
          {isBlocked ? "Bloqueada" : "Ativa"}
        </div>
      );
    },
  },
  {
    accessorKey: "validatedAt",
    header: "Data de Validação",
    cell: ({ row }) => {
      const date = row.getValue("validatedAt");
      if (!date) return <span className="text-zinc-500">N/A</span>;

      return (
        <div className="text-zinc-100">
          {format(new Date(date as string), "dd/MM/yyyy", {
            locale: ptBR,
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <AccountActionButtons account={row.original} />;
    },
  },
];
