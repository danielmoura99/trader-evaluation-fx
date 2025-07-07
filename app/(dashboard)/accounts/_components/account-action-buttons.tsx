// app/(dashboard)/accounts/_components/account-action-buttons.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, Ban, RotateCw, Play, Trash } from "lucide-react";
import {
  NelogicaAccount,
  blockAccount,
  unblockAccount,
  removeAccount,
} from "../_actions";

interface AccountActionButtonsProps {
  account: NelogicaAccount;
}

export function AccountActionButtons({ account }: AccountActionButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBlockAccount = async () => {
    if (
      !confirm(`Tem certeza que deseja bloquear a conta ${account.account}?`)
    ) {
      return;
    }

    setIsLoading("block");
    try {
      await blockAccount(account.licenseId, account.account);
      toast({
        title: "Conta bloqueada",
        description: "A conta foi bloqueada com sucesso.",
      });
      // Em vez de atualizar localmente, confiaremos no revalidatePath para atualizar a UI
    } catch (error) {
      toast({
        title: "Erro ao bloquear conta",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleUnblockAccount = async () => {
    if (
      !confirm(`Tem certeza que deseja desbloquear a conta ${account.account}?`)
    ) {
      return;
    }

    setIsLoading("unblock");
    try {
      await unblockAccount(account.licenseId, account.account);
      toast({
        title: "Conta desbloqueada",
        description: "A conta foi desbloqueada com sucesso.",
      });
      // Em vez de atualizar localmente, confiaremos no revalidatePath para atualizar a UI
    } catch (error) {
      toast({
        title: "Erro ao desbloquear conta",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleRemoveAccount = async () => {
    if (
      !confirm(
        `Tem certeza que deseja remover a conta ${account.account}? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    setIsLoading("remove");
    try {
      await removeAccount(account.licenseId, account.account);
      toast({
        title: "Conta removida",
        description: "A conta foi removida com sucesso.",
      });
      // Em vez de atualizar localmente, confiaremos no revalidatePath para atualizar a UI
    } catch (error) {
      toast({
        title: "Erro ao remover conta",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.viewAccountDetails?.(account)}
        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">Ver detalhes</span>
      </Button>

      {account.isBlocked ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleUnblockAccount}
          disabled={isLoading === "unblock"}
          className="h-8 w-8 text-green-400 hover:text-green-300"
        >
          {isLoading === "unblock" ? (
            <RotateCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="sr-only">Desbloquear</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBlockAccount}
          disabled={isLoading === "block"}
          className="h-8 w-8 text-amber-400 hover:text-amber-300"
        >
          {isLoading === "block" ? (
            <RotateCw className="h-4 w-4 animate-spin" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          <span className="sr-only">Bloquear</span>
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={handleRemoveAccount}
        disabled={isLoading === "remove"}
        className="h-8 w-8 text-red-400 hover:text-red-300"
      >
        {isLoading === "remove" ? (
          <RotateCw className="h-4 w-4 animate-spin" />
        ) : (
          <Trash className="h-4 w-4" />
        )}
        <span className="sr-only">Remover</span>
      </Button>
    </div>
  );
}
