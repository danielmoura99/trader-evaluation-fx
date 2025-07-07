/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/nelogica-websocket-service.ts
"use client";

import { EventEmitter } from "events";
import type {
  WebSocketBalanceData,
  WebSocketRiskData,
  WebSocketPositionData,
  WebSocketMarginData,
  WebSocketStatus,
} from "@/app/(dashboard)/risk-monitor/_types";

// Interfaces para mensagens WebSocket
interface BaseMessage {
  name: string;
  request_id: string;
  msg: any;
}

interface AuthenticateMessage extends BaseMessage {
  name: "authenticate";
  msg: {
    token: string;
  };
}

interface KeepAliveMessage extends BaseMessage {
  name: "keepAlive";
  msg: object;
}

interface SubscribeMessage extends BaseMessage {
  name: "subscribeMessage";
  msg: {
    name: string;
    body: any;
  };
}

interface SendMessage extends BaseMessage {
  name: "sendMessage";
  msg: {
    name: string;
    body: any;
  };
}

/**
 * Classe para gerenciar WebSocket da Nelogica em tempo real
 */
export class NelogicaWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private status: WebSocketStatus;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000; // 5 segundos

  constructor(url: string, token: string) {
    super();
    this.url = url;
    this.token = token;
    this.status = {
      connected: false,
      authenticated: false,
      lastHeartbeat: null,
      reconnectAttempts: 0,
    };
  }

  /**
   * Conecta ao WebSocket da Nelogica
   */
  public async connect(): Promise<void> {
    try {
      if (this.ws) {
        this.disconnect();
      }

      console.log("[Nelogica WebSocket] Conectando...");
      this.emit("statusChange", { ...this.status, connected: false });

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[Nelogica WebSocket] Conectado com sucesso");
        this.status.connected = true;
        this.status.reconnectAttempts = this.reconnectAttempts;
        this.emit("statusChange", this.status);
        this.authenticate();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log(
          `[Nelogica WebSocket] Conexão fechada: ${event.code} - ${event.reason}`
        );
        this.status.connected = false;
        this.status.authenticated = false;
        this.emit("statusChange", this.status);

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error("[Nelogica WebSocket] Erro:", error);
        this.emit("error", error);
      };
    } catch (error) {
      console.error("[Nelogica WebSocket] Erro ao conectar:", error);
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * Desconecta do WebSocket
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.status.connected = false;
    this.status.authenticated = false;
    this.emit("statusChange", this.status);
  }

  /**
   * Força uma tentativa de reconexão
   */
  public forceReconnect(): void {
    this.reconnectAttempts = 0;
    this.disconnect();
    this.connect();
  }

  /**
   * Agenda uma tentativa de reconexão
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    console.log(
      `[Nelogica WebSocket] Agendando reconexão (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectInterval = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts); // Delay exponencial
  }

  /**
   * Autentica com o token fornecido
   */
  private authenticate(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const authMessage: AuthenticateMessage = {
      name: "authenticate",
      request_id: this.generateRequestId(),
      msg: {
        token: this.token,
      },
    };

    this.sendMessage(authMessage);
  }

  /**
   * Inicia o heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const keepAliveMessage: KeepAliveMessage = {
          name: "keepAlive",
          request_id: this.generateRequestId(),
          msg: {},
        };

        this.sendMessage(keepAliveMessage);
        this.status.lastHeartbeat = new Date();
        this.emit("statusChange", this.status);
      }
    }, 55000); // 55 segundos (menor que o timeout de 60s)
  }

  /**
   * Para o heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Processa mensagens recebidas do WebSocket
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log(`[Nelogica WebSocket] Mensagem recebida: ${message.name}`);

      switch (message.name) {
        case "authenticated":
          this.handleAuthenticated(message);
          break;

        case "result":
          this.handleResult(message);
          break;

        case "balance":
          this.handleBalance(message);
          break;

        case "margin":
          this.handleMargin(message);
          break;

        case "risk-update":
          this.handleRiskUpdate(message);
          break;

        case "position-update":
          this.handlePositionUpdate(message);
          break;

        case "blocking-update":
          this.handleBlockingUpdate(message);
          break;

        default:
          console.log(
            `[Nelogica WebSocket] Mensagem não tratada: ${message.name}`
          );
      }
    } catch (error) {
      console.error("[Nelogica WebSocket] Erro ao processar mensagem:", error);
    }
  }

  /**
   * Trata resposta de autenticação
   */
  private handleAuthenticated(message: any): void {
    if (message.msg.success) {
      console.log("[Nelogica WebSocket] Autenticado com sucesso");
      this.status.authenticated = true;
      this.reconnectAttempts = 0;
      this.emit("statusChange", this.status);
      this.startHeartbeat();
      this.subscribeToUpdates();
      this.emit("authenticated");
    } else {
      console.error("[Nelogica WebSocket] Falha na autenticação");
      this.emit("authenticationFailed");
    }
  }

  /**
   * Trata resultado de operações
   */
  private handleResult(message: any): void {
    console.log("[Nelogica WebSocket] Resultado:", message.msg);
    this.emit("result", message.msg);
  }

  /**
   * Trata atualizações de saldo
   */
  private handleBalance(message: any): void {
    const balances: WebSocketBalanceData[] = message.msg;
    console.log(
      `[Nelogica WebSocket] Atualizações de saldo: ${balances.length} contas`
    );
    this.emit("balanceUpdate", balances);
  }

  /**
   * Trata atualizações de margem
   */
  private handleMargin(message: any): void {
    const margins: WebSocketMarginData[] = message.msg;
    console.log(
      `[Nelogica WebSocket] Atualizações de margem: ${margins.length} contas`
    );
    this.emit("marginUpdate", margins);
  }

  /**
   * Trata atualizações de risco
   */
  private handleRiskUpdate(message: any): void {
    const risks: WebSocketRiskData[] = message.msg;
    console.log(
      `[Nelogica WebSocket] Atualizações de risco: ${risks.length} contas`
    );
    this.emit("riskUpdate", risks);
  }

  /**
   * Trata atualizações de posição
   */
  private handlePositionUpdate(message: any): void {
    const positions: WebSocketPositionData[] = message.msg;
    console.log(
      `[Nelogica WebSocket] Atualizações de posição: ${positions.length} contas`
    );
    this.emit("positionUpdate", positions);
  }

  /**
   * Trata atualizações de bloqueio
   */
  private handleBlockingUpdate(message: any): void {
    const blockings = message.msg;
    console.log(
      `[Nelogica WebSocket] Atualizações de bloqueio: ${blockings.length} contas`
    );
    this.emit("blockingUpdate", blockings);
  }

  /**
   * Assina todas as atualizações necessárias
   */
  private subscribeToUpdates(): void {
    // Assinar atualizações de saldo
    this.subscribeToBalanceChanges();

    // Assinar atualizações de margem
    this.subscribeToMarginChanges();

    // Assinar atualizações de risco
    this.subscribeToRiskChanges();

    // Assinar atualizações de posição
    this.subscribeToPositionChanges();

    // Assinar atualizações de bloqueio
    this.subscribeToBlockingChanges();
  }

  /**
   * Assina mudanças de saldo
   */
  private subscribeToBalanceChanges(): void {
    const subscribeMessage: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "balance-changed",
        body: {},
      },
    };

    this.sendMessage(subscribeMessage);
  }

  /**
   * Assina mudanças de margem
   */
  private subscribeToMarginChanges(): void {
    const subscribeMessage: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "margin-changed",
        body: {},
      },
    };

    this.sendMessage(subscribeMessage);
  }

  /**
   * Assina mudanças de risco
   */
  private subscribeToRiskChanges(): void {
    const subscribeMessage: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "risk-changed",
        body: {},
      },
    };

    this.sendMessage(subscribeMessage);
  }

  /**
   * Assina mudanças de posição
   */
  private subscribeToPositionChanges(): void {
    const subscribeMessage: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "position-changed",
        body: {},
      },
    };

    this.sendMessage(subscribeMessage);
  }

  /**
   * Assina mudanças de bloqueio
   */
  private subscribeToBlockingChanges(): void {
    const subscribeMessage: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "blocking-changed",
        body: {},
      },
    };

    this.sendMessage(subscribeMessage);
  }

  /**
   * Solicita dados de saldo
   */
  public requestBalance(account?: string): void {
    const sendMessage: SendMessage = {
      name: "sendMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "get-balance",
        body: {
          account: account,
        },
      },
    };

    this.sendMessage(sendMessage);
  }

  /**
   * Solicita dados de margem
   */
  public requestMargin(account?: string): void {
    const sendMessage: SendMessage = {
      name: "sendMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "get-margin",
        body: {
          account: account,
        },
      },
    };

    this.sendMessage(sendMessage);
  }

  /**
   * Solicita dados de risco
   */
  public requestRisk(account?: string): void {
    const sendMessage: SendMessage = {
      name: "sendMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "get-risk-update",
        body: {
          account: account,
        },
      },
    };

    this.sendMessage(sendMessage);
  }

  /**
   * Solicita dados de posição
   */
  public requestPosition(account?: string): void {
    const sendMessage: SendMessage = {
      name: "sendMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "get-position-update",
        body: {
          account: account,
        },
      },
    };

    this.sendMessage(sendMessage);
  }

  /**
   * Envia uma mensagem para o WebSocket
   */
  private sendMessage(message: BaseMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn(
        "[Nelogica WebSocket] Tentativa de enviar mensagem com WebSocket não conectado"
      );
    }
  }

  /**
   * Gera um ID único para requisições
   */
  private generateRequestId(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  /**
   * Retorna o status atual da conexão
   */
  public getStatus(): WebSocketStatus {
    return { ...this.status };
  }

  /**
   * Verifica se está conectado e autenticado
   */
  public isReady(): boolean {
    return this.status.connected && this.status.authenticated;
  }
}
