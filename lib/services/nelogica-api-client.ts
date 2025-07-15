/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/nelogica-api-client.ts
import axios, { AxiosInstance } from "axios";
import { ProxyService } from "./proxy-service";

declare module "axios" {
  export interface AxiosRequestConfig {
    metadata?: {
      requestId: string;
      startTime: number;
    };
  }
}
/**
 * Interfaces de resposta da API
 */

interface NelogicaBaseResponse {
  message: string;
  status: number;
  isSuccess: boolean;
  notifications: Record<string, string[]>;
}

interface NelogicaAuthResponse extends NelogicaBaseResponse {
  data: {
    token: string;
    type: string;
    expiresAt: string;
  };
}

interface NelogicaSubscriptionResponse extends NelogicaBaseResponse {
  data: {
    customerId: string;
    subscriptionId: string;
    licenseId: string;
    accounts: {
      account: string;
      profileId: string;
    }[];
  };
}

interface NelogicaCreateAccountResponse extends NelogicaBaseResponse {
  data: {
    account: string;
    profileId: string;
  }[];
}

interface NelogicaEnvironmentsResponse extends NelogicaBaseResponse {
  data: {
    parameters: {
      pagination: {
        pageNumber: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
      };
    };
    environments: {
      environmentId: string;
      name: string;
      description: string;
      isTest: boolean;
      isSimulator: boolean;
      softwareId: number;
    }[];
  };
}

interface NelogicaRiskProfilesResponse extends NelogicaBaseResponse {
  data: {
    parameters: {
      pagination: {
        pageNumber: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
      };
    };
    riskProfiles: {
      profileId: string;
      initialBalance: number;
      trailing: boolean;
      stopOutRule: number;
      leverage: number;
      commissionsEnabled: boolean;
      enableContractExposure: boolean;
      contractExposure: number;
      enableLoss: boolean;
      lossRule: number;
      enableGain: boolean;
      gainRule: number;
    }[];
  };
}

interface NelogicaSubscriptionsResponse extends NelogicaBaseResponse {
  data: {
    parameters: {
      pagination: {
        pageNumber: number;
        pageSize: number;
        totalRecords: number;
        totalPages: number;
      };
    };
    subscriptions: {
      subscriptionId: string;
      licenseId: string;
      customerId: string;
      createdAt: string;
      planId: string;
      accounts: {
        account: string;
        name: string;
        profileId: string;
        validadedAt: string;
      }[];
    }[];
  };
}

interface NelogicaGenericResponse extends NelogicaBaseResponse {
  data: any;
}

interface NelogicaCreateRiskResponse extends NelogicaBaseResponse {
  data: {
    profileId: string;
  };
}

/**
 * Interfaces de parâmetros de requisição
 */

export interface CreateSubscriptionParams {
  planId: string;
  firstName: string;
  lastName: string;
  gender?: number;
  birth?: string;
  email: string;
  PhoneNumber?: string;
  countryNationality?: string;
  document?: {
    documentType: number;
    document: string;
  };
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    complement?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  account?: {
    name: string;
    profileId: string;
  }[];
}

export interface CreateAccountParams {
  name: string;
  profileId: string;
  accountType?: number; // 0: Desafio (padrão), 1: Financiada/Real
}

export interface RiskProfileParams {
  initialBalance?: number;
  trailing?: boolean;
  stopOutRule?: number;
  leverage?: number;
  commissionsEnabled?: boolean;
  enableContractExposure?: boolean;
  contractExposure?: number;
  enableLoss?: boolean;
  lossRule?: number;
  enableGain?: boolean;
  gainRule?: number;
}

export interface UpdateRiskProfileParams extends RiskProfileParams {
  profileId: string;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Cliente principal para a API da Nelogica
 */
export class NelogicaApiClient {
  private baseUrl: string;
  private apiClient: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private isLoggingIn: boolean = false;
  private proxyService: ProxyService;

  constructor(
    baseUrl: string,
    private username: string,
    private password: string
  ) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.proxyService = ProxyService.getInstance();

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "TradersHouse-API-Client/1.0",
      },
      timeout: 10000,
    });

    this.configureProxy();

    this.setupInterceptors();

    console.log(`[Nelogica API] Cliente inicializado para ${this.baseUrl}`);
  }

  /**
   * Configura o proxy Fixie se disponível
   */
  private configureProxy(): void {
    const requestId = `proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🔧 [${requestId}] ===== CONFIGURAÇÃO DE PROXY =====`);

    const proxyInfo = this.proxyService.getProxyInfo();
    console.log(`🔍 [${requestId}] Status do proxy:`, proxyInfo);

    if (this.proxyService.isEnabled()) {
      const proxyConfig = this.proxyService.getAxiosProxyConfig();

      if (proxyConfig) {
        // Configurar proxy padrão para todas as requisições
        this.apiClient.defaults.proxy = proxyConfig;

        console.log(`✅ [${requestId}] Proxy Fixie configurado com sucesso`);
        console.log(
          `🌐 [${requestId}] Host: ${proxyConfig.host}:${proxyConfig.port}`
        );
        console.log(`👤 [${requestId}] Usuário: ${proxyConfig.auth.username}`);
        console.log(
          `🔒 [${requestId}] Senha: ${proxyConfig.auth.password ? "****" : "não fornecida"}`
        );
      } else {
        console.error(`❌ [${requestId}] Falha ao configurar proxy Fixie`);
      }
    } else {
      console.log(
        `⚠️  [${requestId}] Proxy não habilitado - usando conexão direta`
      );
      console.log(
        `💡 [${requestId}] Para habilitar, configure FIXIE_URL no ambiente`
      );
    }

    console.log(`🔧 [${requestId}] ===== FIM CONFIGURAÇÃO PROXY =====`);
  }

  /**
   * Configura interceptors para logs detalhados
   * VERSÃO CORRIGIDA - NÃO sobrescreve o payload
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.apiClient.interceptors.request.use(
      (config) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log(`📡 [${requestId}] ===== REQUISIÇÃO SAINDO =====`);
        console.log(`🔗 [${requestId}] URL: ${config.baseURL}${config.url}`);
        console.log(
          `📋 [${requestId}] Método: ${config.method?.toUpperCase()}`
        );
        console.log(`📋 [${requestId}] Headers:`, config.headers);

        // Log do payload ORIGINAL (antes de qualquer modificação)
        console.log(`📦 [${requestId}] Payload original:`, config.data);

        // Log do proxy se configurado
        if (config.proxy) {
          console.log(
            `🔄 [${requestId}] Proxy: ${config.proxy.host}:${config.proxy.port}`
          );
          console.log(
            `👤 [${requestId}] Proxy Auth: ${config.proxy.auth?.username || "N/A"}`
          );
        } else {
          console.log(`🔄 [${requestId}] Proxy: Conexão direta`);
        }

        // CORREÇÃO: Adicionar metadata SEM sobrescrever o payload
        // Usar um campo separado para tracking
        config.metadata = {
          requestId,
          startTime: Date.now(),
        };

        // NÃO MODIFICAR config.data - manter o payload original intacto

        return config;
      },
      (error) => {
        console.error("❌ [Request Interceptor] Erro na requisição:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.apiClient.interceptors.response.use(
      (response) => {
        // Pegar metadata do campo correto
        const requestId = response.config.metadata?.requestId || "unknown";
        const startTime = response.config.metadata?.startTime || Date.now();
        const duration = Date.now() - startTime;

        console.log(`📨 [${requestId}] ===== RESPOSTA RECEBIDA =====`);
        console.log(`⏱️  [${requestId}] Duração: ${duration}ms`);
        console.log(
          `📊 [${requestId}] Status: ${response.status} ${response.statusText}`
        );
        console.log(
          `📄 [${requestId}] Tamanho: ${JSON.stringify(response.data).length} bytes`
        );

        // Log específico para sucesso
        if (response.data?.isSuccess) {
          console.log(`✅ [${requestId}] API retornou sucesso`);
        } else if (response.data?.isSuccess === false) {
          console.log(
            `⚠️  [${requestId}] API retornou erro: ${response.data.message}`
          );
        }

        console.log(`📨 [${requestId}] ===== FIM RESPOSTA =====`);
        return response;
      },
      (error) => {
        // Pegar metadata do campo correto
        const requestId = error.config?.metadata?.requestId || "unknown";
        const startTime = error.config?.metadata?.startTime || Date.now();
        const duration = Date.now() - startTime;

        console.error(`❌ [${requestId}] ===== ERRO NA RESPOSTA =====`);
        console.error(`⏱️  [${requestId}] Duração até erro: ${duration}ms`);

        if (error.response) {
          console.error(
            `📊 [${requestId}] Status HTTP: ${error.response.status}`
          );
          console.error(
            `📄 [${requestId}] Dados do erro:`,
            error.response.data
          );
          console.error(
            `📋 [${requestId}] Headers da resposta:`,
            error.response.headers
          );
        } else if (error.request) {
          console.error(`📡 [${requestId}] Requisição feita mas sem resposta`);
          console.error(`🌐 [${requestId}] Detalhes da requisição:`, {
            url: error.config?.url,
            method: error.config?.method,
            proxy: error.config?.proxy
              ? `${error.config.proxy.host}:${error.config.proxy.port}`
              : "direto",
          });
        } else {
          console.error(
            `⚙️  [${requestId}] Erro na configuração:`,
            error.message
          );
        }

        console.error(`❌ [${requestId}] ===== FIM ERRO =====`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Testa conectividade básica com logs aprimorados
   */
  public async testConnectivity(): Promise<boolean> {
    const requestId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🔍 [${requestId}] ===== TESTE DE CONECTIVIDADE =====`);
    console.log(`🌐 [${requestId}] URL base: ${this.baseUrl}`);

    const proxyInfo = this.proxyService.getProxyInfo();
    console.log(`🔄 [${requestId}] Proxy status:`, proxyInfo);

    const startTime = Date.now();

    try {
      // Tenta fazer uma requisição simples sem autenticação
      await axios.get(`${this.baseUrl}/ping`, {
        timeout: 5000,
        validateStatus: () => true, // Aceita qualquer status de resposta
        proxy: this.proxyService.getAxiosProxyConfig(), // Usar proxy se disponível
      });

      const elapsedTime = Date.now() - startTime;
      console.log(
        `✅ [${requestId}] Conectividade confirmada em ${elapsedTime}ms`
      );
      console.log(`🔍 [${requestId}] ===== FIM TESTE CONECTIVIDADE =====`);

      return true;
    } catch (error: any) {
      const elapsedTime = Date.now() - startTime;
      console.error(
        `❌ [${requestId}] Falha na conectividade após ${elapsedTime}ms`
      );
      console.error(`❌ [${requestId}] Erro:`, error.message);

      // Log detalhado de erros de rede
      if (error.code) {
        console.error(`🏷️  [${requestId}] Código do erro:`, error.code);
      }

      console.error(`🔍 [${requestId}] ===== FIM TESTE CONECTIVIDADE =====`);
      return false;
    }
  }

  private isTokenValid(): boolean {
    if (!this.token || !this.tokenExpiry) {
      return false;
    }
    // Verifica se o token expira em menos de 5 minutos
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    return this.tokenExpiry > fiveMinutesFromNow;
  }

  /**
   * Autentica na API da Nelogica e obtém um token
   */
  public async login(): Promise<void> {
    // Evita múltiplas tentativas de login simultâneas
    if (this.isLoggingIn) {
      console.log("[Nelogica API] Login já está em andamento, aguardando...");

      // Espera até que o login em andamento termine
      while (this.isLoggingIn) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Se já temos um token válido após o login anterior, retornamos
      if (this.isTokenValid()) {
        return;
      }
    }

    // Se o token já é válido, não precisamos fazer login novamente
    if (this.isTokenValid()) {
      return;
    }

    const startTime = Date.now();

    try {
      const startTime = Date.now();
      this.isLoggingIn = true;
      console.log("[Nelogica API] Iniciando autenticação...");
      // Log detalhado da requisição
      console.log(
        `[Nelogica API] URL completa: ${this.baseUrl}/api/v2/auth/login`
      );
      console.log(
        `[Nelogica API] Payload de autenticação: { username: "${this.username}", password: "${this.password}" }`
      );

      const response = await this.apiClient.post<NelogicaAuthResponse>(
        "/api/v2/auth/login",
        {
          username: this.username,
          password: this.password,
        }
      );

      const elapsedTime = Date.now() - startTime;
      console.log(`[Nelogica API] Resposta recebida em ${elapsedTime}ms`);

      if (response.data.isSuccess) {
        this.token = response.data.data.token;
        this.tokenExpiry = new Date(response.data.data.expiresAt);
        console.log(
          "[Nelogica API] Autenticação bem-sucedida, token válido até:",
          this.tokenExpiry
        );
      } else {
        console.error(
          `[Nelogica API] Falha na autenticação: ${response.data.message}`
        );
        throw new Error(`Falha na autenticação: ${response.data.message}`);
      }
    } catch (error: any) {
      const elapsedTime = Date.now() - startTime;
      console.error(
        `[Nelogica API] Erro de autenticação após ${elapsedTime}ms:`,
        error.message
      );

      // Log detalhado do erro
      if (error.isAxiosError) {
        console.error("[Nelogica API] Detalhes do erro:", {
          message: error.message,
          code: error.code,
          request: {
            url: `${this.baseUrl}/api/v2/auth/login`,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            data: { username: this.username, password: "[REDACTED]" },
          },
          response: error.response
            ? {
                status: error.response.status,
                statusText: error.response.statusText,
                headers: error.response.headers,
                data: error.response.data,
              }
            : "No response",
        });
      } else {
        console.error("[Nelogica API] Erro não Axios:", error);
      }

      throw new Error(`Falha na autenticação: ${error.message}`);
    } finally {
      this.isLoggingIn = false;
    }
  }

  /**
   * Executa uma chamada de API garantindo que estamos autenticados
   */
  private async executeApiCall<T>(apiCallFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    console.log("[Nelogica API] Iniciando execução de chamada de API");

    // Certifique-se de que estamos autenticados
    if (!this.isTokenValid()) {
      console.log(
        "[Nelogica API] Token inválido ou expirado, realizando login"
      );
      await this.login();
    } else {
      console.log("[Nelogica API] Usando token existente válido");
    }

    try {
      // Configure o token de autenticação para esta chamada
      this.apiClient.defaults.headers.common["Authorization"] =
        `Bearer ${this.token}`;
      console.log("[Nelogica API] Token configurado nos headers");

      // Execute a chamada da API
      console.log("[Nelogica API] Executando chamada à API");
      const result = await apiCallFn();

      const elapsedTime = Date.now() - startTime;
      console.log(
        `[Nelogica API] Chamada concluída com sucesso em ${elapsedTime}ms`
      );

      return result;
    } catch (error: any) {
      const elapsedTime = Date.now() - startTime;
      console.error(
        `[Nelogica API] Erro na chamada após ${elapsedTime}ms:`,
        error.message
      );

      // Se recebemos erro 401, o token pode ter expirado mesmo que achássemos que estava válido
      if (error.response?.status === 401) {
        console.log(
          "[Nelogica API] Token expirado (401), obtendo novo token..."
        );
        this.token = null;
        this.tokenExpiry = null;
        await this.login();

        // Tenta novamente com o novo token
        console.log("[Nelogica API] Tentando novamente com novo token");
        this.apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${this.token}`;
        return await apiCallFn();
      }

      // Log detalhado de erros de rede
      if (error.isAxiosError) {
        console.error("[Nelogica API] Detalhes do erro de rede:", {
          code: error.code,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            timeout: error.config?.timeout,
            baseURL: error.config?.baseURL,
          },
          response: error.response
            ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
              }
            : "Sem resposta",
        });
      }

      throw error;
    }
  }

  /**
   * Registra uma nova assinatura e cliente na Nelogica
   */
  public async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<NelogicaSubscriptionResponse> {
    try {
      console.log("[Nelogica API] Criando nova assinatura para:", params.email);

      return await this.executeApiCall(async () => {
        const response =
          await this.apiClient.post<NelogicaSubscriptionResponse>(
            "api/v2/manager/subscriptions",
            params
          );

        if (response.data.isSuccess) {
          console.log(
            "[Nelogica API] Assinatura criada com sucesso:",
            response.data.data.subscriptionId
          );
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao criar assinatura:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao criar assinatura: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Cria uma nova conta para uma licença
   */
  public async createAccount(
    licenseId: string,
    accounts: CreateAccountParams[]
  ): Promise<NelogicaCreateAccountResponse> {
    try {
      console.log(
        `[Nelogica API] Criando ${accounts.length} conta(s) para a licença:`,
        licenseId
      );

      return await this.executeApiCall(async () => {
        const response =
          await this.apiClient.post<NelogicaCreateAccountResponse>(
            `api/v2/manager/${licenseId}/accounts`,
            accounts
          );

        if (response.data.isSuccess) {
          console.log(
            "[Nelogica API] Contas criadas com sucesso:",
            response.data.data
          );
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao criar conta:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao criar conta: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Cancela uma assinatura
   */
  public async cancelSubscription(
    subscriptionId: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Cancelando assinatura:", subscriptionId);

      return await this.executeApiCall(async () => {
        const response = await this.apiClient.delete<NelogicaGenericResponse>(
          `api/v2/commerce/subscriptions/products/${subscriptionId}`
        );

        if (response.data.isSuccess) {
          console.log("[Nelogica API] Assinatura cancelada com sucesso");
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao cancelar assinatura:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao cancelar assinatura: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Bloqueia uma conta
   */
  public async blockAccount(
    licenseId: string,
    account: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Bloqueando conta:", account);

      return await this.executeApiCall(async () => {
        const response = await this.apiClient.put<NelogicaGenericResponse>(
          `api/v2/manager/licenses/${licenseId}/block/accounts/${account}`
        );

        if (response.data.isSuccess) {
          console.log("[Nelogica API] Conta bloqueada com sucesso");
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao bloquear conta:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao bloquear conta: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Desbloqueia uma conta
   */
  public async unblockAccount(
    licenseId: string,
    account: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Desbloqueando conta:", account);

      return await this.executeApiCall(async () => {
        const response = await this.apiClient.delete<NelogicaGenericResponse>(
          `api/v2/manager/licenses/${licenseId}/block/accounts/${account}`
        );

        if (response.data.isSuccess) {
          console.log("[Nelogica API] Conta desbloqueada com sucesso");
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao desbloquear conta:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao desbloquear conta: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Define o perfil de risco para uma conta
   */
  public async setAccountRisk(
    licenseId: string,
    account: string,
    profileId: string,
    accountType: number = 0
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log(
        "[Nelogica API] Configurando perfil de risco para conta:",
        account
      );

      return await this.executeApiCall(async () => {
        const response = await this.apiClient.post<NelogicaGenericResponse>(
          `api/v2/manager/${licenseId}/accounts/${account}`,
          {
            profileId,
            accountType,
          }
        );

        if (response.data.isSuccess) {
          console.log("[Nelogica API] Perfil de risco configurado com sucesso");
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao definir perfil de risco:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao definir perfil de risco: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Remove uma conta
   */
  public async removeAccount(
    licenseId: string,
    account: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Removendo conta:", account);

      return await this.executeApiCall(async () => {
        const response = await this.apiClient.delete<NelogicaGenericResponse>(
          `api/v2/manager/license/${licenseId}/accounts/${account}`
        );

        if (response.data.isSuccess) {
          console.log("[Nelogica API] Conta removida com sucesso");
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao remover conta:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao remover conta: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Lista ambientes disponíveis
   */
  public async listEnvironments(
    params?: PaginationParams
  ): Promise<NelogicaEnvironmentsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.pageNumber)
        queryParams.append("pageNumber", params.pageNumber.toString());
      if (params?.pageSize)
        queryParams.append("pageSize", params.pageSize.toString());

      const url = `api/v2/commerce/environments${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      console.log("[Nelogica API] Listando ambientes");

      return await this.executeApiCall(async () => {
        const response =
          await this.apiClient.post<NelogicaEnvironmentsResponse>(url);

        if (response.data.isSuccess) {
          console.log(
            "[Nelogica API] Ambientes obtidos com sucesso:",
            response.data.data.environments.length
          );
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao listar ambientes:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao listar ambientes: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Lista perfis de risco
   */
  public async listRiskProfiles(
    environmentId: string,
    params?: PaginationParams
  ): Promise<NelogicaRiskProfilesResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.pageNumber)
        queryParams.append("pageNumber", params.pageNumber.toString());
      if (params?.pageSize)
        queryParams.append("pageSize", params.pageSize.toString());

      const url = `api/v2/manager/risk/${environmentId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      console.log(
        "[Nelogica API] Listando perfis de risco para o ambiente:",
        environmentId
      );

      return await this.executeApiCall(async () => {
        const response =
          await this.apiClient.get<NelogicaRiskProfilesResponse>(url);

        if (response.data.isSuccess) {
          console.log(
            "[Nelogica API] Perfis de risco obtidos com sucesso:",
            response.data.data.riskProfiles.length
          );
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao listar perfis de risco:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao listar perfis de risco: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Cria um perfil de risco
   */
  public async createRiskProfile(
    environmentId: string,
    params: RiskProfileParams
  ): Promise<NelogicaCreateRiskResponse> {
    try {
      console.log(
        "[Nelogica API] Criando perfil de risco para o ambiente:",
        environmentId
      );

      return await this.executeApiCall(async () => {
        const response = await this.apiClient.post<NelogicaCreateRiskResponse>(
          `api/v2/manager/risk/`,
          params
        );

        if (response.data.isSuccess) {
          console.log(
            "[Nelogica API] Perfil de risco criado com sucesso:",
            response.data.data.profileId
          );
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao criar perfil de risco:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao criar perfil de risco: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Atualiza um perfil de risco
   */
  public async updateRiskProfile(
    environmentId: string,
    params: UpdateRiskProfileParams
  ): Promise<NelogicaCreateRiskResponse> {
    try {
      console.log(
        "[Nelogica API] Atualizando perfil de risco:",
        params.profileId
      );

      return await this.executeApiCall(async () => {
        const response = await this.apiClient.put<NelogicaCreateRiskResponse>(
          `api/v2/manager/risk/${environmentId}`,
          params
        );

        if (response.data.isSuccess) {
          console.log("[Nelogica API] Perfil de risco atualizado com sucesso");
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao atualizar perfil de risco:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao atualizar perfil de risco: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Lista assinaturas com logs detalhados
   */
  public async listSubscriptions(params?: {
    customerId?: string;
    account?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<NelogicaSubscriptionsResponse> {
    const requestId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(
        `🔌 [${requestId}] ===== NELOGICA API CLIENT: LIST SUBSCRIPTIONS =====`
      );

      // Log dos parâmetros
      console.log(
        `📝 [${requestId}] Parâmetros da chamada:`,
        params || "Nenhum parâmetro"
      );

      // Construir query string
      const queryParams = new URLSearchParams();
      if (params?.customerId) {
        queryParams.append("customerId", params.customerId);
        console.log(
          `🔍 [${requestId}] Filtro customerId: ${params.customerId}`
        );
      }
      if (params?.account) {
        queryParams.append("account", params.account);
        console.log(`🔍 [${requestId}] Filtro account: ${params.account}`);
      }
      if (params?.pageNumber) {
        queryParams.append("pageNumber", params.pageNumber.toString());
        console.log(`📄 [${requestId}] Página: ${params.pageNumber}`);
      }
      if (params?.pageSize) {
        queryParams.append("pageSize", params.pageSize.toString());
        console.log(`📄 [${requestId}] Tamanho da página: ${params.pageSize}`);
      }

      // Construir URL final
      const endpoint = "api/v2/manager/subscriptions";
      const queryString = queryParams.toString();
      const url = `${endpoint}${queryString ? `?${queryString}` : ""}`;

      console.log(`🌐 [${requestId}] Base URL: ${this.baseUrl}`);
      console.log(`🔗 [${requestId}] Endpoint: ${endpoint}`);
      console.log(
        `🔗 [${requestId}] Query String: ${queryString || "Nenhuma"}`
      );
      console.log(`🔗 [${requestId}] URL Completa: ${this.baseUrl}/${url}`);

      // Verificar autenticação antes da chamada
      if (!this.isTokenValid()) {
        console.log(
          `🔐 [${requestId}] Token inválido ou expirado, fazendo login...`
        );
        await this.login();
        console.log(`✅ [${requestId}] Login realizado com sucesso`);
      } else {
        console.log(
          `✅ [${requestId}] Token válido, prosseguindo com a chamada`
        );
      }

      // Log dos headers que serão enviados
      const headers = {
        ...this.apiClient.defaults.headers.common,
        Authorization: `Bearer ${this.token?.substring(0, 20)}...`, // Log parcial do token
      };
      console.log(`📋 [${requestId}] Headers da requisição:`, headers);

      return await this.executeApiCall(async () => {
        console.log(`📡 [${requestId}] Iniciando requisição HTTP...`);
        const startTime = Date.now();

        try {
          const response =
            await this.apiClient.get<NelogicaSubscriptionsResponse>(url);
          const duration = Date.now() - startTime;

          console.log(
            `⏱️  [${requestId}] Requisição HTTP completada em ${duration}ms`
          );
          console.log(`📊 [${requestId}] Status HTTP: ${response.status}`);
          console.log(`📊 [${requestId}] Status Text: ${response.statusText}`);

          // Log dos headers de resposta
          console.log(
            `📋 [${requestId}] Headers de resposta:`,
            response.headers
          );

          // Log da estrutura da resposta
          console.log(
            `📄 [${requestId}] Response.data.isSuccess:`,
            response.data.isSuccess
          );
          console.log(
            `📄 [${requestId}] Response.data.status:`,
            response.data.status
          );
          console.log(
            `📄 [${requestId}] Response.data.message:`,
            response.data.message
          );

          if (response.data.data) {
            const data = response.data.data;
            console.log(
              `📊 [${requestId}] Subscriptions array length:`,
              data.subscriptions?.length || 0
            );

            if (data.parameters?.pagination) {
              console.log(
                `📄 [${requestId}] Pagination info:`,
                data.parameters.pagination
              );
            }

            if (data.subscriptions && data.subscriptions.length > 0) {
              console.log(
                `📋 [${requestId}] Primeira subscription (estrutura):`,
                {
                  subscriptionId: data.subscriptions[0].subscriptionId,
                  licenseId: data.subscriptions[0].licenseId,
                  customerId: data.subscriptions[0].customerId,
                  planId: data.subscriptions[0].planId,
                  createdAt: data.subscriptions[0].createdAt,
                  accounts: Array.isArray(data.subscriptions[0].accounts)
                    ? `Array com ${data.subscriptions[0].accounts.length} itens`
                    : typeof data.subscriptions[0].accounts,
                }
              );

              // Log das propriedades disponíveis
              console.log(
                `🔍 [${requestId}] Propriedades da primeira subscription:`,
                Object.keys(data.subscriptions[0])
              );
            }
          }

          console.log(`✅ [${requestId}] ===== SUCESSO API CLIENT =====`);
          return response.data;
        } catch (httpError: any) {
          const duration = Date.now() - startTime;

          console.error(
            `❌ [${requestId}] ===== ERRO HTTP NA REQUISIÇÃO =====`
          );
          console.error(`❌ [${requestId}] Tempo até o erro: ${duration}ms`);
          console.error(
            `❌ [${requestId}] Tipo do erro:`,
            httpError?.constructor?.name || "Unknown"
          );

          if (httpError.response) {
            console.error(
              `🌐 [${requestId}] Status: ${httpError.response.status}`
            );
            console.error(
              `🌐 [${requestId}] Status Text: ${httpError.response.statusText}`
            );
            console.error(
              `🌐 [${requestId}] Headers: ${JSON.stringify(httpError.response.headers)}`
            );
            console.error(`🌐 [${requestId}] Data:`, httpError.response.data);
          } else if (httpError.request) {
            console.error(
              `📡 [${requestId}] Request foi feito mas sem resposta`
            );
            console.error(`📡 [${requestId}] Request:`, httpError.request);
          } else {
            console.error(
              `⚠️  [${requestId}] Erro ao configurar request:`,
              httpError.message
            );
          }

          if (httpError.code) {
            console.error(`🏷️  [${requestId}] Error Code:`, httpError.code);
          }

          console.error(`❌ [${requestId}] ===== FIM ERRO HTTP =====`);
          throw httpError;
        }
      });
    } catch (error) {
      console.error(`❌ [${requestId}] ===== ERRO GERAL API CLIENT =====`);
      console.error(`❌ [${requestId}] Erro ao listar assinaturas:`, error);

      if (error instanceof Error) {
        console.error(`❌ [${requestId}] Stack trace:`, error.stack);
      }

      console.error(`❌ [${requestId}] ===== FIM ERRO GERAL =====`);

      throw new Error(
        `Falha ao listar assinaturas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Atualiza um cliente
   */
  public async updateCustomer(
    customerId: string,
    firstName: string,
    lastName: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Atualizando cliente:", customerId);

      return await this.executeApiCall(async () => {
        const response = await this.apiClient.put<NelogicaGenericResponse>(
          `api/v2/manager/customers/${customerId}`,
          {
            firstName,
            lastName,
          }
        );

        if (response.data.isSuccess) {
          console.log("[Nelogica API] Cliente atualizado com sucesso");
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao atualizar cliente:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao atualizar cliente: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Obtém detalhes de um cliente
   */
  public async getCustomerDetails(
    customerId: string
  ): Promise<NelogicaGenericResponse> {
    try {
      console.log("[Nelogica API] Obtendo detalhes do cliente:", customerId);

      return await this.executeApiCall(async () => {
        const response = await this.apiClient.get<NelogicaGenericResponse>(
          `api/v2/manager/customers/${customerId}`
        );

        if (response.data.isSuccess) {
          console.log("[Nelogica API] Detalhes do cliente obtidos com sucesso");
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao obter detalhes do cliente:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao obter detalhes do cliente: ${error.response?.data?.message || error.message}`
      );
    }
  }
}
