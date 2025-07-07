/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/subscriptions/_components/subscription-details-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getSubscriptionDetails, reactivateSubscription } from "../_actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: any;
  onRefresh: () => void;
}

export function SubscriptionDetailsDialog({
  open,
  onOpenChange,
  subscription,
  onRefresh,
}: SubscriptionDetailsDialogProps) {
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && subscription) {
      loadDetails();
    } else {
      setDetails(null);
    }
  }, [open, subscription]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDetails = async () => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      const data = await getSubscriptionDetails(subscription.subscriptionId);
      setDetails(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível obter os detalhes da assinatura.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!subscription?.client?.id) {
      toast({
        title: "Erro",
        description: "ID do cliente não encontrado.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Tem certeza que deseja reativar esta assinatura?")) {
      return;
    }

    setIsReactivating(true);
    try {
      await reactivateSubscription(subscription.client.id);
      toast({
        title: "Assinatura reativada",
        description: "A assinatura foi reativada com sucesso.",
      });
      onRefresh();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao reativar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            Detalhes da Assinatura
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="accounts">Contas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-zinc-400">
                        Dados da Assinatura
                      </h3>
                      <Separator className="bg-zinc-800" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-zinc-400">
                          Subscription ID
                        </div>
                        <div className="text-sm font-mono text-zinc-300">
                          {subscription.subscriptionId}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-zinc-400">License ID</div>
                        <div className="text-sm font-mono text-zinc-300">
                          {subscription.licenseId}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400">
                        Data de Criação
                      </div>
                      <div className="text-sm text-zinc-300">
                        {subscription.createdAt
                          ? format(
                              new Date(subscription.createdAt),
                              "dd/MM/yyyy HH:mm",
                              {
                                locale: ptBR,
                              }
                            )
                          : "N/A"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400">Status</div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center w-fit ${
                          subscription.client?.traderStatus === "Em Curso"
                            ? "bg-blue-500/20 text-blue-400"
                            : subscription.client?.traderStatus === "Aprovado"
                              ? "bg-green-500/20 text-green-400"
                              : subscription.client?.traderStatus ===
                                  "Reprovado"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {subscription.client?.traderStatus || "Desconhecido"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-zinc-400">
                        Dados do Cliente
                      </h3>
                      <Separator className="bg-zinc-800" />
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400">Nome</div>
                      <div className="text-sm text-zinc-300">
                        {subscription.client?.name || "N/A"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400">E-mail</div>
                      <div className="text-sm text-zinc-300">
                        {subscription.client?.email || "N/A"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400">CPF</div>
                      <div className="text-sm text-zinc-300">
                        {subscription.client?.cpf || "N/A"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400">Plano</div>
                      <div className="text-sm text-zinc-300">
                        {subscription.client?.plan || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Período de avaliação */}
                {subscription.client?.startDate && (
                  <div className="space-y-2 pt-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-zinc-400">
                        Período de Avaliação
                      </h3>
                      <Separator className="bg-zinc-800" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-zinc-400">
                          Data de Início
                        </div>
                        <div className="text-sm text-zinc-300">
                          {format(
                            new Date(subscription.client.startDate),
                            "dd/MM/yyyy",
                            {
                              locale: ptBR,
                            }
                          )}
                        </div>
                      </div>

                      {subscription.client.endDate && (
                        <div>
                          <div className="text-xs text-zinc-400">
                            Data de Término
                          </div>
                          <div className="text-sm text-zinc-300">
                            {format(
                              new Date(subscription.client.endDate),
                              "dd/MM/yyyy",
                              {
                                locale: ptBR,
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex justify-end space-x-2 pt-4">
                  {subscription.client?.traderStatus === "Reprovado" && (
                    <Button
                      onClick={handleReactivate}
                      disabled={isReactivating}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {isReactivating ? "Reativando..." : "Reativar Assinatura"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="accounts" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : details?.accounts?.length > 0 ? (
              <div className="rounded-md border border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-zinc-400">Conta</TableHead>
                      <TableHead className="text-zinc-400">Nome</TableHead>
                      <TableHead className="text-zinc-400">Perfil</TableHead>
                      <TableHead className="text-zinc-400">
                        Data de Validação
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.accounts.map((account: any) => (
                      <TableRow key={account.account}>
                        <TableCell className="font-mono text-zinc-300">
                          {account.account}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {account.name}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {account.profileId}
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          {account.validadedAt
                            ? format(
                                new Date(account.validadedAt),
                                "dd/MM/yyyy HH:mm",
                                {
                                  locale: ptBR,
                                }
                              )
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                Nenhuma conta encontrada para esta assinatura
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : details?.history?.length > 0 ? (
              <div className="space-y-4">
                {details.history.map((entry: any, index: number) => (
                  <div
                    key={index}
                    className="border border-zinc-800 rounded-md p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-sm font-medium text-zinc-300">
                        {entry.action}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {format(new Date(entry.timestamp), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                    {entry.details && (
                      <div className="mt-2 text-xs text-zinc-400">
                        {entry.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                Nenhum histórico disponível para esta assinatura
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Tabela interna para a lista de contas
const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="w-full text-sm">{children}</table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-zinc-800/50">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="border-b border-zinc-800 hover:bg-zinc-800/50">{children}</tr>
);

const TableHead = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <th className={`px-4 py-2 text-left font-medium ${className || ""}`}>
    {children}
  </th>
);

const TableCell = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => <td className={`px-4 py-2 ${className || ""}`}>{children}</td>;
