// app/(dashboard)/nelogica-test/_components/nelogica-monitor.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info } from "lucide-react";
import { testNelogicaListSubscriptions } from "../_actions/index";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Interfaces para os dados
interface Account {
  account: string;
  name: string;
  profileId: string;
  validadedAt: string;
}

interface CustomerInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  document?: string;
  phone?: string;
}

interface Subscription {
  subscriptionId: string;
  licenseId: string;
  customerId: string;
  planId?: string;
  createdAt: string;
  accounts: Account[];
  customerInfo?: CustomerInfo; // Informações adicionais do cliente
  planName?: string;
}

interface EnhancedAccount extends Account {
  subscriptionId: string;
  licenseId: string;
  customerId: string;
}

interface Customer {
  id: string;
  info?: CustomerInfo;
  subscriptions: Array<{
    subscriptionId: string;
    licenseId: string;
  }>;
}

interface MonitorData {
  subscriptions: Subscription[];
  accounts: EnhancedAccount[];
  customers: Customer[];
}

interface NelogicaMonitorProps {
  onRefresh?: () => void;
}

export function NelogicaMonitor({ onRefresh }: NelogicaMonitorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [data, setData] = useState<MonitorData>({
    subscriptions: [],
    accounts: [],
    customers: [],
  });

  // Função para carregar os dados
  const loadData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Carrega as assinaturas (que contêm informações sobre contas e licenças)
      const subscriptionsResult = await testNelogicaListSubscriptions();

      if (subscriptionsResult.success && subscriptionsResult.subscriptions) {
        // Extrai os dados das assinaturas
        const subscriptions =
          subscriptionsResult.subscriptions as Subscription[];

        // Extrai as contas de todas as assinaturas
        const accounts: EnhancedAccount[] = [];

        subscriptions.forEach((subscription) => {
          if (subscription.accounts && Array.isArray(subscription.accounts)) {
            subscription.accounts.forEach((account) => {
              accounts.push({
                ...account,
                subscriptionId: subscription.subscriptionId,
                licenseId: subscription.licenseId,
                customerId: subscription.customerId,
              });
            });
          }
        });

        // Extrai os clientes (deduplica por customerId)
        const customersMap = new Map<string, Customer>();

        subscriptions.forEach((subscription) => {
          if (!customersMap.has(subscription.customerId)) {
            customersMap.set(subscription.customerId, {
              id: subscription.customerId,
              info: subscription.customerInfo,
              subscriptions: [],
            });
          }

          const customer = customersMap.get(subscription.customerId);
          if (customer) {
            customer.subscriptions.push({
              subscriptionId: subscription.subscriptionId,
              licenseId: subscription.licenseId,
            });
          }
        });

        const customers: Customer[] = Array.from(customersMap.values());

        setData({
          subscriptions,
          accounts,
          customers,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do monitor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega os dados inicialmente
  useEffect(() => {
    loadData();
  }, []);

  // Função para formatar datas
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-BR");
  };

  // Função para exibir nome completo do cliente
  const getCustomerName = (subscription: Subscription): string => {
    if (!subscription.customerInfo) return "N/A";
    const { firstName, lastName } = subscription.customerInfo;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || lastName || "N/A";
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-zinc-100">Monitor Nelogica</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadData();
            if (onRefresh) onRefresh();
          }}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="accounts">Contas</TabsTrigger>
            <TabsTrigger value="customers">Clientes</TabsTrigger>
          </TabsList>

          {/* Tab de Assinaturas */}
          <TabsContent value="subscriptions">
            <div className="rounded-md border border-zinc-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Cliente
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Email/CPF
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Plan ID
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        License ID
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Data de Criação
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Contas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subscriptions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-4 px-4 text-center text-zinc-500"
                        >
                          Nenhuma assinatura encontrada
                        </td>
                      </tr>
                    ) : (
                      data.subscriptions.map((subscription, index) => (
                        <tr
                          key={index}
                          className="border-t border-zinc-800 hover:bg-zinc-800/50"
                        >
                          <td className="py-2 px-4 text-zinc-300">
                            {getCustomerName(subscription)}
                          </td>
                          <td className="py-2 px-4 text-zinc-300">
                            {subscription.customerInfo?.email || "-"}
                            <br />
                            <span className="text-zinc-500 text-xs">
                              {subscription.customerInfo?.document || "-"}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-zinc-300 font-mono text-xs">
                            {subscription.planId || "-"}
                          </td>
                          <td className="py-2 px-4 text-zinc-300 font-mono text-xs">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    {subscription.licenseId.substring(0, 8)}...
                                    <Info className="h-3 w-3 text-zinc-500" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-mono text-xs">
                                    {subscription.licenseId}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="py-2 px-4 text-zinc-300">
                            {formatDate(subscription.createdAt)}
                          </td>
                          <td className="py-2 px-4 text-zinc-300">
                            {subscription.accounts?.length || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Tab de Contas */}
          <TabsContent value="accounts">
            <div className="rounded-md border border-zinc-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Account ID
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Nome
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Cliente
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        License ID
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Profile ID
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Data de Validação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.accounts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-4 px-4 text-center text-zinc-500"
                        >
                          Nenhuma conta encontrada
                        </td>
                      </tr>
                    ) : (
                      data.accounts.map((account, index) => {
                        // Encontra a assinatura correspondente para obter dados do cliente
                        const subscription = data.subscriptions.find(
                          (sub) => sub.licenseId === account.licenseId
                        );

                        return (
                          <tr
                            key={index}
                            className="border-t border-zinc-800 hover:bg-zinc-800/50"
                          >
                            <td className="py-2 px-4 text-zinc-300 font-mono text-xs">
                              {account.account}
                            </td>
                            <td className="py-2 px-4 text-zinc-300">
                              {account.name}
                            </td>
                            <td className="py-2 px-4 text-zinc-300">
                              {subscription
                                ? getCustomerName(subscription)
                                : "-"}
                            </td>
                            <td className="py-2 px-4 text-zinc-300 font-mono text-xs">
                              {account.licenseId.substring(0, 8)}...
                            </td>
                            <td className="py-2 px-4 text-zinc-300 font-mono text-xs">
                              {account.profileId}
                            </td>
                            <td className="py-2 px-4 text-zinc-300">
                              {formatDate(account.validadedAt)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Tab de Clientes */}
          <TabsContent value="customers">
            <div className="rounded-md border border-zinc-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Cliente
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Email
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Documento
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Customer ID
                      </th>
                      <th className="py-2 px-4 text-left font-medium text-zinc-400">
                        Assinaturas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 px-4 text-center text-zinc-500"
                        >
                          Nenhum cliente encontrado
                        </td>
                      </tr>
                    ) : (
                      data.customers.map((customer, index) => {
                        // Encontra a primeira assinatura para obter dados do cliente
                        const subscription = data.subscriptions.find(
                          (sub) => sub.customerId === customer.id
                        );

                        return (
                          <tr
                            key={index}
                            className="border-t border-zinc-800 hover:bg-zinc-800/50"
                          >
                            <td className="py-2 px-4 text-zinc-300">
                              {subscription
                                ? getCustomerName(subscription)
                                : "-"}
                            </td>
                            <td className="py-2 px-4 text-zinc-300">
                              {subscription?.customerInfo?.email || "-"}
                            </td>
                            <td className="py-2 px-4 text-zinc-300">
                              {subscription?.customerInfo?.document || "-"}
                            </td>
                            <td className="py-2 px-4 text-zinc-300 font-mono text-xs">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 cursor-help">
                                      {customer.id.substring(0, 8)}...
                                      <Info className="h-3 w-3 text-zinc-500" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-mono text-xs">
                                      {customer.id}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td className="py-2 px-4">
                              <div className="flex flex-col gap-1">
                                {customer.subscriptions?.map((sub, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-zinc-400"
                                  >
                                    <span className="text-zinc-500">
                                      License:
                                    </span>{" "}
                                    {sub.licenseId.substring(0, 8)}...
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
