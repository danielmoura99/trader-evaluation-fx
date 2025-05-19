/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/accounts/_components/account-details-dialog.tsx
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
import { getAccountDetails, blockAccount, unblockAccount } from "../_actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NelogicaAccount } from "../_actions";

interface AccountDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: NelogicaAccount | null;
  onRefresh: () => void;
}

export function AccountDetailsDialog({
  open,
  onOpenChange,
  account,
  onRefresh,
}: AccountDetailsDialogProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && account) {
      loadDetails();
    } else {
      setDetails(null);
    }
  }, [open, account]);

  const loadDetails = async () => {
    if (!account) return;

    setIsLoading(true);
    try {
      const data = await getAccountDetails(account.licenseId, account.account);
      setDetails(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível obter os detalhes da conta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockAccount = async () => {
    if (!account) return;
    if (
      !confirm(`Tem certeza que deseja bloquear a conta ${account.account}?`)
    ) {
      return;
    }

    setIsActionLoading(true);
    try {
      await blockAccount(account.licenseId, account.account);
      toast({
        title: "Conta bloqueada",
        description: "A conta foi bloqueada com sucesso.",
      });
      onRefresh();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao bloquear conta",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnblockAccount = async () => {
    if (!account) return;
    if (
      !confirm(`Tem certeza que deseja desbloquear a conta ${account.account}?`)
    ) {
      return;
    }

    setIsActionLoading(true);
    try {
      await unblockAccount(account.licenseId, account.account);
      toast({
        title: "Conta desbloqueada",
        description: "A conta foi desbloqueada com sucesso.",
      });
      onRefresh();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao desbloquear conta",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Detalhes da Conta</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="client">Cliente</TabsTrigger>
            <TabsTrigger value="actions">Ações</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-zinc-400">
                      Dados da Conta
                    </h3>
                    <Separator className="bg-zinc-800" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-400">Conta ID</div>
                      <div className="text-sm font-mono text-zinc-300">
                        {account.account}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400">Nome</div>
                      <div className="text-sm text-zinc-300">
                        {account.name}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-400">License ID</div>
                      <div className="text-sm font-mono text-zinc-300">
                        {account.licenseId}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400">Profile ID</div>
                      <div className="text-sm font-mono text-zinc-300">
                        {account.profileId}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-400">
                      Data de Validação
                    </div>
                    <div className="text-sm text-zinc-300">
                      {account.validatedAt
                        ? format(
                            new Date(account.validatedAt),
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
                        account.isBlocked
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {account.isBlocked ? "Bloqueada" : "Ativa"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="client" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !account.client ? (
              <div className="text-center py-8 text-zinc-500">
                Esta conta não está associada a nenhum cliente
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-zinc-400">
                      Dados do Cliente
                    </h3>
                    <Separator className="bg-zinc-800" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-400">Nome</div>
                      <div className="text-sm text-zinc-300">
                        {account.client.name}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400">E-mail</div>
                      <div className="text-sm text-zinc-300">
                        {account.client.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-400">CPF</div>
                      <div className="text-sm text-zinc-300">
                        {account.client.cpf}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-400">Plano</div>
                      <div className="text-sm text-zinc-300">
                        {account.client.plan}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-400">Status</div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center w-fit ${
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
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-zinc-400">
                  Ações disponíveis
                </h3>
                <Separator className="bg-zinc-800" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {account.isBlocked ? (
                  <Button
                    variant="outline"
                    onClick={handleUnblockAccount}
                    disabled={isActionLoading}
                    className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100"
                  >
                    {isActionLoading ? "Processando..." : "Desbloquear Conta"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleBlockAccount}
                    disabled={isActionLoading}
                    className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100"
                  >
                    {isActionLoading ? "Processando..." : "Bloquear Conta"}
                  </Button>
                )}

                <Button
                  variant="destructive"
                  onClick={() => {
                    // Implementar lógica para remover conta
                    if (!account) return;
                    if (
                      !confirm(
                        `Tem certeza que deseja remover a conta ${account.account}? Esta ação não pode ser desfeita.`
                      )
                    ) {
                      return;
                    }

                    toast({
                      title: "Funcionalidade em desenvolvimento",
                      description: "Esta ação será implementada em breve.",
                    });
                  }}
                  disabled={isActionLoading}
                >
                  Remover Conta
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
