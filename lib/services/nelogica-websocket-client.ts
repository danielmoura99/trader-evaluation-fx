/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/nelogica-websocket-client.ts
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import EventEmitter from "events";

/**
 * Interfaces para WebSocket da Nelogica
 */

// Mensagens que enviamos
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
  msg: {};
}

interface SendMessage extends BaseMessage {
  name: "sendMessage";
  msg: {
    name: string;
    body: any;
  };
}

interface SubscribeMessage extends BaseMessage {
  name: "subscribeMessage";
  msg: {
    name: string;
    body: any;
  };
}

interface RequestMessage extends BaseMessage {
  name: "requestMessage";
  msg: {
    name: string;
    body: any;
  };
}

// Mensagens que recebemos
interface AuthenticatedResponse {
  name: "authenticated";
  request_id: string;
  msg: {
    success: boolean;
  };
}

interface ResultResponse {
  name: "result";
  request_id: string;
  msg: {
    success: boolean;
    reason?: string;
  };
}

interface MarginResponse {
  name: "margin";
  msg: Array<{
    account: string;
    marginValue: number;
    marginLevel: number;
    marginExcess: number;
    pnl: number;
  }>;
}

interface BalanceResponse {
  name: "balance";
  msg: Array<{
    account: string;
    currency: string;
    balance: number;
  }>;
}

interface BlockingUpdateResponse {
  name: "blocking-update";
  msg: Array<{
    account: string;
    blocked: boolean;
    message: string;
  }>;
}

interface IpUpdateResponse {
  name: "ip-update";
  msg: Array<{
    account: string;
    ips: string[];
  }>;
}

interface RiskUpdateResponse {
  name: "risk-update";
  msg: Array<{
    account: string;
    checkLoss: boolean;
    checkGain: boolean;
    checkDrawDown: boolean;
    maxGain: number;
    maxLoss: number;
    drawDown: number;
    currency: string;
  }>;
}

interface PositionUpdateResponse {
  name: "position-update";
  msg: Array<{
    account: string;
    ticker: string;
    quantity: number;
    averagePrice: number;
    side: string;
  }>;
}

interface BalanceOperationResultResponse {
  name: "balance-operation-result";
  msg: {
    "request-id": string;
    account: string;
    success: boolean;
    message: string;
    "transact-time": string;
  };
}

interface TradeHistoryResultResponse {
  name: "trade-history-result";
  msg: {
    "request-id": string;
    account: string;
    success: boolean;
    message: string;
    orders: Array<{
      clordid: string;
      ticker: string;
      "transact-time": string;
      "avg-price": number;
      "cum-qtd": number;
      side: string;
    }>;
  };
}

type WebSocketResponse =
  | AuthenticatedResponse
  | ResultResponse
  | MarginResponse
  | BalanceResponse
  | BlockingUpdateResponse
  | IpUpdateResponse
  | RiskUpdateResponse
  | PositionUpdateResponse
  | BalanceOperationResultResponse
  | TradeHistoryResultResponse;

/**
 * Cliente para o WebSocket da Nelogica
 */
export class NelogicaWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private connected: boolean = false;
  private authenticated: boolean = false;
  private reconnecting: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private requestCallbacks: Map<string, (result: any) => void> = new Map();

  constructor(url: string, token: string) {
    super();
    this.url = url;
    this.token = token;
  }

  /**
   * Conecta ao WebSocket
   */
  public async connect(): Promise<void> {
    if (this.ws) {
      this.close();
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on("open", () => {
          console.log("[Nelogica WebSocket] Conexão estabelecida");
          this.connected = true;
          this.authenticate()
            .then(() => {
              this.startKeepAlive();
              resolve();
            })
            .catch(reject);
        });

        this.ws.on("message", this.handleMessage.bind(this));

        this.ws.on("close", (code, reason) => {
          console.log(
            `[Nelogica WebSocket] Conexão fechada: ${code} - ${reason}`
          );
          this.connected = false;
          this.authenticated = false;
          this.stopKeepAlive();

          if (!this.reconnecting) {
            this.reconnect();
          }
        });

        this.ws.on("error", (error) => {
          console.error("[Nelogica WebSocket] Erro:", error);
          if (!this.connected) {
            reject(error);
          }
        });
      } catch (error) {
        console.error("[Nelogica WebSocket] Erro ao conectar:", error);
        reject(error);
      }
    });
  }

  /**
   * Fecha a conexão com o WebSocket
   */
  public close(): void {
    if (this.ws) {
      this.stopKeepAlive();
      this.ws.close();
      this.ws = null;
      this.connected = false;
      this.authenticated = false;
    }
  }

  /**
   * Reconecta automaticamente caso a conexão seja perdida
   */
  private reconnect(): void {
    if (this.reconnecting) return;

    this.reconnecting = true;
    console.log("[Nelogica WebSocket] Tentando reconectar em 5 segundos...");

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
        .then(() => {
          console.log("[Nelogica WebSocket] Reconectado com sucesso");
          this.reconnecting = false;
          this.emit("reconnected");
        })
        .catch((error) => {
          console.error("[Nelogica WebSocket] Erro ao reconectar:", error);
          this.reconnecting = false;
          this.reconnect();
        });
    }, 5000);
  }

  /**
   * Autentica no WebSocket
   */
  private async authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error("WebSocket não está conectado"));
        return;
      }

      const requestId = uuidv4();

      // Define callback para resposta de autenticação
      this.requestCallbacks.set(requestId, (result: AuthenticatedResponse) => {
        if (result.msg.success) {
          this.authenticated = true;
          console.log("[Nelogica WebSocket] Autenticado com sucesso");
          resolve();
        } else {
          this.authenticated = false;
          console.error("[Nelogica WebSocket] Falha na autenticação");
          reject(new Error("Falha na autenticação do WebSocket"));
        }
      });

      // Envia mensagem de autenticação
      const authMessage: AuthenticateMessage = {
        name: "authenticate",
        request_id: requestId,
        msg: {
          token: this.token,
        },
      };

      this.ws.send(JSON.stringify(authMessage));
    });
  }

  /**
   * Inicia o envio periódico da mensagem keepAlive
   */
  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (this.connected && this.ws) {
        const keepAliveMessage: KeepAliveMessage = {
          name: "keepAlive",
          request_id: uuidv4(),
          msg: {},
        };
        this.ws.send(JSON.stringify(keepAliveMessage));
      }
    }, 55000); // A cada 55 segundos (um pouco menos que os 60 requeridos)
  }

  /**
   * Para o envio periódico da mensagem keepAlive
   */
  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  /**
   * Manipula as mensagens recebidas do WebSocket
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString()) as WebSocketResponse;

      // Log para debugging
      console.log(`[Nelogica WebSocket] Mensagem recebida: ${message.name}`);

      // Verifica se existe um callback registrado para este request_id
      if (
        "request_id" in message &&
        this.requestCallbacks.has(message.request_id)
      ) {
        const callback = this.requestCallbacks.get(message.request_id);
        if (callback) {
          callback(message);
          this.requestCallbacks.delete(message.request_id);
        }
      }

      // Emite eventos com base no tipo de mensagem
      switch (message.name) {
        case "margin":
          this.emit("margin", message.msg);
          break;

        case "balance":
          this.emit("balance", message.msg);
          break;

        case "blocking-update":
          this.emit("blocking-update", message.msg);
          break;

        case "ip-update":
          this.emit("ip-update", message.msg);
          break;

        case "risk-update":
          this.emit("risk-update", message.msg);
          break;

        case "position-update":
          this.emit("position-update", message.msg);
          break;

        case "balance-operation-result":
          this.emit("balance-operation-result", message.msg);
          break;

        case "trade-history-result":
          this.emit("trade-history-result", message.msg);
          break;
      }
    } catch (error) {
      console.error("[Nelogica WebSocket] Erro ao processar mensagem:", error);
    }
  }

  /**
   * Método genérico para enviar mensagens
   */
  private async sendMessageWithCallback<T>(message: BaseMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.authenticated || !this.ws) {
        reject(new Error("WebSocket não está conectado ou autenticado"));
        return;
      }

      // Registra o callback para a resposta
      this.requestCallbacks.set(message.request_id, (result) => {
        if (result.name === "result") {
          if (result.msg.success) {
            // A mensagem foi aceita, mas a resposta real virá em outra mensagem
            // Neste caso, deixamos o callback registrado
            return;
          } else {
            // A mensagem foi rejeitada
            reject(
              new Error(
                `Mensagem rejeitada: ${result.msg.reason || "Motivo desconhecido"}`
              )
            );
            this.requestCallbacks.delete(message.request_id);
          }
        } else {
          // Esta é a resposta real para a nossa mensagem
          resolve(result as T);
        }
      });

      // Envia a mensagem
      this.ws.send(JSON.stringify(message));
    });
  }

  /**
   * Solicita atualização de margem para uma ou todas as contas
   */
  public async getMargin(account?: string): Promise<MarginResponse> {
    const requestId = uuidv4();
    const message: SendMessage = {
      name: "sendMessage",
      request_id: requestId,
      msg: {
        name: "get-margin",
        body: {
          account,
        },
      },
    };

    return this.sendMessageWithCallback<MarginResponse>(message);
  }

  /**
   * Solicita atualização de saldo para uma ou todas as contas
   */
  public async getBalance(account?: string): Promise<BalanceResponse> {
    const requestId = uuidv4();
    const message: SendMessage = {
      name: "sendMessage",
      request_id: requestId,
      msg: {
        name: "get-balance",
        body: {
          account,
        },
      },
    };

    return this.sendMessageWithCallback<BalanceResponse>(message);
  }

  /**
   * Solicita atualização de bloqueio para uma ou todas as contas
   */
  public async getBlockingUpdate(
    account?: string
  ): Promise<BlockingUpdateResponse> {
    const requestId = uuidv4();
    const message: SendMessage = {
      name: "sendMessage",
      request_id: requestId,
      msg: {
        name: "get-blocking-update",
        body: {
          account,
        },
      },
    };

    return this.sendMessageWithCallback<BlockingUpdateResponse>(message);
  }

  /**
   * Solicita atualização de IPs para uma ou todas as contas
   */
  public async getIpUpdate(account?: string): Promise<IpUpdateResponse> {
    const requestId = uuidv4();
    const message: SendMessage = {
      name: "sendMessage",
      request_id: requestId,
      msg: {
        name: "get-ip-update",
        body: {
          account,
        },
      },
    };

    return this.sendMessageWithCallback<IpUpdateResponse>(message);
  }

  /**
   * Solicita atualização de risco para uma ou todas as contas
   */
  public async getRiskUpdate(account?: string): Promise<RiskUpdateResponse> {
    const requestId = uuidv4();
    const message: SendMessage = {
      name: "sendMessage",
      request_id: requestId,
      msg: {
        name: "get-risk-update",
        body: {
          account,
        },
      },
    };

    return this.sendMessageWithCallback<RiskUpdateResponse>(message);
  }

  /**
   * Solicita atualização de posições para uma ou todas as contas
   */
  public async getPositionUpdate(
    account?: string
  ): Promise<PositionUpdateResponse> {
    const requestId = uuidv4();
    const message: SendMessage = {
      name: "sendMessage",
      request_id: requestId,
      msg: {
        name: "get-position-update",
        body: {
          account,
        },
      },
    };

    return this.sendMessageWithCallback<PositionUpdateResponse>(message);
  }

  /**
   * Subscreve para receber atualizações de margem
   */
  public async subscribeMarginChanged(): Promise<ResultResponse> {
    const requestId = uuidv4();
    const message: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: requestId,
      msg: {
        name: "margin-changed",
        body: {},
      },
    };

    return this.sendMessageWithCallback<ResultResponse>(message);
  }

  /**
   * Subscreve para receber atualizações de saldo
   */
  public async subscribeBalanceChanged(): Promise<ResultResponse> {
    const requestId = uuidv4();
    const message: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: requestId,
      msg: {
        name: "balance-changed",
        body: {},
      },
    };

    return this.sendMessageWithCallback<ResultResponse>(message);
  }

  /**
   * Subscreve para receber atualizações de bloqueio
   */
  public async subscribeBlockingChanged(): Promise<ResultResponse> {
    const requestId = uuidv4();
    const message: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: requestId,
      msg: {
        name: "blocking-changed",
        body: {},
      },
    };

    return this.sendMessageWithCallback<ResultResponse>(message);
  }

  /**
   * Subscreve para receber atualizações de IPs
   */
  public async subscribeIpChanged(): Promise<ResultResponse> {
    const requestId = uuidv4();
    const message: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: requestId,
      msg: {
        name: "ip-changed",
        body: {},
      },
    };

    return this.sendMessageWithCallback<ResultResponse>(message);
  }

  /**
   * Subscreve para receber atualizações de risco
   */
  public async subscribeRiskChanged(): Promise<ResultResponse> {
    const requestId = uuidv4();
    const message: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: requestId,
      msg: {
        name: "risk-changed",
        body: {},
      },
    };

    return this.sendMessageWithCallback<ResultResponse>(message);
  }

  /**
   * Subscreve para receber atualizações de posições
   */
  public async subscribePositionChanged(): Promise<ResultResponse> {
    const requestId = uuidv4();
    const message: SubscribeMessage = {
      name: "subscribeMessage",
      request_id: requestId,
      msg: {
        name: "position-changed",
        body: {},
      },
    };

    return this.sendMessageWithCallback<ResultResponse>(message);
  }

  /**
   * Solicita histórico de operações
   */
  public async requestTradeHistory(
    account: string,
    dateStart: Date,
    dateEnd: Date
  ): Promise<TradeHistoryResultResponse> {
    const requestId = uuidv4();
    const message: RequestMessage = {
      name: "requestMessage",
      request_id: requestId,
      msg: {
        name: "request-trade-history",
        body: {
          account,
          date_start: dateStart.toISOString(),
          date_end: dateEnd.toISOString(),
        },
      },
    };

    return this.sendMessageWithCallback<TradeHistoryResultResponse>(message);
  }
}
