/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/websocket-bridge.ts
import { EventEmitter } from "events";
import WebSocket from "ws";
import { ProxyService } from "./proxy-service";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";

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
  private _isConnected: boolean = false;
  private _isAuthenticated: boolean = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    super();

    try {
      console.log("🔧 [WebSocket Bridge] Iniciando constructor...");

      // Configurações da Nelogica UAT
      this.url = "ws://191.252.154.12:36309";
      this.token =
        process.env.NELOGICA_WS_TOKEN || "3dBtHNwjxWZmcPL8YzGSjLfSfM6xTveV";

      console.log("🔧 [WebSocket Bridge] Configurações básicas definidas");
      console.log(`🔗 [WebSocket Bridge] URL: ${this.url}`);
      console.log(
        `🔑 [WebSocket Bridge] Token: ${this.token.substring(0, 8)}...`
      );

      // Inicializar ProxyService para IP fixo
      console.log("🔧 [WebSocket Bridge] Inicializando ProxyService...");
      this.proxyService = ProxyService.getServerInstance();
      console.log("✅ [WebSocket Bridge] ProxyService inicializado");

      console.log("✅ [WebSocket Bridge] Constructor concluído com sucesso");
    } catch (error) {
      console.error("❌ [WebSocket Bridge] Erro no constructor:", error);
      throw error;
    }
  }

  /**
   * Inicializa a conexão com a Nelogica
   */
  public async initialize(): Promise<void> {
    console.log("🚀 [WebSocket Bridge] Iniciando método initialize...");

    try {
      console.log("🔍 [WebSocket Bridge] Verificando ProxyService...");
      const proxyInfo = this.proxyService.getProxyInfo();
      console.log("🔍 [WebSocket Bridge] Proxy Info:", proxyInfo);

      console.log("🔗 [WebSocket Bridge] Iniciando conexão...");
      await this.connect();
      console.log("✅ [WebSocket Bridge] Conexão estabelecida com sucesso");
    } catch (error) {
      console.error("❌ [WebSocket Bridge] Erro na inicialização:", error);
      console.error(
        "❌ [WebSocket Bridge] Stack trace:",
        error instanceof Error ? error.stack : "N/A"
      );
      throw error;
    }
  }

  /**
   * Conecta ao WebSocket da Nelogica usando proxy
   */
  private async connect(): Promise<void> {
    console.log("🔌 [WebSocket Bridge] Entrando no método connect...");

    try {
      if (this.ws) {
        console.log(
          "🔌 [WebSocket Bridge] WebSocket existente, desconectando..."
        );
        this.disconnect();
      }

      const requestId = `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🔌 [${requestId}] Iniciando conexão WebSocket...`);

      // Configurar proxy se disponível
      console.log(`🔧 [${requestId}] Configurando opções WebSocket...`);
      const wsOptions: any = {};

      console.log(`🔍 [${requestId}] Verificando se proxy está habilitado...`);
      if (this.proxyService.isEnabled()) {
        console.log(
          `✅ [${requestId}] Proxy habilitado, obtendo configuração...`
        );
        const proxyConfig = this.proxyService.getAxiosProxyConfig();

        if (proxyConfig) {
          console.log(`🔄 [${requestId}] Proxy config obtido:`, {
            host: proxyConfig.host,
            port: proxyConfig.port,
            hasAuth: !!proxyConfig.auth,
          });

          // Construir URL do proxy HTTP (não SOCKS)
          const proxyUrl = `http://${proxyConfig.auth.username}:${proxyConfig.auth.password}@${proxyConfig.host}:${proxyConfig.port}`;
          console.log(
            `🔗 [${requestId}] Criando HttpProxyAgent para WebSocket...`
          );
          console.log(
            `🔗 [${requestId}] Proxy URL: http://${proxyConfig.auth.username}:****@${proxyConfig.host}:${proxyConfig.port}`
          );

          try {
            // Para WebSocket com proxy HTTP, usar HttpProxyAgent
            const agent = new HttpProxyAgent(proxyUrl);
            wsOptions.agent = agent;
            console.log(`✅ [${requestId}] HttpProxyAgent criado com sucesso`);
          } catch (agentError) {
            console.error(
              `❌ [${requestId}] Erro ao criar HttpProxyAgent:`,
              agentError
            );
            throw agentError;
          }

          console.log(
            `🔄 [${requestId}] Proxy configurado: ${proxyConfig.host}:${proxyConfig.port}`
          );
          console.log(
            `👤 [${requestId}] Proxy user: ${proxyConfig.auth.username}`
          );
        } else {
          console.warn(`⚠️  [${requestId}] Proxy habilitado mas config é null`);
        }
      } else {
        console.log(`⚠️  [${requestId}] Proxy não disponível - conexão direta`);
      }

      // Criar conexão WebSocket
      console.log(`🔗 [${requestId}] Criando WebSocket para ${this.url}...`);
      console.log(`🔗 [${requestId}] wsOptions configuradas`);

      try {
        this.ws = new WebSocket(this.url, wsOptions);
        console.log(`✅ [${requestId}] WebSocket criado com sucesso`);
      } catch (wsError) {
        console.error(`❌ [${requestId}] Erro ao criar WebSocket:`, wsError);
        throw wsError;
      }

      return new Promise((resolve, reject) => {
        console.log(`⏳ [${requestId}] Aguardando eventos do WebSocket...`);

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

          this._isConnected = true;
          this.reconnectAttempts = 0;
          this.emitStatusChange();

          // Autenticar automaticamente
          console.log(`🔐 [${requestId}] Iniciando autenticação...`);
          this.authenticate();
          resolve();
        });

        this.ws!.on("message", (data: Buffer) => {
          console.log(
            `📨 [${requestId}] Mensagem recebida (${data.length} bytes)`
          );
          this.handleMessage(data.toString());
        });

        this.ws!.on("close", (code, reason) => {
          clearTimeout(connectionTimeout);
          console.log(
            `🔌 [${requestId}] Conexão fechada (${code}): ${reason.toString()}`
          );

          this._isConnected = false;
          this._isAuthenticated = false;
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
          console.error(`❌ [${requestId}] Erro detalhado:`, {
            message: error.message,
            code: (error as any).code,
            errno: (error as any).errno,
            syscall: (error as any).syscall,
            address: (error as any).address,
            port: (error as any).port,
          });

          this.emit("error", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("❌ [WebSocket Bridge] Erro crítico no connect:", error);
      console.error(
        "❌ [WebSocket Bridge] Stack trace:",
        error instanceof Error ? error.stack : "N/A"
      );
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

    this._isConnected = false;
    this._isAuthenticated = false;
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
        this._isAuthenticated = true;
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
      if (!this._isConnected || !this._isAuthenticated) {
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
      connected: this._isConnected,
      authenticated: this._isAuthenticated,
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

  // Métodos públicos para verificar status
  public isConnected(): boolean {
    return this._isConnected;
  }

  public isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  /**
   * Getter para status de conexão (alternativa aos métodos)
   */
  public get connectionStatus() {
    return {
      connected: this._isConnected,
      authenticated: this._isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}
