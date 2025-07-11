/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/nelogica-websocket-client.ts
"use client";

import { EventEmitter } from "events";
import type {
  WebSocketBalanceData,
  WebSocketRiskData,
  WebSocketPositionData,
  WebSocketMarginData,
  WebSocketStatus,
} from "@/app/(dashboard)/risk-monitor/_types";

/**
 * Cliente WebSocket que conecta no bridge do servidor
 * Substitui a conexão direta para a Nelogica
 */
export class NelogicaWebSocketClient extends EventEmitter {
  private eventSource: EventSource | null = null;
  private status: WebSocketStatus;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private reconnectInterval: number | null = null;

  constructor() {
    super();
    this.status = {
      connected: false,
      authenticated: false,
      lastHeartbeat: null,
      reconnectAttempts: 0,
    };
  }

  /**
   * Conecta ao bridge WebSocket do servidor
   */
  public async connect(): Promise<void> {
    try {
      if (this.eventSource) {
        this.disconnect();
      }

      console.log("🌉 [WebSocket Client] Conectando ao bridge...");

      const bridgeUrl = "/api/nelogica-ws";
      this.eventSource = new EventSource(bridgeUrl);

      return new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          console.error("⏰ [WebSocket Client] Timeout na conexão com bridge");
          this.disconnect();
          reject(new Error("Timeout na conexão com bridge"));
        }, 10000);

        this.eventSource!.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log("✅ [WebSocket Client] Conectado ao bridge!");

          this.status.connected = true;
          this.reconnectAttempts = 0;
          this.emit("statusChange", this.status);
          resolve();
        };

        this.eventSource!.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.eventSource!.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error("❌ [WebSocket Client] Erro na conexão:", error);

          this.status.connected = false;
          this.status.authenticated = false;
          this.emit("statusChange", this.status);

          // Tentar reconectar
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            console.error(
              "❌ [WebSocket Client] Máximo de tentativas atingido"
            );
            this.emit(
              "error",
              new Error("Máximo de tentativas de reconexão atingido")
            );
            reject(error);
          }
        };
      });
    } catch (error) {
      console.error("❌ [WebSocket Client] Erro crítico:", error);
      throw error;
    }
  }

  /**
   * Desconecta do bridge
   */
  public disconnect(): void {
    console.log("🔌 [WebSocket Client] Desconectando do bridge...");

    this.clearReconnectTimer();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.status.connected = false;
    this.status.authenticated = false;
    this.reconnectAttempts = 0;
    this.emit("statusChange", this.status);
  }

  /**
   * Processa mensagens recebidas do bridge
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log(`📨 [WebSocket Client] Mensagem do tipo: ${message.type}`);

      switch (message.type) {
        case "status":
          this.handleStatusUpdate(message.data);
          break;

        case "nelogica-data":
          this.handleNelogicaData(message.data);
          break;

        default:
          console.warn(
            `⚠️  [WebSocket Client] Tipo de mensagem desconhecido: ${message.type}`
          );
      }
    } catch (error) {
      console.error("❌ [WebSocket Client] Erro ao processar mensagem:", error);
    }
  }

  /**
   * Processa atualizações de status do bridge
   */
  private handleStatusUpdate(statusData: any): void {
    console.log("📊 [WebSocket Client] Status atualizado:", statusData);

    this.status = {
      ...this.status,
      connected: statusData.connected || false,
      authenticated: statusData.authenticated || false,
      lastHeartbeat: statusData.lastHeartbeat
        ? new Date(statusData.lastHeartbeat)
        : null,
      reconnectAttempts: statusData.reconnectAttempts || 0,
    };

    this.emit("statusChange", this.status);

    // Emitir evento de autenticação se necessário
    if (statusData.authenticated && !this.status.authenticated) {
      this.emit("authenticated");
    }
  }

  /**
   * Processa dados recebidos da Nelogica via bridge
   */
  private handleNelogicaData(data: any): void {
    console.log(`📨 [WebSocket Client] Dados da Nelogica: ${data.name}`);

    switch (data.name) {
      case "result":
        this.emit("result", data);
        break;

      case "balance":
        if (data.msg && Array.isArray(data.msg)) {
          this.emit("balanceUpdate", data.msg as WebSocketBalanceData[]);
        }
        break;

      case "margin":
        if (data.msg && Array.isArray(data.msg)) {
          this.emit("marginUpdate", data.msg as WebSocketMarginData[]);
        }
        break;

      case "risk-update":
        if (data.msg && Array.isArray(data.msg)) {
          this.emit("riskUpdate", data.msg as WebSocketRiskData[]);
        }
        break;

      case "position-update":
        if (data.msg && Array.isArray(data.msg)) {
          this.emit("positionUpdate", data.msg as WebSocketPositionData[]);
        }
        break;

      case "blocking-update":
        if (data.msg && Array.isArray(data.msg)) {
          this.emit("blockingUpdate", data.msg);
        }
        break;

      default:
        console.log(`📋 [WebSocket Client] Dados não categorizados:`, data);
        this.emit("data", data);
    }
  }

  /**
   * Envia comando para a Nelogica via bridge
   */
  public async sendCommand(command: any): Promise<any> {
    try {
      console.log("📤 [WebSocket Client] Enviando comando:", command);

      const response = await fetch("/api/nelogica-ws", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ [WebSocket Client] Comando enviado com sucesso:", result);

      return result;
    } catch (error) {
      console.error("❌ [WebSocket Client] Erro ao enviar comando:", error);
      throw error;
    }
  }

  /**
   * Métodos de conveniência para solicitar dados específicos
   */
  public async requestBalance(): Promise<void> {
    await this.sendCommand({
      name: "sendMessage",
      msg: {
        name: "balance",
        body: {},
      },
    });
  }

  public async requestMargin(): Promise<void> {
    await this.sendCommand({
      name: "sendMessage",
      msg: {
        name: "margin",
        body: {},
      },
    });
  }

  public async requestRisk(): Promise<void> {
    await this.sendCommand({
      name: "sendMessage",
      msg: {
        name: "risk",
        body: {},
      },
    });
  }

  public async requestPosition(): Promise<void> {
    await this.sendCommand({
      name: "sendMessage",
      msg: {
        name: "position",
        body: {},
      },
    });
  }

  /**
   * Agenda reconexão automática
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempts++;

    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);
    console.log(
      `🔄 [WebSocket Client] Reconectando em ${delay}ms (tentativa ${this.reconnectAttempts})`
    );

    this.reconnectInterval = window.setTimeout(() => {
      console.log(
        `🔄 [WebSocket Client] Tentativa de reconexão ${this.reconnectAttempts}`
      );
      this.connect().catch((error) => {
        console.error("❌ [WebSocket Client] Falha na reconexão:", error);
      });
    }, delay);
  }

  /**
   * Limpa timer de reconexão
   */
  private clearReconnectTimer(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  /**
   * Métodos de status público
   */
  public getStatus(): WebSocketStatus {
    return { ...this.status };
  }

  public isConnected(): boolean {
    return this.status.connected;
  }

  public isAuthenticated(): boolean {
    return this.status.authenticated;
  }
}
