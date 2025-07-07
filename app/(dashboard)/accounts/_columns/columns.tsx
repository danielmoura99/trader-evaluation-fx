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
        <span
          className={`text-${
            client.traderStatus === "Em Curso"
              ? "blue"
              : client.traderStatus === "Aprovado"
                ? "green"
                : client.traderStatus === "Reprovado"
                  ? "red"
                  : "yellow"
          }-500 font-medium`}
        >
          {client.traderStatus}
        </span>
      );
    },
  },
  {
    accessorKey: "isBlocked",
    header: "Bloqueio",
    cell: ({ row }) => {
      const isBlocked = row.getValue("isBlocked");
      return (
        <span className={`text-${isBlocked ? "red" : "green"}-500 font-medium`}>
          {isBlocked ? "Bloqueada" : "Ativa"}
        </span>
      );
    },
  },
  {
    accessorKey: "validatedAt",
    header: "Data de Validação",
    cell: ({ row }) => {
      const date = row.getValue("validatedAt");
      return date
        ? format(new Date(date as string), "dd/MM/yyyy", { locale: ptBR })
        : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const account = row.original;
      return <AccountActionButtons account={account} />;
    },
  },
];
