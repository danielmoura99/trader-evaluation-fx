/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/risk-monitor/_components/risk-alerts-panel.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  X,
  Bell,
  BellOff,
  //Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RiskAlert, RiskMonitorData } from "../_types";

interface RiskAlertsPanelProps {
  riskData: RiskMonitorData[];
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function RiskAlertsPanel({
  riskData,
  isVisible,
  onToggleVisibility,
}: RiskAlertsPanelProps) {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();

  // Gerar alertas baseado nos dados de risco
  useEffect(() => {
    const newAlerts: RiskAlert[] = [];
    const now = new Date(); // ← ADICIONADA DECLARAÇÃO DA VARIÁVEL

    riskData.forEach((data) => {
      // Alerta crítico: Limite de perda excedido
      if (data.drawdownDiario >= data.limitePerdaDiaria) {
        newAlerts.push({
          id: `critical-${data.subconta}-${now.getTime()}`,
          subconta: data.subconta,
          nome: data.nome,
          type: "LOSS_LIMIT_EXCEEDED",
          message: `Limite de perda diária excedido! Drawdown: ${data.drawdownDiario.toFixed(2)} / Limite: ${data.limitePerdaDiaria.toFixed(2)}`,
          severity: "high",
          timestamp: now,
          acknowledged: false,
        });
      }

      // Alerta de atenção: Próximo ao limite (80%)
      else if (data.drawdownDiario >= data.limitePerdaDiaria * 0.8) {
        newAlerts.push({
          id: `warning-${data.subconta}-${now.getTime()}`,
          subconta: data.subconta,
          nome: data.nome,
          type: "APPROACHING_LIMIT",
          message: `Atenção! Próximo ao limite de perda. Drawdown: ${data.drawdownDiario.toFixed(2)} (${((data.drawdownDiario / data.limitePerdaDiaria) * 100).toFixed(0)}% do limite)`,
          severity: "medium",
          timestamp: now,
          acknowledged: false,
        });
      }

      // Alerta de conexão perdida
      if (data.connectionStatus === "disconnected") {
        newAlerts.push({
          id: `connection-${data.subconta}-${now.getTime()}`,
          subconta: data.subconta,
          nome: data.nome,
          type: "CONNECTION_LOST",
          message: `Conexão perdida com a conta ${data.subconta}`,
          severity: "low",
          timestamp: now,
          acknowledged: false,
        });
      }
    });

    // Verificar se há novos alertas críticos para notificar
    const criticalAlerts = newAlerts.filter(
      (alert) =>
        alert.severity === "high" &&
        !alerts.some((existing) => existing.id === alert.id)
    );

    if (criticalAlerts.length > 0) {
      criticalAlerts.forEach((alert) => {
        toast({
          title: "⚠️ ALERTA CRÍTICO",
          description: `${alert.nome}: ${alert.message}`,
          variant: "destructive",
        });

        // Som de alerta (se habilitado)
        if (soundEnabled) {
          playAlertSound();
        }
      });
    }

    // Manter apenas os alertas mais recentes (últimas 24h) e não reconhecidos
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const filteredAlerts = [...alerts, ...newAlerts]
      .filter((alert) => alert.timestamp > cutoff)
      .filter(
        (alert, index, self) =>
          index === self.findIndex((a) => a.id === alert.id)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50); // Máximo 50 alertas

    setAlerts(filteredAlerts);
  }, [riskData, soundEnabled]);

  // Reproduzir som de alerta
  const playAlertSound = () => {
    try {
      // Criar um som de alerta simples usando Web Audio API
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn("Não foi possível reproduzir som de alerta:", error);
    }
  };

  // Reconhecer alerta
  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  // Remover alerta
  const removeAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  // Limpar todos os alertas
  const clearAllAlerts = () => {
    setAlerts([]);
    toast({
      title: "Alertas Limpos",
      description: "Todos os alertas foram removidos",
    });
  };

  // Obter cor do alerta baseado na severidade
  const getAlertColor = (severity: RiskAlert["severity"]) => {
    switch (severity) {
      case "high":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  // Obter ícone do alerta
  const getAlertIcon = (type: RiskAlert["type"]) => {
    switch (type) {
      case "LOSS_LIMIT_EXCEEDED":
        return <XCircle className="h-4 w-4" />;
      case "APPROACHING_LIMIT":
        return <AlertTriangle className="h-4 w-4" />;
      case "CONNECTION_LOST":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Formatar tempo relativo
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMinutes < 1) return "Agora";
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  // Contar alertas por severidade
  const alertCounts = {
    high: alerts.filter((a) => a.severity === "high" && !a.acknowledged).length,
    medium: alerts.filter((a) => a.severity === "medium" && !a.acknowledged)
      .length,
    low: alerts.filter((a) => a.severity === "low" && !a.acknowledged).length,
    total: alerts.filter((a) => !a.acknowledged).length,
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggleVisibility}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Bell className="h-4 w-4 mr-2" />
        Alertas
        {alertCounts.total > 0 && (
          <Badge variant="destructive" className="ml-2">
            {alertCounts.total}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-100">Alertas de Risco</span>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-6 w-6 p-0"
            >
              {soundEnabled ? (
                <Bell className="h-3 w-3 text-green-400" />
              ) : (
                <BellOff className="h-3 w-3 text-zinc-500" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estatísticas de Alertas */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-red-500 font-bold">{alertCounts.high}</div>
            <div className="text-zinc-500">Críticos</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-500 font-bold">
              {alertCounts.medium}
            </div>
            <div className="text-zinc-500">Médios</div>
          </div>
          <div className="text-center">
            <div className="text-blue-500 font-bold">{alertCounts.low}</div>
            <div className="text-zinc-500">Baixos</div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllAlerts}
            disabled={alerts.length === 0}
            className="text-xs"
          >
            Limpar Todos
          </Button>

          <div className="flex items-center text-xs text-zinc-500">
            Som: {soundEnabled ? "Ativo" : "Inativo"}
          </div>
        </div>

        {/* Lista de Alertas */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <div className="text-sm text-zinc-400">Nenhum alerta ativo</div>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border transition-all ${
                    alert.acknowledged
                      ? "opacity-50 bg-zinc-800/50 border-zinc-700"
                      : getAlertColor(alert.severity)
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      <div
                        className={alert.acknowledged ? "text-zinc-500" : ""}
                      >
                        {getAlertIcon(alert.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-zinc-100">
                            {alert.nome}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {alert.subconta}
                          </Badge>
                        </div>

                        <p className="text-xs text-zinc-300 break-words">
                          {alert.message}
                        </p>

                        <div className="text-xs text-zinc-500 mt-1">
                          {formatRelativeTime(alert.timestamp)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1 ml-2">
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAlert(alert.id)}
                        className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
