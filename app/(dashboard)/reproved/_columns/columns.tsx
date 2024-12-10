// app/(dashboard)/reproved/_columns/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Client } from "@/app/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const columns: ColumnDef<Client>[] = [
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
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Telefone",
  },
  {
    accessorKey: "email",
    header: "E-mail",
  },
  {
    accessorKey: "traderStatus",
    header: "Situação",
  },
  {
    accessorKey: "platform",
    header: "Plataforma",
  },
  {
    accessorKey: "plan",
    header: "Plano",
  },
  {
    accessorKey: "cancellationDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Data do Cancelamento
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("cancellationDate");
      if (!date) return "-";
      const dateObj = new Date(date as string);
      const offset = dateObj.getTimezoneOffset();
      const adjustedDate = new Date(dateObj.getTime() + offset * 60 * 1000);
      return format(adjustedDate, "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "contacts",
    header: "Status do Contato",
    cell: ({ row }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contacts = row.getValue("contacts") as any[];
      if (!contacts?.length) return "Sem contato";

      const lastContact = contacts[0];
      return (
        <div className="flex flex-col">
          <span
            className={`inline-block px-2 py-1 rounded text-sm ${
              lastContact.status === "Convertido"
                ? "bg-green-500/10 text-green-500"
                : lastContact.status === "Não Interessado"
                ? "bg-red-500/10 text-red-500"
                : "bg-blue-500/10 text-blue-500"
            }`}
          >
            {lastContact.status}
          </span>
          <span className="text-xs text-zinc-500 mt-1">
            {format(new Date(lastContact.date), "dd/MM/yyyy")}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;

      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined" && window.contactClient) {
              window.contactClient(client);
            }
          }}
          className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
        >
          <Phone className="mr-2 h-4 w-4" />
          Registrar Contato
        </Button>
      );
    },
  },
];
