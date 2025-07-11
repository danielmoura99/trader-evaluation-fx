/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/websocket-bridge.ts
import { EventEmitter } from "events";
import WebSocket from "ws";
import { ProxyService } from "./proxy-service";
import { SocksProxyAgent } from "socks-proxy-agent";

interface NelogicaMessage {
  name: string;
  request_id: string;
  msg: any;
}

/**
 * Bridge WebSocket que conecta no servidor da Nelogica usando IP fixo (Fixie)
 * Roda no servidor Next.js e faz relay para os clientes browser
 */
export class WebSocketBridge extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private proxyService: ProxyService;
  private isConnected: boolean = false;
  private isAuthenticated: boolean = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    super();

    // Configurações da Nelogica UAT
    this.url = "ws://191.252.154.12:36302";
    this.token =
      process.env.NELOGICA_WS_TOKEN || "3dBtHNwjxWZmcPL8YzGSjLfSfM6xTveV";

    // Inicializar ProxyService para IP fixo
    this.proxyService = ProxyService.getServerInstance();

    console.log("🌉 [WebSocket Bridge] Inicializado");
    console.log(`🔗 [WebSocket Bridge] URL: ${this.url}`);
    console.log(
      `🔑 [WebSocket Bridge] Token: ${this.token.substring(0, 8)}...`
    );
  }

  /**
   * Inicializa a conexão com a Nelogica
   */
  public async initialize(): Promise<void> {
    console.log("🚀 [WebSocket Bridge] Iniciando conexão com Nelogica...");

    try {
      await this.connect();
      console.log("✅ [WebSocket Bridge] Conexão estabelecida com sucesso");
    } catch (error) {
      console.error("❌ [WebSocket Bridge] Erro na inicialização:", error);
      throw error;
    }
  }

  /**
   * Conecta ao WebSocket da Nelogica usando proxy
   */
  private async connect(): Promise<void> {
    try {
      if (this.ws) {
        this.disconnect();
      }

      const requestId = `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🔌 [${requestId}] Iniciando conexão WebSocket...`);

      // Configurar proxy se disponível
      let wsOptions: any = {};

      if (this.proxyService.isEnabled()) {
        const proxyConfig = this.proxyService.getAxiosProxyConfig();

        if (proxyConfig) {
          // Converter configuração do Axios para WebSocket
          const proxyUrl = `http://${proxyConfig.auth.username}:${proxyConfig.auth.password}@${proxyConfig.host}:${proxyConfig.port}`;
          const agent = new SocksProxyAgent(proxyUrl);

          wsOptions.agent = agent;

          console.log(
            `🔄 [${requestId}] Proxy configurado: ${proxyConfig.host}:${proxyConfig.port}`
          );
          console.log(
            `👤 [${requestId}] Proxy user: ${proxyConfig.auth.username}`
          );
        }
      } else {
        console.log(`⚠️  [${requestId}] Proxy não disponível - conexão direta`);
      }

      // Criar conexão WebSocket
      this.ws = new WebSocket(this.url, wsOptions);

      return new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          console.error(`⏰ [${requestId}] Timeout na conexão (15s)`);
          if (this.ws) {
            this.ws.close();
          }
          reject(new Error("Timeout na conexão WebSocket"));
        }, 15000);

        this.ws!.on("open", () => {
          clearTimeout(connectionTimeout);
          console.log(`✅ [${requestId}] WebSocket conectado à Nelogica!`);

          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emitStatusChange();

          // Autenticar automaticamente
          this.authenticate();
          resolve();
        });

        this.ws!.on("message", (data: Buffer) => {
          this.handleMessage(data.toString());
        });

        this.ws!.on("close", (code, reason) => {
          clearTimeout(connectionTimeout);
          console.log(
            `🔌 [${requestId}] Conexão fechada (${code}): ${reason.toString()}`
          );

          this.isConnected = false;
          this.isAuthenticated = false;
          this.emitStatusChange();

          // Tentar reconectar se necessário
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            console.error(`❌ [${requestId}] Máximo de tentativas atingido`);
            this.emit(
              "error",
              new Error("Máximo de tentativas de reconexão atingido")
            );
          }
        });

        this.ws!.on("error", (error) => {
          clearTimeout(connectionTimeout);
          console.error(`❌ [${requestId}] Erro WebSocket:`, error);

          this.emit("error", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("❌ [WebSocket Bridge] Erro crítico:", error);
      throw error;
    }
  }

  /**
   * Desconecta do WebSocket
   */
  private disconnect(): void {
    console.log("🔌 [WebSocket Bridge] Desconectando...");

    this.clearIntervals();

    if (this.ws) {
      this.ws.close(1000, "Desconexão solicitada");
      this.ws = null;
    }

    this.isConnected = false;
    this.isAuthenticated = false;
    this.emitStatusChange();
  }

  /**
   * Autentica com a Nelogica
   */
  private authenticate(): void {
    const authMessage = {
      name: "authenticate",
      request_id: this.generateRequestId(),
      msg: {
        token: this.token,
      },
    };

    console.log("🔐 [WebSocket Bridge] Enviando autenticação...");
    this.sendMessage(authMessage);
  }

  /**
   * Processa mensagens recebidas da Nelogica
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log(`📨 [WebSocket Bridge] Mensagem recebida: ${message.name}`);

      // Tratar autenticação
      if (message.name === "authenticationSuccessful") {
        console.log("✅ [WebSocket Bridge] Autenticado com sucesso!");
        this.isAuthenticated = true;
        this.emitStatusChange();
        this.startHeartbeat();
        this.subscribeToUpdates();
        return;
      }

      // Retransmitir mensagem para clientes
      this.emit("nelogica-message", message);
    } catch (error) {
      console.error("❌ [WebSocket Bridge] Erro ao processar mensagem:", error);
    }
  }

  /**
   * Envia mensagem para a Nelogica
   */
  private sendMessage(message: NelogicaMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      console.log(`📤 [WebSocket Bridge] Enviando: ${message.name}`);
      this.ws.send(messageStr);
    } else {
      console.warn(
        "⚠️  [WebSocket Bridge] Tentativa de envio com WebSocket fechado"
      );
    }
  }

  /**
   * Envia comando recebido do cliente para a Nelogica
   */
  public async sendCommand(command: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.isAuthenticated) {
        reject(new Error("WebSocket não conectado ou não autenticado"));
        return;
      }

      const message = {
        name: command.name || "sendMessage",
        request_id: this.generateRequestId(),
        msg: command.msg || command,
      };

      // Configurar timeout para resposta
      const timeout = setTimeout(() => {
        reject(new Error("Timeout aguardando resposta da Nelogica"));
      }, 10000);

      // Listener temporário para a resposta
      const responseHandler = (response: any) => {
        if (response.request_id === message.request_id) {
          clearTimeout(timeout);
          this.off("nelogica-message", responseHandler);
          resolve(response);
        }
      };

      this.on("nelogica-message", responseHandler);
      this.sendMessage(message);
    });
  }

  /**
   * Subscreve para atualizações em tempo real
   */
  private subscribeToUpdates(): void {
    const subscriptions = [
      { name: "risk-update", body: {} },
      { name: "position-update", body: {} },
      { name: "balance-update", body: {} },
      { name: "blocking-update", body: {} },
    ];

    subscriptions.forEach((sub) => {
      const subscribeMessage = {
        name: "subscribeMessage",
        request_id: this.generateRequestId(),
        msg: sub,
      };
      this.sendMessage(subscribeMessage);
    });

    console.log("📡 [WebSocket Bridge] Subscrito para atualizações");
  }

  /**
   * Inicia heartbeat para manter conexão
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const keepAlive = {
        name: "keepAlive",
        request_id: this.generateRequestId(),
        msg: {},
      };
      this.sendMessage(keepAlive);
    }, 30000); // 30 segundos
  }

  /**
   * Agenda reconexão automática
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(5000 * this.reconnectAttempts, 30000); // Max 30s

    console.log(
      `🔄 [WebSocket Bridge] Reconectando em ${delay}ms (tentativa ${this.reconnectAttempts})`
    );

    this.reconnectInterval = setTimeout(() => {
      this.connect().catch((error) => {
        console.error("❌ [WebSocket Bridge] Falha na reconexão:", error);
      });
    }, delay);
  }

  /**
   * Limpa intervalos
   */
  private clearIntervals(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Emite mudança de status para clientes
   */
  private emitStatusChange(): void {
    const status = {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: new Date().toISOString(),
    };

    this.emit("status-change", status);
  }

  /**
   * Gera ID único para requisições
   */
  private generateRequestId(): string {
    return `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos públicos para status
  public isConnected(): boolean {
    return this.isConnected;
  }

  public isAuthenticated(): boolean {
    return this.isAuthenticated;
  }
}
