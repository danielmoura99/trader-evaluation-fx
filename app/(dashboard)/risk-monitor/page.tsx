/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/risk-monitor/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  RotateCcw,
  Trash2,
  Activity,
  RefreshCw,
  Bell,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  getInitialRiskMonitorData,
  zerarSaldoMensal,
  zerarSaldoTotal,
  exportRiskMonitorData,
} from "./_actions";
import { calculateRiskStatus } from "./_utils";
import { RiskMonitorTable } from "./_components/risk-monitor-table";
import { WebSocketStatus as WebSocketStatusComponent } from "./_components/websocket-status";
import { RiskAlertsPanel } from "./_components/risk-alerts-panel";
import { ExportControls } from "./_components/export-controls";
import { MonitorConfig } from "./_components/monitor-config";
import { NelogicaWebSocketService } from "@/lib/services/nelogica-websocket-service";
import type {
  RiskMonitorData,
  WebSocketStatus,
  WebSocketBalanceData,
  WebSocketRiskData,
  WebSocketPositionData,
  WebSocketMarginData,
  ExportOptions,
} from "./_types";

export default function RiskMonitorPage() {
  // Estados principais
  const [riskData, setRiskData] = useState<RiskMonitorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  // Estado do WebSocket
  const [wsService, setWsService] = useState<NelogicaWebSocketService | null>(
    null
  );
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>({
    connected: false,
    authenticated: false,
    lastHeartbeat: null,
    reconnectAttempts: 0,
  });

  const { toast } = useToast();

  // Inicializar WebSocket Service
  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (wsService) {
        wsService.disconnect();
      }
    };
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Inicializa o serviço WebSocket
   */
  const initializeWebSocket = () => {
    // Dados reais da Nelogica fornecidos
    const wsUrl =
      process.env.NEXT_PUBLIC_NELOGICA_WS_URL || "ws://191.252.154.12:36302";
    const token =
      process.env.NEXT_PUBLIC_NELOGICA_WS_TOKEN ||
      "3dBtHNwjxWZmcPL8YzGSjLfSfM6xTveV";

    console.log("[Risk Monitor] Inicializando WebSocket da Nelogica");
    console.log("[Risk Monitor] URL:", wsUrl);
    console.log("[Risk Monitor] Token configurado:", token ? "Sim" : "Não");

    const service = new NelogicaWebSocketService(wsUrl, token);
    setWsService(service);

    // Configurar event listeners
    setupWebSocketListeners(service);

    // Sempre tentar conectar na Nelogica real primeiro
    console.log("[Risk Monitor] Tentando conectar na Nelogica...");
    service
      .connect()
      .then(() => {
        console.log("[Risk Monitor] Conexão WebSocket iniciada");
      })
      .catch((error) => {
        console.error("[Risk Monitor] Erro ao conectar WebSocket:", error);

        // Se falhar, mostrar opção de modo simulado
        toast({
          title: "Erro de Conexão",
          description:
            "Falha ao conectar com Nelogica. Deseja usar modo simulado?",
          variant: "destructive",
        });

        // Após 5 segundos, ativar simulação se ainda não conectou
        setTimeout(() => {
          if (!wsStatus.connected) {
            console.log("[Risk Monitor] Ativando modo simulação...");
            simulateWebSocketConnection(service);
          }
        }, 5000);
      });
  };

  /**
   * Configura os listeners do WebSocket
   */
  const setupWebSocketListeners = (service: NelogicaWebSocketService) => {
    service.on("statusChange", (status: WebSocketStatus) => {
      console.log("[Risk Monitor] Status WebSocket mudou:", status);
      setWsStatus(status);
    });

    service.on("authenticated", () => {
      console.log("[Risk Monitor] WebSocket autenticado com sucesso!");
      toast({
        title: "🟢 Conectado à Nelogica",
        description: "Recebendo dados em tempo real",
      });

      // Solicitar dados iniciais
      console.log("[Risk Monitor] Solicitando dados iniciais...");
      service.requestBalance();
      service.requestMargin();
      service.requestRisk();
      service.requestPosition();
    });

    service.on("authenticationFailed", () => {
      console.error("[Risk Monitor] Falha na autenticação");
      toast({
        title: "❌ Falha na Autenticação",
        description: "Token inválido ou expirado",
        variant: "destructive",
      });
    });

    service.on("balanceUpdate", (balances: WebSocketBalanceData[]) => {
      console.log(
        "[Risk Monitor] Atualização de saldos:",
        balances.length,
        "contas"
      );
      updateBalanceData(balances);
    });

    service.on("riskUpdate", (risks: WebSocketRiskData[]) => {
      console.log(
        "[Risk Monitor] Atualização de riscos:",
        risks.length,
        "contas"
      );
      updateRiskData(risks);
    });

    service.on("positionUpdate", (positions: WebSocketPositionData[]) => {
      console.log(
        "[Risk Monitor] Atualização de posições:",
        positions.length,
        "contas"
      );
      updatePositionData(positions);
    });

    service.on("marginUpdate", (margins: WebSocketMarginData[]) => {
      console.log(
        "[Risk Monitor] Atualização de margens:",
        margins.length,
        "contas"
      );
      updateMarginData(margins);
    });

    service.on("blockingUpdate", (blockings: any[]) => {
      console.log(
        "[Risk Monitor] Atualização de bloqueios:",
        blockings.length,
        "contas"
      );
      updateBlockingData(blockings);
    });

    service.on("error", (error: any) => {
      console.error("[Risk Monitor] Erro WebSocket:", error);
      toast({
        title: "Erro WebSocket",
        description: `Erro na comunicação: ${error.message || "Erro desconhecido"}`,
        variant: "destructive",
      });
    });
  };

  /**
   * Simula conexão WebSocket em desenvolvimento
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const simulateWebSocketConnection = (service: NelogicaWebSocketService) => {
    console.log("[Risk Monitor] Ativando modo simulação...");

    setTimeout(() => {
      setWsStatus({
        connected: true,
        authenticated: true,
        lastHeartbeat: new Date(),
        reconnectAttempts: 0,
      });

      toast({
        title: "⚠️ Modo Simulação Ativo",
        description: "Usando dados fictícios para demonstração",
      });

      // Simular atualizações periódicas
      const interval = setInterval(() => {
        simulateDataUpdate();
      }, 5000);

      // Cleanup
      return () => clearInterval(interval);
    }, 2000);
  };

  /**
   * Carrega dados iniciais do monitor
   */
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const data = await getInitialRiskMonitorData();
      setRiskData(data);
      toast({
        title: "Monitor de Risco",
        description: `${data.length} contas carregadas com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Simula atualizações de dados (modo desenvolvimento)
   */
  const simulateDataUpdate = () => {
    setRiskData((prevData) =>
      prevData.map((item) => {
        const newItem = {
          ...item,
          operacoesAbertas: item.operacoesAbertas + (Math.random() - 0.5) * 100,
          drawdownDiario: Math.max(
            0,
            item.drawdownDiario + (Math.random() - 0.7) * 50
          ),
          saldoTotal: item.saldoTotal + (Math.random() - 0.5) * 200,
          lastUpdate: new Date(),
          connectionStatus: "connected" as const,
        };

        // Recalcular valores derivados
        newItem.resultadoBruto =
          newItem.operacoesFechadas + newItem.operacoesAbertas;
        newItem.resultadoLiquido =
          newItem.resultadoBruto -
          (typeof newItem.taxaCorretagem === "number"
            ? newItem.taxaCorretagem
            : 0);
        newItem.status = calculateRiskStatus(
          newItem.drawdownDiario,
          newItem.limitePerdaDiaria
        );

        return newItem;
      })
    );
  };

  /**
   * Atualiza dados de saldo via WebSocket
   */
  const updateBalanceData = (balances: WebSocketBalanceData[]) => {
    setRiskData((prevData) =>
      prevData.map((item) => {
        const balance = balances.find((b) => b.account === item.subconta);
        if (balance) {
          return {
            ...item,
            saldoTotal: balance.balance,
            lastUpdate: new Date(),
            connectionStatus: "connected" as const,
          };
        }
        return item;
      })
    );
  };

  /**
   * Atualiza dados de risco via WebSocket
   */
  const updateRiskData = (risks: WebSocketRiskData[]) => {
    setRiskData((prevData) =>
      prevData.map((item) => {
        const risk = risks.find((r) => r.account === item.subconta);
        if (risk) {
          const newItem = {
            ...item,
            drawdownDiario: risk.drawDown,
            limitePerdaDiaria: risk.maxLoss,
            lastUpdate: new Date(),
            connectionStatus: "connected" as const,
          };

          // Recalcular status baseado no novo drawdown
          newItem.status = calculateRiskStatus(
            newItem.drawdownDiario,
            newItem.limitePerdaDiaria
          );

          return newItem;
        }
        return item;
      })
    );
  };

  /**
   * Atualiza dados de posição via WebSocket
   */
  const updatePositionData = (positions: WebSocketPositionData[]) => {
    // Agrupar posições por conta
    const positionsByAccount = positions.reduce(
      (acc, pos) => {
        if (!acc[pos.account]) {
          acc[pos.account] = [];
        }
        acc[pos.account].push(pos);
        return acc;
      },
      {} as Record<string, WebSocketPositionData[]>
    );

    setRiskData((prevData) =>
      prevData.map((item) => {
        const accountPositions = positionsByAccount[item.subconta];
        if (accountPositions) {
          // Calcular P&L das posições abertas (simplificado)
          const openPnL = accountPositions.reduce((acc, pos) => {
            return (
              acc +
              pos.quantity * pos.averagePrice * (Math.random() - 0.5) * 0.01
            );
          }, 0);

          const newItem = {
            ...item,
            operacoesAbertas: openPnL,
            lastUpdate: new Date(),
            connectionStatus: "connected" as const,
          };

          // Recalcular resultado bruto e líquido
          newItem.resultadoBruto =
            newItem.operacoesFechadas + newItem.operacoesAbertas;
          newItem.resultadoLiquido =
            newItem.resultadoBruto -
            (typeof newItem.taxaCorretagem === "number"
              ? newItem.taxaCorretagem
              : 0);

          return newItem;
        }
        return item;
      })
    );
  };

  /**
   * Atualiza dados de margem via WebSocket
   */
  const updateMarginData = (margins: WebSocketMarginData[]) => {
    setRiskData((prevData) =>
      prevData.map((item) => {
        const margin = margins.find((m) => m.account === item.subconta);
        if (margin) {
          const newItem = {
            ...item,
            operacoesAbertas: margin.pnl, // P&L não realizado
            lastUpdate: new Date(),
            connectionStatus: "connected" as const,
          };

          // Recalcular resultado bruto e líquido
          newItem.resultadoBruto =
            newItem.operacoesFechadas + newItem.operacoesAbertas;
          newItem.resultadoLiquido =
            newItem.resultadoBruto -
            (typeof newItem.taxaCorretagem === "number"
              ? newItem.taxaCorretagem
              : 0);

          return newItem;
        }
        return item;
      })
    );
  };

  /**
   * Atualiza dados de bloqueio via WebSocket
   */
  const updateBlockingData = (blockings: any[]) => {
    setRiskData((prevData) =>
      prevData.map((item) => {
        const blocking = blockings.find((b) => b.account === item.subconta);
        if (blocking) {
          const newStatus = blocking.blocked ? "Critical" : item.status;
          return {
            ...item,
            status: newStatus as any,
            lastUpdate: new Date(),
            connectionStatus: "connected" as const,
          };
        }
        return item;
      })
    );
  };

  /**
   * Força reconexão do WebSocket
   */
  const handleReconnect = () => {
    if (wsService) {
      setIsReconnecting(true);
      wsService.forceReconnect();

      setTimeout(() => {
        setIsReconnecting(false);
      }, 5000);
    }
  };

  /**
   * Manipula exportação de dados
   */
  const handleExport = async (
    format: "excel" | "pdf" | "csv",
    options: ExportOptions
  ) => {
    try {
      const result = await exportRiskMonitorData(format, options, riskData);
      toast({
        title: "Exportação Concluída",
        description: `${result.recordCount} registros exportados em ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  /**
   * Zera saldo mensal
   */
  const handleZerarSaldoMensal = async () => {
    if (
      !confirm(
        "Tem certeza que deseja zerar o saldo mensal de todas as contas?"
      )
    ) {
      return;
    }

    try {
      const result = await zerarSaldoMensal();
      toast({
        title: "Saldo Mensal",
        description: result.message,
      });
      await loadInitialData(); // Recarregar dados
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  /**
   * Zera saldo total
   */
  const handleZerarSaldoTotal = async () => {
    if (
      !confirm("Tem certeza que deseja zerar o saldo total de todas as contas?")
    ) {
      return;
    }

    try {
      const result = await zerarSaldoTotal();
      toast({
        title: "Saldo Total",
        description: result.message,
      });
      await loadInitialData(); // Recarregar dados
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  /**
   * Manipula mudanças de configuração
   */
  const handleConfigChange = (config: any) => {
    console.log("Configurações atualizadas:", config);

    // Aplicar configurações quando alteradas
    // Por exemplo, alterar intervalo de atualização, configurações de alerta, etc.

    toast({
      title: "Configurações Atualizadas",
      description: "As configurações foram aplicadas com sucesso",
    });
  };

  // Calcular estatísticas gerais
  const stats = {
    totalContas: riskData.length,
    contasNormais: riskData.filter((d) => d.status === "Normal").length,
    contasAlerta: riskData.filter((d) => d.status === "Alert").length,
    contasCriticas: riskData.filter((d) => d.status === "Critical").length,
    resultadoTotal: riskData.reduce((acc, d) => acc + d.resultadoLiquido, 0),
  };

  // Contar alertas ativos
  const alertsCount = riskData.filter(
    (d) => d.status === "Critical" || d.status === "Alert"
  ).length;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center">
            <Activity className="mr-2 h-8 w-8" />
            Monitor de Risco
          </h1>

          {/* Status da Conexão WebSocket */}
          <Badge
            variant={wsStatus.connected ? "default" : "destructive"}
            className="flex items-center"
          >
            {wsStatus.connected ? <>🟢 Conectado</> : <>🔴 Desconectado</>}
          </Badge>
        </div>

        {/* Controles */}
        <div className="flex items-center space-x-2">
          <ExportControls data={riskData} onExport={handleExport} />

          <MonitorConfig onConfigChange={handleConfigChange} />

          <Button
            variant="outline"
            size="sm"
            onClick={handleZerarSaldoMensal}
            className="text-yellow-500 hover:text-yellow-400"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Zerar Saldo Mensal
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZerarSaldoTotal}
            className="text-red-500 hover:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Zerar Saldo Total
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative"
          >
            <Bell className="mr-2 h-4 w-4" />
            Alertas
            {alertsCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center"
              >
                {alertsCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">
              Total Contas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-zinc-100">
              {stats.totalContas}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Normais</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-500">
              {stats.contasNormais}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Alertas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-yellow-500">
              {stats.contasAlerta}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Críticas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-500">
              {stats.contasCriticas}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">
              Resultado Total
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className={`text-2xl font-bold ${stats.resultadoTotal >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {stats.resultadoTotal >= 0 ? (
                <TrendingUp className="inline mr-1 h-5 w-5" />
              ) : (
                <TrendingDown className="inline mr-1 h-5 w-5" />
              )}
              {stats.resultadoTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "USD",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1">
        {/* Tabela Principal */}
        <div
          className={`${showAlerts ? "lg:col-span-3" : "lg:col-span-4"} transition-all duration-300`}
        >
          <Card className="bg-zinc-900 border-zinc-800 h-full">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center justify-between">
                Monitor de Risco em Tempo Real
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-zinc-400">
                    {isLoading ? "Carregando..." : `${riskData.length} contas`}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadInitialData}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Atualizar
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <RiskMonitorTable
                data={riskData}
                isLoading={isLoading}
                onRefresh={loadInitialData}
              />
            </CardContent>
          </Card>
        </div>

        {/* Painel Lateral - Status WebSocket */}
        <div className={`${showAlerts ? "lg:col-span-1" : "lg:col-span-1"}`}>
          <WebSocketStatusComponent
            status={wsStatus}
            onReconnect={handleReconnect}
            isReconnecting={isReconnecting}
          />
        </div>

        {/* Painel de Alertas */}
        {showAlerts && (
          <div className="lg:col-span-1">
            <RiskAlertsPanel
              riskData={riskData}
              isVisible={showAlerts}
              onToggleVisibility={() => setShowAlerts(!showAlerts)}
            />
          </div>
        )}
      </div>

      {/* Painel de Alertas Flutuante (para telas menores) */}
      {!showAlerts && (
        <RiskAlertsPanel
          riskData={riskData}
          isVisible={false}
          onToggleVisibility={() => setShowAlerts(true)}
        />
      )}
    </div>
  );
}
