import { ColumnDef } from "@tanstack/react-table";
import { Client } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Square } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "plan",
    header: "Plano",
  },
  {
    accessorKey: "traderStatus",
    header: "Situação",
    cell: ({ row }) => {
      return (
        <span className="text-blue-500 font-medium">
          {row.original.traderStatus}
        </span>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: "Data Início",
    cell: ({ row }) => {
      const date = row.getValue("startDate");
      if (!date) return "-";

      // Ajusta o fuso horário
      const dateObj = new Date(date as string);
      const offset = dateObj.getTimezoneOffset();
      const adjustedDate = new Date(dateObj.getTime() + offset * 60 * 1000);

      return format(adjustedDate, "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "endDate",
    header: "Data Fim",
    cell: ({ row }) => {
      const date = row.getValue("endDate");
      if (!date) return "-";

      const dateObj = new Date(date as string);
      const offset = dateObj.getTimezoneOffset();
      const adjustedDate = new Date(dateObj.getTime() + offset * 60 * 1000);

      return format(adjustedDate, "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    id: "daysLeft",
    header: "Dias a Vencer",
    cell: ({ row }) => {
      const endDate = row.original.endDate;
      if (!endDate) return "-";

      const daysLeft = differenceInDays(new Date(endDate), new Date());
      return (
        <span className={daysLeft <= 5 ? "text-red-500" : "text-green-500"}>
          {daysLeft + 1} dias
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
          onClick={() => window.openFinishEvaluation(client)}
          variant="outline"
          size="sm"
          className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
        >
          <Square className="h-4 w-4 mr-2" />
          Encerrar Avaliação
        </Button>
      );
    },
  },
];
