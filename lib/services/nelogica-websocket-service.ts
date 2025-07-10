/* eslint-disable @typescript-eslint/no-unused-vars */
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
  msg: Record<string, never>;
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
 * VERSÃO SEM SIMULAÇÃO - Conecta apenas com servidor real
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

      console.log("[Nelogica WebSocket] Iniciando conexão...");
      console.log("[Nelogica WebSocket] URL:", this.url);
      console.log(
        "[Nelogica WebSocket] Token:",
        this.token ? `${this.token.substring(0, 8)}...` : "Não fornecido"
      );

      this.emit("statusChange", { ...this.status, connected: false });

      // Verificar se é ambiente seguro (HTTPS) com WebSocket não seguro (WS)
      if (
        typeof window !== "undefined" &&
        window.location.protocol === "https:" &&
        this.url.startsWith("ws://")
      ) {
        console.warn(
          "[Nelogica WebSocket] ⚠️  AVISO: Tentando usar WS não seguro em página HTTPS"
        );
        console.warn(
          "[Nelogica WebSocket] Isso pode ser bloqueado pelo navegador por questões de segurança"
        );
      }

      this.ws = new WebSocket(this.url);

      // Promise para aguardar resultado da conexão
      return new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          console.error("[Nelogica WebSocket] ⏰ Timeout na conexão (10s)");
          if (this.ws) {
            this.ws.close();
          }
          reject(new Error("Timeout na conexão WebSocket"));
        }, 10000);

        this.ws!.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log(
            "[Nelogica WebSocket] ✅ Conexão WebSocket estabelecida com sucesso!"
          );

          this.status.connected = true;
          this.status.reconnectAttempts = this.reconnectAttempts;
          this.emit("statusChange", this.status);

          // Autenticar automaticamente
          this.authenticate();
          resolve();
        };

        this.ws!.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws!.onclose = (event) => {
          clearTimeout(connectionTimeout);
          const reason = event.reason || "Motivo não especificado";
          console.log(
            `[Nelogica WebSocket] Conexão fechada (${event.code}): ${reason}`
          );

          // Diagnósticos específicos
          this.diagnoseProblem(event.code, event.reason);

          this.status.connected = false;
          this.status.authenticated = false;
          this.emit("statusChange", this.status);

          // Se for a primeira tentativa, rejeitar a promise
          if (this.reconnectAttempts === 0) {
            reject(
              new Error(`Falha na conexão WebSocket (${event.code}): ${reason}`)
            );
          }
          // Caso contrário, tentar reconectar se dentro do limite
          else if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            console.error(
              "[Nelogica WebSocket] Máximo de tentativas de reconexão atingido"
            );
            this.emit(
              "error",
              new Error("Máximo de tentativas de reconexão atingido")
            );
          }
        };

        this.ws!.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error("[Nelogica WebSocket] ❌ Erro detalhado:");
          console.error("[Nelogica WebSocket] Tipo:", error.type);
          console.error(
            "[Nelogica WebSocket] Target readyState:",
            (error.target as WebSocket)?.readyState
          );

          // Diagnóstico adicional
          this.diagnoseConnectionError();

          this.emit("error", error);

          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        };
      });
    } catch (error) {
      console.error(
        "[Nelogica WebSocket] ❌ Erro crítico ao tentar conectar:",
        error
      );
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * Desconecta o WebSocket
   */
  public disconnect(): void {
    console.log("[Nelogica WebSocket] Desconectando...");

    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, "Desconexão solicitada pelo cliente");
      this.ws = null;
    }

    this.status.connected = false;
    this.status.authenticated = false;
    this.reconnectAttempts = 0;
    this.emit("statusChange", this.status);
  }

  /**
   * Programa reconexão automática
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempts++;

    console.log(
      `[Nelogica WebSocket] Agendando reconexão em ${this.reconnectDelay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectInterval = setTimeout(() => {
      console.log(
        `[Nelogica WebSocket] Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
      );
      this.connect().catch((error) => {
        console.error("[Nelogica WebSocket] Falha na reconexão:", error);
      });
    }, this.reconnectDelay);
  }

  /**
   * Limpa o timer de reconexão
   */
  private clearReconnectTimer(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  /**
   * Autentica com o servidor
   */
  private authenticate(): void {
    const authMessage: AuthenticateMessage = {
      name: "authenticate",
      request_id: this.generateRequestId(),
      msg: {
        token: this.token,
      },
    };

    console.log("[Nelogica WebSocket] Enviando autenticação...");
    this.sendMessage(authMessage);
  }

  /**
   * Envia mensagem para o WebSocket
   */
  private sendMessage(message: BaseMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      console.log(`[Nelogica WebSocket] Enviando: ${message.name}`);
      this.ws.send(messageStr);
    } else {
      console.warn(
        "[Nelogica WebSocket] Tentativa de envio com WebSocket fechado"
      );
    }
  }

  /**
   * Gera ID único para requisições
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Inicia heartbeat para manter conexão viva
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
      console.error(
        "[Nelogica WebSocket] Falha na autenticação:",
        message.msg.error
      );
      this.emit("authenticationFailed", message.msg.error);
    }
  }

  /**
   * Subscreve para receber atualizações em tempo real
   */
  private subscribeToUpdates(): void {
    // Subscrever para atualizações de risco
    const riskSubscription: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "risk-update",
        body: {},
      },
    };

    // Subscrever para atualizações de posição
    const positionSubscription: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "position-update",
        body: {},
      },
    };

    // Subscrever para atualizações de bloqueio
    const blockingSubscription: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "blocking-update",
        body: {},
      },
    };

    this.sendMessage(riskSubscription);
    this.sendMessage(positionSubscription);
    this.sendMessage(blockingSubscription);
  }

  /**
   * Solicita dados de saldo
   */
  public requestBalance(): void {
    const balanceRequest: SendMessage = {
      name: "sendMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "balance",
        body: {},
      },
    };

    this.sendMessage(balanceRequest);
  }

  /**
   * Solicita dados de margem
   */
  public requestMargin(): void {
    const marginRequest: SendMessage = {
      name: "sendMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "margin",
        body: {},
      },
    };

    this.sendMessage(marginRequest);
  }

  /**
   * Solicita dados de risco
   */
  public requestRisk(): void {
    const riskRequest: SendMessage = {
      name: "sendMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "risk",
        body: {},
      },
    };

    this.sendMessage(riskRequest);
  }

  /**
   * Solicita dados de posição
   */
  public requestPosition(): void {
    const positionRequest: SendMessage = {
      name: "sendMessage",
      request_id: this.generateRequestId(),
      msg: {
        name: "position",
        body: {},
      },
    };

    this.sendMessage(positionRequest);
  }

  /**
   * Handlers para diferentes tipos de dados
   */
  private handleResult(message: any): void {
    console.log("[Nelogica WebSocket] Resultado:", message);
  }

  private handleBalance(message: any): void {
    console.log("[Nelogica WebSocket] Dados de saldo recebidos");
    if (message.msg && Array.isArray(message.msg)) {
      this.emit("balanceUpdate", message.msg as WebSocketBalanceData[]);
    }
  }

  private handleMargin(message: any): void {
    console.log("[Nelogica WebSocket] Dados de margem recebidos");
    if (message.msg && Array.isArray(message.msg)) {
      this.emit("marginUpdate", message.msg as WebSocketMarginData[]);
    }
  }

  private handleRiskUpdate(message: any): void {
    console.log("[Nelogica WebSocket] Atualização de risco recebida");
    if (message.msg && Array.isArray(message.msg)) {
      this.emit("riskUpdate", message.msg as WebSocketRiskData[]);
    }
  }

  private handlePositionUpdate(message: any): void {
    console.log("[Nelogica WebSocket] Atualização de posição recebida");
    if (message.msg && Array.isArray(message.msg)) {
      this.emit("positionUpdate", message.msg as WebSocketPositionData[]);
    }
  }

  private handleBlockingUpdate(message: any): void {
    console.log("[Nelogica WebSocket] Atualização de bloqueio recebida");
    if (message.msg && Array.isArray(message.msg)) {
      this.emit("blockingUpdate", message.msg);
    }
  }

  /**
   * Diagnostica problemas específicos baseado no código de fechamento
   */
  private diagnoseProblem(code: number, reason: string): void {
    console.log("\n🔍 [DIAGNÓSTICO NELOGICA WEBSOCKET] 🔍");

    switch (code) {
      case 1006:
        console.log("🚨 PROBLEMA IDENTIFICADO: Conexão fechada anormalmente");
        console.log("📋 POSSÍVEIS CAUSAS:");
        console.log("   1. 🛡️  Firewall corporativo bloqueando WebSocket");
        console.log("   2. 🌐 Proxy/VPN interferindo na conexão");
        console.log("   3. 📍 IP não liberado na Nelogica (mais provável)");
        console.log("   4. 🔒 Política CORS do navegador");
        console.log("   5. ⚡ Servidor Nelogica temporariamente indisponível");
        console.log("   6. 🔐 HTTPS → WS (protocolo misto) bloqueado");
        console.log("\n💡 SOLUÇÕES RECOMENDADAS:");
        console.log("   ✅ Solicitar liberação do seu IP na Nelogica");
        console.log(
          "   ✅ Verificar se o endereço 191.252.154.12:36302 está acessível"
        );
        console.log("   ✅ Testar em rede diferente (4G/celular)");
        console.log("   ✅ Verificar se não há proxy/VPN ativo");
        break;

      case 1002:
        console.log("🚨 PROBLEMA: Erro de protocolo WebSocket");
        console.log(
          "💡 CAUSA PROVÁVEL: Token ou formato de mensagem incorreto"
        );
        break;

      case 1008:
        console.log("🚨 PROBLEMA: Violação de política");
        console.log("💡 CAUSA PROVÁVEL: IP não autorizado ou token inválido");
        break;

      case 1011:
        console.log("🚨 PROBLEMA: Erro interno do servidor Nelogica");
        console.log("💡 AÇÃO: Contatar suporte da Nelogica");
        break;

      default:
        console.log(`🚨 CÓDIGO DE ERRO: ${code}`);
        console.log("💡 Verificar documentação WebSocket ou contatar Nelogica");
    }

    console.log("\n📞 PRÓXIMOS PASSOS:");
    console.log("   1. Anotar este erro e enviar para a Nelogica");
    console.log("   2. Solicitar liberação/verificação do acesso WebSocket");
    console.log("   3. Validar token de autenticação");
    console.log("═══════════════════════════════════════════════════════\n");
  }

  /**
   * Diagnostica erros gerais de conexão
   */
  private diagnoseConnectionError(): void {
    console.log("\n🔍 [DIAGNÓSTICO DE ERRO] 🔍");

    // Verificar protocolo
    const isHttps =
      typeof window !== "undefined" && window.location.protocol === "https:";
    const isWsSecure = this.url.startsWith("wss://");

    if (isHttps && !isWsSecure) {
      console.log("🚨 PROBLEMA CRÍTICO: Mixed Content");
      console.log(
        "   📍 Página HTTPS tentando conectar em WebSocket não seguro (WS)"
      );
      console.log("   💡 SOLUÇÃO: Use WSS:// ou acesse via HTTP://");
    }

    console.log("📊 INFORMAÇÕES TÉCNICAS:");
    console.log(`   🌐 URL: ${this.url}`);
    console.log(
      `   🔐 Protocolo da página: ${typeof window !== "undefined" ? window.location.protocol : "N/A"}`
    );
    console.log(`   🔒 WebSocket seguro: ${isWsSecure ? "Sim" : "Não"}`);
    console.log(
      `   🛡️  Mixed content: ${isHttps && !isWsSecure ? "SIM (PROBLEMA!)" : "Não"}`
    );
  }
}
