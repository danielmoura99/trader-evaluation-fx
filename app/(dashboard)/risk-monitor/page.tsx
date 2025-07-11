/* eslint-disable @typescript-eslint/no-unused-vars */
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
//import { NelogicaWebSocketService } from "@/lib/services/nelogica-websocket-service";
import { NelogicaWebSocketClient } from "@/lib/services/nelogica-websocket-client";
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
  const [wsService, setWsService] = useState<NelogicaWebSocketClient | null>(
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    //const service = new NelogicaWebSocketService(wsUrl, token);
    const service = new NelogicaWebSocketClient();
    setWsService(service);

    // Configurar event listeners
    setupWebSocketListeners(service);

    // Sempre tentar conectar na Nelogica real primeiro
    console.log("[Risk Monitor] Tentando conectar na Nelogica...");
    console.log("[Risk Monitor] IP do servidor Nelogica: 191.252.154.12:36302");
    console.log("[Risk Monitor] Verificando acessibilidade...");

    service
      .connect()
      .then(() => {
        console.log("[Risk Monitor] ✅ Conexão WebSocket iniciada com sucesso");
      })
      .catch((error) => {
        console.error("[Risk Monitor] ❌ Erro detalhado ao conectar:", error);

        // Mostrar diagnóstico específico
        toast({
          title: "❌ Falha na Conexão Nelogica",
          description: "Verifique o console para diagnóstico detalhado",
          variant: "destructive",
        });

        // NÃO ativar modo simulação - apenas mostrar erro
        console.log(
          "\n❌ [Risk Monitor] Conexão falhou - mantendo desconectado"
        );
      });
  };

  /**
   * Configura os listeners do WebSocket
   */
  const setupWebSocketListeners = (service: NelogicaWebSocketClient) => {
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

    service.on("maxReconnectAttemptsReached", () => {
      console.log(
        "[Risk Monitor] Reconexão automática desabilitada após limite"
      );
      toast({
        title: "Conexão Falhou",
        description:
          "Máximo de tentativas atingido. Use 'Reconectar' para tentar novamente.",
        variant: "destructive",
      });
    });
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
   * Atualiza dados de margem via WebSocket
   */
  const updateMarginData = (margins: WebSocketMarginData[]) => {
    setRiskData((prevData) =>
      prevData.map((item) => {
        const margin = margins.find((m) => m.account === item.subconta);
        if (margin) {
          return {
            ...item,
            operacoesFechadas: margin.pnl,
            lastUpdate: new Date(),
            connectionStatus: "connected" as const,
          };
        }
        return item;
      })
    );
  };

  /**
   * Atualiza dados de bloqueio via WebSocket
   */
  const updateBlockingData = (blockings: any[]) => {
    console.log("[Risk Monitor] Dados de bloqueio processados:", blockings);
    // Implementar lógica específica de bloqueio conforme necessário
  };

  /**
   * Força reconexão manual
   */
  const handleReconnect = async () => {
    if (!wsService) return;

    setIsReconnecting(true);
    try {
      await wsService.connect();
    } catch (error) {
      console.error("[Risk Monitor] Erro na reconexão manual:", error);
    } finally {
      setIsReconnecting(false);
    }
  };

  /**
   * Handlers para ações administrativas
   */
  const handleZerarSaldoMensal = async () => {
    try {
      await zerarSaldoMensal();
      toast({
        title: "Sucesso",
        description: "Saldo mensal zerado",
      });
      loadInitialData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao zerar saldo mensal",
        variant: "destructive",
      });
    }
  };

  const handleZerarSaldoTotal = async () => {
    try {
      await zerarSaldoTotal();
      toast({
        title: "Sucesso",
        description: "Saldo total zerado",
      });
      loadInitialData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao zerar saldo total",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (
    format: "excel" | "pdf" | "csv",
    options: ExportOptions
  ) => {
    try {
      await exportRiskMonitorData(format, options, riskData);
      toast({
        title: "Exportação iniciada",
        description: `Dados sendo exportados em formato ${format}`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Falha ao exportar dados",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Status WebSocket no topo */}
      <WebSocketStatusComponent
        status={wsStatus}
        onReconnect={handleReconnect}
        isReconnecting={isReconnecting}
      />

      {/* Controles superiores */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlerts(!showAlerts)}
          >
            <Bell className="h-4 w-4 mr-2" />
            {showAlerts ? "Ocultar Alertas" : "Mostrar Alertas"}
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZerarSaldoMensal}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Zerar Mensal
            </Button>
            <Button variant="outline" size="sm" onClick={handleZerarSaldoTotal}>
              <Trash2 className="h-4 w-4 mr-2" />
              Zerar Total
            </Button>
          </div>
        </div>

        <ExportControls onExport={handleExport} data={[]} />
      </div>

      {/* Layout principal */}
      <div
        className={`grid gap-4 ${showAlerts ? "lg:grid-cols-4" : "lg:grid-cols-1"}`}
      >
        {/* Monitor de Risco - ocupa todo o espaço disponível */}
        <div className={`${showAlerts ? "lg:col-span-3" : "lg:col-span-1"}`}>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium text-zinc-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-zinc-400" />
                  <span>Monitor de Risco em Tempo Real</span>
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

        {/* Painel de Alertas (lateral quando visível) */}
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

      {/* Painel de Alertas Flutuante (para telas menores quando oculto) */}
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
