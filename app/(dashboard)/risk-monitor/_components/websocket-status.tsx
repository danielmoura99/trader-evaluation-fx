// app/(dashboard)/risk-monitor/_components/websocket-status.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wifi,
  WifiOff,
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import type { WebSocketStatus } from "../_types";

interface WebSocketStatusProps {
  status: WebSocketStatus;
  onReconnect: () => void;
  isReconnecting: boolean;
}

export function WebSocketStatus({
  status,
  onReconnect,
  isReconnecting,
}: WebSocketStatusProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Atualizar timestamp de última atualização
  useEffect(() => {
    if (status.connected && status.authenticated) {
      setLastUpdate(new Date());
    }
  }, [status.connected, status.authenticated, status.lastHeartbeat]);

  // Calcular tempo desde última atualização
  const getTimeSinceLastUpdate = () => {
    const diffMs = Date.now() - lastUpdate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) {
      return `${diffSeconds}s atrás`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m atrás`;
    } else {
      return `${Math.floor(diffSeconds / 3600)}h atrás`;
    }
  };

  // Definir cor e ícone baseado no status
  const getStatusInfo = () => {
    if (!status.connected) {
      return {
        color: "text-red-400",
        bgColor: "bg-red-500/10 border-red-500/30",
        icon: <WifiOff className="h-4 w-4" />,
        label: "Desconectado",
        description: "WebSocket não conectado à Nelogica",
        pulseColor: "bg-red-500",
      };
    }

    if (!status.authenticated) {
      return {
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10 border-yellow-500/30",
        icon: <AlertCircle className="h-4 w-4" />,
        label: "Conectado",
        description: "Aguardando autenticação",
        pulseColor: "bg-yellow-500",
      };
    }

    return {
      color: "text-green-400",
      bgColor: "bg-green-500/10 border-green-500/30",
      icon: <CheckCircle className="h-4 w-4" />,
      label: "Online",
      description: "Recebendo dados em tempo real",
      pulseColor: "bg-green-500",
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card
      className={`${statusInfo.bgColor} border transition-all duration-200`}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          {/* Status Principal - Lado Esquerdo */}
          <div className="flex items-center space-x-4">
            {/* Indicador de Status */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={statusInfo.color}>{statusInfo.icon}</div>
                {status.connected && status.authenticated && (
                  <div
                    className={`absolute -top-1 -right-1 w-2 h-2 ${statusInfo.pulseColor} rounded-full animate-pulse`}
                  />
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-zinc-100">
                    WebSocket Nelogica
                  </span>
                  <Badge
                    variant={
                      status.connected && status.authenticated
                        ? "default"
                        : "destructive"
                    }
                    className="text-xs px-2 py-0.5"
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400">
                  {statusInfo.description}
                </p>
              </div>
            </div>

            {/* Separador */}
            <div className="w-px h-8 bg-zinc-700" />

            {/* Detalhes de Conexão */}
            <div className="flex items-center space-x-6 text-xs">
              {/* Estado da Conexão */}
              <div className="flex items-center space-x-2">
                <Wifi className="h-3 w-3 text-zinc-500" />
                <span className="text-zinc-500">Conexão:</span>
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${status.connected ? "bg-green-400" : "bg-red-400"}`}
                  />
                  <span
                    className={
                      status.connected ? "text-green-400" : "text-red-400"
                    }
                  >
                    {status.connected ? "Ativa" : "Inativa"}
                  </span>
                </div>
              </div>

              {/* Estado da Autenticação */}
              <div className="flex items-center space-x-2">
                <Shield className="h-3 w-3 text-zinc-500" />
                <span className="text-zinc-500">Auth:</span>
                <div className="flex items-center space-x-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${status.authenticated ? "bg-green-400" : "bg-yellow-400"}`}
                  />
                  <span
                    className={
                      status.authenticated
                        ? "text-green-400"
                        : "text-yellow-400"
                    }
                  >
                    {status.authenticated ? "Válida" : "Pendente"}
                  </span>
                </div>
              </div>

              {/* Tentativas de Reconexão */}
              {status.reconnectAttempts > 0 && (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-3 w-3 text-zinc-500" />
                  <span className="text-zinc-500">Tentativas:</span>
                  <span className="text-orange-400">
                    {status.reconnectAttempts}
                  </span>
                </div>
              )}

              {/* Heartbeat */}
              {status.lastHeartbeat && (
                <div className="flex items-center space-x-2">
                  <Activity className="h-3 w-3 text-zinc-500" />
                  <span className="text-zinc-500">Heartbeat:</span>
                  <span className="text-green-400">
                    {status.lastHeartbeat.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {/* Última Atualização */}
              {status.connected && status.authenticated && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-zinc-500" />
                  <span className="text-zinc-500">Atualização:</span>
                  <span className="text-blue-400">
                    {getTimeSinceLastUpdate()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Controles - Lado Direito */}
          <div className="flex items-center space-x-3">
            {/* Indicador de Atividade em Tempo Real */}
            {status.connected && status.authenticated && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                <Zap className="h-3 w-3 text-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">
                  Tempo Real
                </span>
              </div>
            )}

            {/* Botão de Reconexão */}
            {!status.connected && (
              <Button
                onClick={onReconnect}
                disabled={isReconnecting}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                {isReconnecting ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                    Reconectando
                  </>
                ) : (
                  <>
                    <Wifi className="mr-1.5 h-3 w-3" />
                    Reconectar
                  </>
                )}
              </Button>
            )}

            {/* Servidor Info */}
            <div className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded border border-zinc-700">
              191.252.154.12:36309
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
