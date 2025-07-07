/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/subscriptions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { getSubscriptions } from "./_actions";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionsTable } from "./_components/subscriptions-table";
import { SubscriptionDetailsDialog } from "./_components/subscription-details-dialog";

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

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar assinaturas",
        description: "Não foi possível obter a lista de assinaturas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Funções para manipular a visualização de detalhes
  const handleViewDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailsOpen(true);
  };

  // Expor funções para a tabela
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.viewSubscriptionDetails = handleViewDetails;
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-zinc-100">
          Assinaturas Nelogica
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSubscriptions}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 flex-1">
        <CardHeader>
          <CardTitle className="text-zinc-100">Lista de Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionsTable
            subscriptions={subscriptions}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Dialog para exibir detalhes da assinatura */}
      <SubscriptionDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        subscription={selectedSubscription}
        onRefresh={loadSubscriptions}
      />
    </div>
  );
}
