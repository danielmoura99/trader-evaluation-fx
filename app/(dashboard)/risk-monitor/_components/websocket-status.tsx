// app/(dashboard)/risk-monitor/_components/websocket-status.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20",
        icon: <WifiOff className="h-4 w-4" />,
        label: "Desconectado",
        description: "WebSocket não conectado",
      };
    }

    if (!status.authenticated) {
      return {
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10 border-yellow-500/20",
        icon: <AlertCircle className="h-4 w-4" />,
        label: "Conectado",
        description: "Aguardando autenticação",
      };
    }

    return {
      color: "text-green-500",
      bgColor: "bg-green-500/10 border-green-500/20",
      icon: <CheckCircle className="h-4 w-4" />,
      label: "Autenticado",
      description: "Recebendo dados em tempo real",
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card
      className={`${statusInfo.bgColor} border transition-all duration-200`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={statusInfo.color}>{statusInfo.icon}</div>
            <span className="text-zinc-100">Status WebSocket</span>
          </div>

          <Badge
            variant={
              status.connected && status.authenticated
                ? "default"
                : "destructive"
            }
            className="text-xs"
          >
            {statusInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Descrição do status */}
        <p className="text-sm text-zinc-400">{statusInfo.description}</p>

        {/* Informações detalhadas */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Conexão:</span>
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${status.connected ? "bg-green-500" : "bg-red-500"}`}
              />
              <span
                className={status.connected ? "text-green-400" : "text-red-400"}
              >
                {status.connected ? "Ativa" : "Inativa"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Autenticação:</span>
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${status.authenticated ? "bg-green-500" : "bg-yellow-500"}`}
              />
              <span
                className={
                  status.authenticated ? "text-green-400" : "text-yellow-400"
                }
              >
                {status.authenticated ? "Válida" : "Pendente"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Tentativas de Reconexão:</span>
            <span className="text-zinc-300">{status.reconnectAttempts}</span>
          </div>

          {status.lastHeartbeat && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Último Heartbeat:</span>
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3 text-green-400" />
                <span className="text-zinc-300">
                  {status.lastHeartbeat.toLocaleTimeString("pt-BR")}
                </span>
              </div>
            </div>
          )}

          {status.connected && status.authenticated && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Última Atualização:</span>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-blue-400" />
                <span className="text-zinc-300">
                  {getTimeSinceLastUpdate()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Botão de reconexão */}
        {!status.connected && (
          <Button
            onClick={onReconnect}
            disabled={isReconnecting}
            size="sm"
            variant="outline"
            className="w-full mt-2"
          >
            {isReconnecting ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Reconectando...
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-3 w-3" />
                Reconectar
              </>
            )}
          </Button>
        )}

        {/* Indicador de atividade em tempo real */}
        {status.connected && status.authenticated && (
          <div className="flex items-center justify-center pt-2">
            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs">Recebendo dados em tempo real</span>
              <Activity className="h-3 w-3 animate-pulse" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
