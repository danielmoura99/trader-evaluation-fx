// app/(dashboard)/subscriptions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bug } from "lucide-react";
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
  const [debugMode, setDebugMode] = useState(false);
  const { toast } = useToast();

  const loadSubscriptions = async () => {
    const requestId = `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setIsLoading(true);
    try {
      console.log(`🖥️  [${requestId}] ===== INÍCIO CARREGAMENTO UI =====`);
      console.log(
        `🖥️  [${requestId}] Usuário clicou em "Atualizar" às ${new Date().toLocaleString()}`
      );
      console.log(`🖥️  [${requestId}] Debug mode:`, debugMode);

      const startTime = Date.now();

      console.log(`🖥️  [${requestId}] Chamando getSubscriptions()...`);
      const data = await getSubscriptions();

      const duration = Date.now() - startTime;
      console.log(
        `🖥️  [${requestId}] getSubscriptions() retornou em ${duration}ms`
      );
      console.log(`🖥️  [${requestId}] Dados recebidos:`, {
        type: Array.isArray(data) ? "Array" : typeof data,
        length: Array.isArray(data) ? data.length : "N/A",
        first:
          data && data.length > 0
            ? {
                subscriptionId: data[0].subscriptionId,
                hasClient: !!data[0].client,
                clientName: data[0].client?.name || "N/A",
              }
            : "Nenhum dado",
      });

      setSubscriptions(data);

      console.log(`🖥️  [${requestId}] Estado atualizado no React`);
      console.log(`✅ [${requestId}] ===== CARREGAMENTO UI CONCLUÍDO =====`);

      toast({
        title: "Assinaturas atualizadas",
        description: `${data.length} assinaturas carregadas com sucesso`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      console.error(`❌ [${requestId}] ===== ERRO NO CARREGAMENTO UI =====`);
      console.error(`❌ [${requestId}] Erro capturado pela UI:`, errorMsg);
      console.error(
        `❌ [${requestId}] Tipo do erro:`,
        error?.constructor?.name || "Unknown"
      );

      if (error instanceof Error) {
        console.error(`❌ [${requestId}] Stack trace:`, error.stack);
      }

      console.error(`❌ [${requestId}] ===== FIM ERRO UI =====`);

      toast({
        title: "Erro ao carregar assinaturas",
        description: `Não foi possível obter a lista de assinaturas. Verifique o console para detalhes.`,
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
    console.log(
      `🖥️  [UI] Visualizando detalhes da assinatura:`,
      subscription.subscriptionId
    );
    setSelectedSubscription(subscription);
    setDetailsOpen(true);
  };

  // Expor funções para a tabela
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.viewSubscriptionDetails = handleViewDetails;
    }
  }, []);

  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    console.log(`🐛 [UI] Debug mode ${!debugMode ? "ATIVADO" : "DESATIVADO"}`);
    if (!debugMode) {
      console.log(`🐛 [UI] Agora você verá logs detalhados no console!`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-zinc-100">
          Assinaturas Nelogica
        </h1>
        <div className="flex gap-2">
          <Button
            variant={debugMode ? "default" : "outline"}
            size="sm"
            onClick={toggleDebugMode}
          >
            <Bug className="h-4 w-4 mr-2" />
            Debug {debugMode ? "ON" : "OFF"}
          </Button>
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
      </div>

      {debugMode && (
        <Card className="bg-zinc-900 border-yellow-500 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-500 text-sm flex items-center">
              <Bug className="h-4 w-4 mr-2" />
              Debug Mode Ativo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <strong className="text-zinc-300">Estado atual:</strong>
                <br />
                Loading: {isLoading ? "Sim" : "Não"}
                <br />
                Assinaturas: {subscriptions.length}
                <br />
                Dialog aberto: {detailsOpen ? "Sim" : "Não"}
              </div>
              <div>
                <strong className="text-zinc-300">Última atualização:</strong>
                <br />
                {new Date().toLocaleString()}
                <br />
                <strong className="text-zinc-300">Logs:</strong>
                <br />
                Verifique o console do navegador (F12)
              </div>
              <div>
                <strong className="text-zinc-300">API Status:</strong>
                <br />
                Todos os logs detalhados estão no console
                <br />
                Inclui URLs, headers, tempos de resposta
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-zinc-900 border-zinc-800 flex-1">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center justify-between">
            Lista de Assinaturas
            {debugMode && (
              <span className="text-xs text-zinc-500">
                {subscriptions.length} assinaturas carregadas
              </span>
            )}
          </CardTitle>
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
