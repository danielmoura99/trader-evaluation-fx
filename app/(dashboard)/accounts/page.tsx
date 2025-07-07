// app/(dashboard)/accounts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./_columns/columns";
import { getAccounts, NelogicaAccount } from "./_actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { AccountDetailsDialog } from "./_components/account-details-dialog";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<NelogicaAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] =
    useState<NelogicaAccount | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await getAccounts();
      setAccounts(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Erro ao carregar contas",
        description: "Não foi possível obter a lista de contas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Funções para manipular a visualização de detalhes
  const handleViewDetails = (account: NelogicaAccount) => {
    setSelectedAccount(account);
    setDetailsOpen(true);
  };

  // Expor funções para a tabela
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.viewAccountDetails = handleViewDetails;
    }
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Contas Nelogica</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAccounts}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
          <DataTable columns={columns} data={accounts} searchColumn="account" />
        </div>
      </div>

      {/* Dialog para exibir detalhes da conta */}
      <AccountDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        account={selectedAccount}
        onRefresh={fetchAccounts}
      />
    </div>
  );
}
