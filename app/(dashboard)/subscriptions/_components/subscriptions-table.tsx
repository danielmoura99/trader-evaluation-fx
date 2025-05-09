// app/(dashboard)/subscriptions/_components/subscriptions-table.tsx
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
import { Button } from "@/components/ui/button";
import { Eye, RotateCw, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cancelSubscription } from "../_actions";
import { useToast } from "@/hooks/use-toast";

// Definição de tipo para a assinatura
interface Subscription {
  subscriptionId: string;
  licenseId: string;
  customerId: string;
  createdAt: string;
  planId?: string;
  accounts?: {
    account: string;
    name: string;
    profileId: string;
    validadedAt: string;
  }[];
  client?: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    plan: string;
    traderStatus: string;
    startDate?: string | null;
    endDate?: string | null;
  } | null;
}

interface SubscriptionsTableProps {
  subscriptions: Subscription[];
  isLoading: boolean;
}

export function SubscriptionsTable({
  subscriptions,
  isLoading,
}: SubscriptionsTableProps) {
  const [filter, setFilter] = useState("");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para filtrar assinaturas
  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub.client?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      sub.client?.email?.toLowerCase().includes(filter.toLowerCase()) ||
      sub.client?.cpf?.includes(filter) ||
      sub.subscriptionId.includes(filter)
  );

  // Função para lidar com cancelamento
  const handleCancel = async (subscriptionId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta assinatura?")) {
      return;
    }

    setCancelingId(subscriptionId);
    try {
      await cancelSubscription(subscriptionId);
      toast({
        title: "Assinatura cancelada",
        description: "A assinatura foi cancelada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao cancelar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Input
          placeholder="Filtrar por nome, e-mail, CPF ou ID..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm bg-zinc-800 border-zinc-700"
        />
      </div>

      <div className="rounded-md border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-zinc-800/50">
              <TableHead className="text-zinc-400">Cliente</TableHead>
              <TableHead className="text-zinc-400">Subscription ID</TableHead>
              <TableHead className="text-zinc-400">License ID</TableHead>
              <TableHead className="text-zinc-400">Plano</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Data de Criação</TableHead>
              <TableHead className="text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-zinc-500"
                >
                  Carregando assinaturas...
                </TableCell>
              </TableRow>
            ) : filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-zinc-500"
                >
                  Nenhuma assinatura encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <TableRow
                  key={subscription.subscriptionId}
                  className="hover:bg-zinc-800/50"
                >
                  <TableCell className="font-medium text-zinc-300">
                    {subscription.client?.name || "N/A"}
                    {subscription.client?.email && (
                      <div className="text-xs text-zinc-500">
                        {subscription.client.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-300">
                    {subscription.subscriptionId}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-300">
                    {subscription.licenseId}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {subscription.client?.plan || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                        subscription.client?.traderStatus === "Em Curso"
                          ? "bg-blue-500/20 text-blue-400"
                          : subscription.client?.traderStatus === "Aprovado"
                            ? "bg-green-500/20 text-green-400"
                            : subscription.client?.traderStatus === "Reprovado"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {subscription.client?.traderStatus || "Desconhecido"}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {subscription.createdAt
                      ? format(new Date(subscription.createdAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          window.viewSubscriptionDetails(subscription)
                        }
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver detalhes</span>
                      </Button>

                      {subscription.client?.traderStatus !== "Reprovado" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleCancel(subscription.subscriptionId)
                          }
                          disabled={cancelingId === subscription.subscriptionId}
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                        >
                          {cancelingId === subscription.subscriptionId ? (
                            <RotateCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                          <span className="sr-only">Cancelar</span>
                        </Button>
                      )}
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
