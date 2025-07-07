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
          console.log("[Nelogica WebSocket] ReadyState:", this.ws?.readyState);

          this.status.connected = true;
          this.status.reconnectAttempts = this.reconnectAttempts;
          this.emit("statusChange", this.status);

          console.log("[Nelogica WebSocket] 🔐 Iniciando autenticação...");
          this.authenticate();
          resolve();
        };

        this.ws!.onmessage = (event) => {
          console.log(
            "[Nelogica WebSocket] 📨 Mensagem recebida:",
            event.data.substring(0, 100) + "..."
          );
          this.handleMessage(event.data);
        };

        this.ws!.onclose = (event) => {
          clearTimeout(connectionTimeout);

          // Códigos de erro mais comuns
          const closeReasons: Record<number, string> = {
            1000: "Fechamento normal",
            1001: "Endpoint saindo (página fechando)",
            1002: "Erro de protocolo",
            1003: "Tipo de dados não suportado",
            1004: "Reservado",
            1005: "Código não fornecido",
            1006: "Conexão fechada anormalmente (sem handshake de fechamento)",
            1007: "Dados inconsistentes",
            1008: "Violação de política",
            1009: "Mensagem muito grande",
            1010: "Extensão obrigatória ausente",
            1011: "Erro interno do servidor",
            1012: "Reinicialização do serviço",
            1013: "Tente novamente mais tarde",
            1014: "Gateway ruim",
            1015: "Falha no handshake TLS",
          };

          const reason = closeReasons[event.code] || "Motivo desconhecido";

          console.error(`[Nelogica WebSocket] 🔴 Conexão fechada:`);
          console.error(`[Nelogica WebSocket] Código: ${event.code}`);
          console.error(`[Nelogica WebSocket] Motivo: ${reason}`);
          console.error(
            `[Nelogica WebSocket] Detalhes: ${event.reason || "Nenhum detalhe fornecido"}`
          );
          console.error(
            `[Nelogica WebSocket] Clean: ${event.wasClean ? "Sim" : "Não"}`
          );

          // Diagnósticos específicos
          this.diagnoseProblem(event.code, event.reason);

          this.status.connected = false;
          this.status.authenticated = false;
          this.emit("statusChange", this.status);

          if (!this.status.connected && this.reconnectAttempts === 0) {
            reject(
              new Error(`Falha na conexão WebSocket (${event.code}): ${reason}`)
            );
          } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
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
          const wsTarget = error.target as WebSocket;
          console.error(
            "[Nelogica WebSocket] URL:",
            wsTarget && "url" in wsTarget ? (wsTarget as any).url : "N/A"
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
    console.log(`   2. Informar seu IP atual: ${this.getCurrentIP()}`);
    console.log("   3. Solicitar liberação/verificação do acesso WebSocket");
    console.log("   4. Validar token de autenticação");
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

  /**
   * Tenta obter IP atual do usuário
   */
  private getCurrentIP(): string {
    // Em produção, você poderia fazer uma chamada para um serviço que retorna o IP
    return "Verificar em https://whatismyipaddress.com/";
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
