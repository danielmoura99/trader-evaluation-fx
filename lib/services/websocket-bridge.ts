/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/websocket-bridge.ts

// SOLUÇÃO DEFINITIVA: Forçar WebSocket puro JS sem binários C++
process.env.WS_NO_BUFFER_UTIL = "1";
process.env.WS_NO_UTF_8_VALIDATE = "1";

import { EventEmitter } from "events";
import WebSocket from "ws";
import { ProxyService } from "./proxy-service";
import { HttpProxyAgent } from "http-proxy-agent";
import * as tunnel from "tunnel";

interface NelogicaMessage {
  name: string;
  request_id: string;
  msg: any;
}

/**
 * Bridge WebSocket que conecta no servidor da Nelogica usando IP fixo (Fixie)
 * Implementação baseada na documentação oficial da Nelogica WebSocket V1.0.2
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
        process.env.NELOGICA_WS_TOKEN || "U88rPdy1DT61Ktk5ANNj8CVdERtw0N4E";

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
        this.disconnect();
      }

      const requestId = `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🔌 [${requestId}] Iniciando conexão WebSocket...`);

      // Configurar opções WebSocket - FORÇAR JS PURO
      console.log(
        `🔧 [${requestId}] Configurando WebSocket com JS puro (sem binários C++)...`
      );
      const wsOptions: any = {
        headers: {
          "User-Agent": "TradersHouse-Bridge/1.0",
        },
        handshakeTimeout: 15000,
        perMessageDeflate: false, // Desabilitar compressão
        skipUTF8Validation: true, // Pular validação UTF-8 nativa
        maxPayload: 100 * 1024 * 1024, // 100MB
      };

      // Configurar proxy se disponível
      if (this.proxyService.isEnabled()) {
        const proxyConfig = this.proxyService.getAxiosProxyConfig();
        if (proxyConfig) {
          try {
            const tunnelAgent = tunnel.httpOverHttp({
              proxy: {
                host: proxyConfig.host,
                port: proxyConfig.port,
                proxyAuth: `${proxyConfig.auth.username}:${proxyConfig.auth.password}`,
              },
            });
            wsOptions.agent = tunnelAgent;
            console.log(`✅ [${requestId}] Túnel HTTP CONNECT configurado`);
          } catch (tunnelError) {
            console.warn(`⚠️  [${requestId}] Fallback para HttpProxyAgent...`);
            const proxyUrl = `http://${proxyConfig.auth.username}:${proxyConfig.auth.password}@${proxyConfig.host}:${proxyConfig.port}`;
            wsOptions.agent = new HttpProxyAgent(proxyUrl);
          }
        }
      }

      // Criar conexão WebSocket
      console.log(`🔗 [${requestId}] Criando WebSocket para ${this.url}...`);
      this.ws = new WebSocket(this.url, wsOptions);

      return new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          console.error(`⏰ [${requestId}] Timeout na conexão (15s)`);
          if (this.ws) this.ws.close();
          reject(new Error("Timeout na conexão WebSocket"));
        }, 15000);

        this.ws!.on("open", () => {
          clearTimeout(connectionTimeout);
          console.log(`✅ [${requestId}] 🎉 WebSocket conectado à Nelogica!`);

          this._isConnected = true;
          this.reconnectAttempts = 0;
          this.emitStatusChange();

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

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
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
      console.error("❌ [WebSocket Bridge] Erro crítico no connect:", error);
      throw error;
    }
  }

  /**
   * Autentica com a Nelogica (conforme documentação oficial)
   */
  private authenticate(): void {
    const authMessage = {
      name: "authenticate", // Conforme documentação página 4
      request_id: this.generateRequestId(),
      msg: {
        token: this.token,
      },
    };

    console.log("🔐 [WebSocket Bridge] Enviando autenticação...");
    console.log(
      "🔐 [WebSocket Bridge] Auth payload:",
      JSON.stringify(authMessage, null, 2)
    );

    this.sendMessageSafe(authMessage);
  }

  /**
   * Processa mensagens recebidas da Nelogica (conforme documentação)
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log(`📨 [WebSocket Bridge] Mensagem recebida: ${message.name}`);
      console.log(`📝 [WebSocket Bridge] Conteúdo completo:`, message);

      // CONFORME DOCUMENTAÇÃO PÁGINA 12: "authenticated"
      if (message.name === "authenticated") {
        console.log(`🔍 [WebSocket Bridge] Resposta de autenticação recebida`);
        console.log(
          `🔍 [WebSocket Bridge] Success status:`,
          message.msg?.success
        );

        if (message.msg?.success === true) {
          console.log(`✅ [WebSocket Bridge] 🎉 AUTENTICAÇÃO APROVADA!`);
          this._isAuthenticated = true;
          this.emitStatusChange();
          this.startHeartbeat(); // Iniciar heartbeat de 60s
          this.subscribeToUpdates(); // Subscrever com nomes corretos
        } else {
          console.error("❌ [WebSocket Bridge] 🚫 AUTENTICAÇÃO REJEITADA!");
          console.error("❌ [WebSocket Bridge] Token usado:", this.token);
          console.error("❌ [WebSocket Bridge] Resposta completa:", message);
          console.error("❌ [WebSocket Bridge] 💡 Possíveis causas:");
          console.error("   1. Token expirado ou inválido");
          console.error("   2. Token para ambiente diferente (UAT vs PROD)");
          console.error("   3. IP não autorizado");
          console.error("   4. Formato do token incorreto");

          // Emitir erro para o cliente
          this.emit(
            "error",
            new Error(`Autenticação falhou: token inválido ou expirado`)
          );
        }
        return;
      }

      // Conforme documentação página 13: "result"
      if (message.name === "result") {
        console.log(`📋 [WebSocket Bridge] Resultado de comando:`, message);
        if (!message.msg?.success) {
          console.warn(
            `⚠️ [WebSocket Bridge] Comando rejeitado: ${message.msg?.reason}`
          );
        }
      }

      // Retransmitir mensagem para clientes
      this.emit("nelogica-message", message);
    } catch (error) {
      console.error("❌ [WebSocket Bridge] Erro ao processar mensagem:", error);
      console.error("❌ [WebSocket Bridge] Dados brutos:", data);
    }
  }

  /**
   * Envia mensagem segura - evitando bufferUtil
   */
  private sendMessageSafe(message: NelogicaMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("⚠️  [WebSocket Bridge] WebSocket não disponível");
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      console.log(`📤 [WebSocket Bridge] Enviando: ${message.name}`);

      // Usar callback para detectar erros
      this.ws.send(messageStr, (error) => {
        if (error) {
          console.error("❌ [WebSocket Bridge] Erro no envio:", error);
          // Tentar fallback sem callback
          try {
            this.ws?.send(messageStr);
          } catch (fallbackError) {
            console.error(
              "❌ [WebSocket Bridge] Fallback falhou:",
              fallbackError
            );
          }
        } else {
          console.log("✅ [WebSocket Bridge] Mensagem enviada com sucesso");
        }
      });
    } catch (error) {
      console.error("❌ [WebSocket Bridge] Erro crítico no envio:", error);
    }
  }

  private sendMessage(message: NelogicaMessage): void {
    this.sendMessageSafe(message);
  }

  /**
   * Subscreve para atualizações - NOMES CORRETOS da documentação
   */
  private subscribeToUpdates(): void {
    // Conforme documentação páginas 8-11
    const subscriptions = [
      { name: "margin-changed", body: {} }, // Página 8
      { name: "balance-changed", body: {} }, // Página 9
      { name: "blocking-changed", body: {} }, // Página 9
      { name: "risk-changed", body: {} }, // Página 10
      { name: "position-changed", body: {} }, // Página 11
    ];

    subscriptions.forEach((sub) => {
      const subscribeMessage = {
        name: "subscribeMessage", // Conforme documentação
        request_id: this.generateRequestId(),
        msg: sub,
      };
      this.sendMessage(subscribeMessage);
    });

    console.log(
      "📡 [WebSocket Bridge] Subscrito para atualizações (nomes corretos da documentação)"
    );
  }

  /**
   * KeepAlive - CONFORME DOCUMENTAÇÃO: 60 segundos
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const keepAlive = {
        name: "keepAlive", // Conforme documentação página 4
        request_id: this.generateRequestId(),
        msg: {},
      };
      this.sendMessage(keepAlive);
      console.log("💓 [WebSocket Bridge] KeepAlive enviado (60s)");
    }, 60000); // 60 segundos conforme documentação
  }

  /**
   * Envia comando para a Nelogica
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

      const timeout = setTimeout(() => {
        reject(new Error("Timeout aguardando resposta da Nelogica"));
      }, 10000);

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

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(5000 * this.reconnectAttempts, 30000);

    console.log(
      `🔄 [WebSocket Bridge] Reconectando em ${delay}ms (tentativa ${this.reconnectAttempts})`
    );

    this.reconnectInterval = setTimeout(() => {
      this.connect().catch((error) => {
        console.error("❌ [WebSocket Bridge] Falha na reconexão:", error);
      });
    }, delay);
  }

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

  private emitStatusChange(): void {
    const status = {
      connected: this._isConnected,
      authenticated: this._isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: new Date().toISOString(),
    };
    this.emit("status-change", status);
  }

  private generateRequestId(): string {
    // Gerar UUID v4 conforme documentação Nelogica (36 caracteres)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // Métodos públicos
  public isConnected(): boolean {
    return this._isConnected;
  }

  public isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  public get connectionStatus() {
    return {
      connected: this._isConnected,
      authenticated: this._isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}
