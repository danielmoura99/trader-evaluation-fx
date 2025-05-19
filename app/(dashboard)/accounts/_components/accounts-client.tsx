// app/(dashboard)/accounts/_components/accounts-client.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw } from "lucide-react";
import { NelogicaAccount, getAccounts } from "../_actions";
import { AccountsTable } from "./accounts-table";
import { AccountDetailsDialog } from "./account-details-dialog";

interface AccountsClientProps {
  initialAccounts: NelogicaAccount[];
}

export function AccountsClient({ initialAccounts }: AccountsClientProps) {
  const [accounts, setAccounts] = useState<NelogicaAccount[]>(initialAccounts);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] =
    useState<NelogicaAccount | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Expor função para visualizar detalhes da conta
  useEffect(() => {
    window.viewAccountDetails = (account: NelogicaAccount) => {
      setSelectedAccount(account);
      setIsDialogOpen(true);
    };

    return () => {
      delete window.viewAccountDetails;
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const refreshedAccounts = await getAccounts();
      setAccounts(refreshedAccounts);
      toast({
        title: "Contas atualizadas",
        description: "Lista de contas atualizada com sucesso",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Erro ao atualizar contas",
        description: "Houve um problema ao buscar as contas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-zinc-400">
          {accounts.length} contas encontradas
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100"
        >
          {isLoading ? (
            <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      <AccountsTable accounts={accounts} isLoading={isLoading} />

      <AccountDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        account={selectedAccount}
        onRefresh={handleRefresh}
      />
    </>
  );
}
