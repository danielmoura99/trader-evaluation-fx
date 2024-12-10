import { ColumnDef } from "@tanstack/react-table";
import { Client } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "cpf",
    header: "CPF",
  },
  {
    accessorKey: "platform",
    header: "Plataforma",
  },
  {
    accessorKey: "traderStatus",
    header: "Situação",
    cell: ({ row }) => {
      return (
        <span className="text-yellow-500 font-medium">
          {row.original.traderStatus}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;

      return (
        <Button
          onClick={() => window.startEvaluation(client.id!)}
          variant="outline"
          size="sm"
          className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
        >
          <Play className="h-4 w-4 mr-2" />
          Liberar Plataforma
        </Button>
      );
    },
  },
];
