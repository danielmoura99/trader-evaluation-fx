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

/// Processo completo do release da plataforma Trader

// 1. ADICIONAR ESTAS INTERFACES ANTES DA CLASSE NelogicaApiClient

/**
 * Interface para parâmetros da função releaseTraderPlatformV2
 */
export interface ReleaseTraderPlatformParams {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: Date;
  address?: string;
  zipCode?: string;
  plan: string;
}

/**
 * Interface para o resultado da liberação da plataforma
 */
export interface ReleaseTraderPlatformResult {
  customerId: string;
  subscriptionId: string;
  licenseId: string;
  account: string;
  profileId: string;
  startDate: Date;
  endDate: Date;
}

///// encerramento do release da plataforma Trader

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
   * Configura interceptadores para logging limpo
   */
  private setupInterceptors(): void {
    // Interceptor de requisição - apenas log essencial
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log(
          `[Nelogica API] ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error(
          "[Nelogica API] Erro na configuração da requisição:",
          error.message
        );
        return Promise.reject(error);
      }
    );

    // Interceptor de resposta - log limpo
    this.apiClient.interceptors.response.use(
      (response) => {
        if (response.data?.isSuccess === false) {
          console.warn(
            `[Nelogica API] API retornou erro: ${response.data.message}`
          );
        }
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(
            `[Nelogica API] Erro HTTP ${error.response.status}: ${error.response.statusText}`
          );
        } else if (error.request) {
          console.error("[Nelogica API] Sem resposta do servidor");
        } else {
          console.error(`[Nelogica API] Erro na requisição: ${error.message}`);
        }
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
   * Realiza login na API da Nelogica
   */
  public async login(): Promise<void> {
    if (this.isLoggingIn) {
      console.log("[Nelogica API] Login já em andamento, aguardando");
      // Aguarda o login em andamento
      while (this.isLoggingIn) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoggingIn = true;

    try {
      console.log("[Nelogica API] Realizando autenticação");

      const response = await this.apiClient.post<NelogicaAuthResponse>(
        "api/v2/auth/login",
        {
          username: this.username,
          password: this.password,
        }
      );

      if (response.data.isSuccess && response.data.data?.token) {
        this.token = response.data.data.token;

        // Calcular expiração do token (assumindo 1 hora se não especificado)
        const expiresInMs = 60 * 60 * 1000; // 1 hora
        this.tokenExpiry = new Date(Date.now() + expiresInMs);

        console.log("[Nelogica API] Autenticação realizada com sucesso");
      } else {
        throw new Error(response.data.message || "Falha na autenticação");
      }
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro na autenticação:",
        error.response?.data?.message || error.message
      );

      // Reset token em caso de erro
      this.token = null;
      this.tokenExpiry = null;

      throw new Error(`Falha na autenticação: ${error.message}`);
    } finally {
      this.isLoggingIn = false;
    }
  }

  /**
   * Executa uma chamada de API garantindo que estamos autenticados
   */
  private async executeApiCall<T>(apiCallFn: () => Promise<T>): Promise<T> {
    // Certifique-se de que estamos autenticados
    if (!this.isTokenValid()) {
      console.log("[Nelogica API] Token expirado, realizando login");
      await this.login();
    }

    try {
      // Configure o token de autenticação para esta chamada
      this.apiClient.defaults.headers.common["Authorization"] =
        `Bearer ${this.token}`;

      // Execute a chamada da API
      return await apiCallFn();
    } catch (error: any) {
      // Se recebemos erro 401, o token pode ter expirado
      if (error.response?.status === 401) {
        console.log("[Nelogica API] Token expirado (401), renovando token");
        this.token = null;
        this.tokenExpiry = null;
        await this.login();

        // Tenta novamente com o novo token
        this.apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${this.token}`;
        return await apiCallFn();
      }

      // Log apenas erros importantes
      if (error.isAxiosError && error.response) {
        console.error(
          `[Nelogica API] Erro HTTP ${error.response.status}: ${error.response.statusText}`
        );
        if (error.response.data?.message) {
          console.error(
            `[Nelogica API] Mensagem: ${error.response.data.message}`
          );
        }
      } else {
        console.error(`[Nelogica API] Erro de rede: ${error.message}`);
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
   * Lista assinaturas filtradas por planId específico
   */
  public async listSubscriptions(params?: {
    customerId?: string;
    account?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<NelogicaSubscriptionsResponse> {
    // ID do plano específico da TradersHouse
    const TARGET_PLAN_ID = "c0dc847f-8fe6-4a31-ab14-62c2977ed4a0";

    try {
      console.log("[Nelogica API] Listando assinaturas");

      // Construir query string
      const queryParams = new URLSearchParams();
      if (params?.customerId)
        queryParams.append("customerId", params.customerId);
      if (params?.account) queryParams.append("account", params.account);
      if (params?.pageNumber)
        queryParams.append("pageNumber", params.pageNumber.toString());
      if (params?.pageSize)
        queryParams.append("pageSize", params.pageSize.toString());

      const endpoint = "api/v2/manager/subscriptions";
      const queryString = queryParams.toString();
      const url = `${endpoint}${queryString ? `?${queryString}` : ""}`;

      return await this.executeApiCall(async () => {
        const response =
          await this.apiClient.get<NelogicaSubscriptionsResponse>(url);

        if (response.data.isSuccess && response.data.data?.subscriptions) {
          const allSubscriptions = response.data.data.subscriptions;

          // Filtrar assinaturas pelo planId específico
          const filteredSubscriptions = allSubscriptions.filter(
            (subscription) => subscription.planId === TARGET_PLAN_ID
          );

          console.log(
            `[Nelogica API] Assinaturas filtradas: ${filteredSubscriptions.length}/${allSubscriptions.length} (planId: ${TARGET_PLAN_ID})`
          );

          // Retornar resposta com assinaturas filtradas
          return {
            ...response.data,
            data: {
              ...response.data.data,
              subscriptions: filteredSubscriptions,
              parameters: {
                ...response.data.data.parameters,
                pagination: {
                  ...response.data.data.parameters.pagination,
                  totalRecords: filteredSubscriptions.length,
                  totalPages: Math.ceil(
                    filteredSubscriptions.length / (params?.pageSize || 10)
                  ),
                },
              },
            },
          };
        }

        if (!response.data.isSuccess) {
          console.warn(
            `[Nelogica API] Falha ao listar assinaturas: ${response.data.message}`
          );
        }

        return response.data;
      });
    } catch (error: any) {
      console.error(
        "[Nelogica API] Erro ao listar assinaturas:",
        error.message
      );
      throw new Error(
        `Falha ao listar assinaturas: ${error.response?.data?.message || error.message}`
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

  /**
   * FLUXO COMPLETO DE LIBERAÇÃO DE PLATAFORMA PARA TRADER - API V2
   *
   * Implementa o fluxo completo seguindo a documentação da API V2:
   * 1. Register Subscription (Endpoint 2)
   * 2. Create Account (Endpoint 3) com profileId fixo
   * 3. Atualizar banco local com status IN_PROGRESS
   *
   * @param params - Dados do cliente para liberação da plataforma
   * @returns Resultado com IDs criados na Nelogica e datas de avaliação
   */
  public async releaseTraderPlatformV2(
    params: ReleaseTraderPlatformParams
  ): Promise<ReleaseTraderPlatformResult> {
    const requestId = `release_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(
        `🚀 [${requestId}] ===== INÍCIO LIBERAÇÃO PLATAFORMA V2 =====`
      );
      console.log(
        `👤 [${requestId}] Cliente: ${params.name} (${params.email})`
      );
      console.log(`📋 [${requestId}] Plano: ${params.plan}`);
      console.log(`🆔 [${requestId}] Client ID: ${params.id}`);

      // ============ ETAPA 1: PREPARAR DADOS ============
      console.log(`📝 [${requestId}] Etapa 1: Preparando dados do cliente...`);

      // Dividir nome em primeiro e último nome
      const nameParts = params.name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;

      // Limpar CPF (remover formatação)
      const cleanCpf = params.cpf.replace(/\D/g, "");

      // Profile ID fixo conforme solicitado
      const profileId = "3182c870-22bf-42b1-9ad7-59293fd21563";

      console.log(`✅ [${requestId}] Dados processados:`, {
        firstName,
        lastName,
        cpf: cleanCpf,
        profileId,
      });

      // ============ ETAPA 2: CRIAR SUBSCRIPTION ============
      console.log(
        `🔄 [${requestId}] Etapa 2: Criando assinatura na Nelogica...`
      );

      // Reutiliza interface existente CreateSubscriptionParams
      const subscriptionParams: CreateSubscriptionParams = {
        planId: "c0dc847f-8fe6-4a31-ab14-62c2977ed4a0", // ID padrão do plano
        firstName,
        lastName,
        email: params.email,
        birth: params.birthDate.toISOString().split("T")[0], // YYYY-MM-DD
        gender: 1, // Assumindo masculino por padrão
        PhoneNumber: params.phone,
        countryNationality: "BRA",
        document: {
          documentType: 1, // 1 = CPF
          document: cleanCpf,
        },
        address: {
          street: params.address || "Endereço não informado",
          number: "S/N",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          country: "BRA",
          zipCode: params.zipCode || "01000-000",
        },
      };

      const subscriptionResult =
        await this.createSubscription(subscriptionParams);

      if (!subscriptionResult.isSuccess) {
        throw new Error(
          `Falha ao criar assinatura: ${subscriptionResult.message}`
        );
      }

      const { customerId, subscriptionId, licenseId } = subscriptionResult.data;

      console.log(`✅ [${requestId}] Assinatura criada com sucesso:`, {
        customerId,
        subscriptionId,
        licenseId,
      });

      // ============ ETAPA 3: CRIAR CONTA DEMO COM RISCO APLICADO ============
      console.log(
        `🔄 [${requestId}] Etapa 3: Criando conta DEMO com risco aplicado...`
      );

      // Reutiliza interface existente CreateAccountParams
      // 🎯 O risco é aplicado automaticamente ao passar o profileId!
      const accountParams: CreateAccountParams[] = [
        {
          name: `Conta ${params.plan} - ${firstName}`,
          profileId: profileId, // 👈 RISCO APLICADO AUTOMATICAMENTE AQUI!
          accountType: 0, // 0 = Demo/Desafio
        },
      ];

      const accountResult = await this.createAccount(licenseId, accountParams);

      if (!accountResult.isSuccess) {
        throw new Error(`Falha ao criar conta: ${accountResult.message}`);
      }

      const account = accountResult.data[0].account;
      const assignedProfileId = accountResult.data[0].profileId;

      console.log(`✅ [${requestId}] Conta DEMO criada com risco aplicado:`, {
        account,
        profileId: assignedProfileId,
      });

      // ============ ETAPA 4: DEFINIR PERÍODO DE AVALIAÇÃO ============
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 60); // 60 dias de avaliação

      console.log(`📅 [${requestId}] Período de avaliação definido:`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dias: 60,
      });

      // ============ ETAPA 5: ATUALIZAR BANCO LOCAL ============
      console.log(
        `💾 [${requestId}] Etapa 5: Atualizando banco de dados local...`
      );

      // Importar dinamicamente para evitar problemas de dependência circular
      const { prisma } = await import("@/lib/prisma");
      const { TraderStatus } = await import("@/app/types");

      await prisma.client.update({
        where: { id: params.id },
        data: {
          traderStatus: TraderStatus.IN_PROGRESS,
          nelogicaCustomerId: customerId,
          nelogicaSubscriptionId: subscriptionId,
          nelogicaLicenseId: licenseId,
          nelogicaAccount: account,
          startDate,
          endDate,
        },
      });

      console.log(`✅ [${requestId}] Cliente atualizado no banco local`);

      // ============ RESULTADO FINAL ============
      const result: ReleaseTraderPlatformResult = {
        customerId,
        subscriptionId,
        licenseId,
        account,
        profileId: assignedProfileId,
        startDate,
        endDate,
      };

      console.log(
        `🎉 [${requestId}] ===== LIBERAÇÃO CONCLUÍDA COM SUCESSO =====`
      );
      console.log(`📊 [${requestId}] Resultado final:`, result);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(
        `❌ [${requestId}] ERRO na liberação da plataforma:`,
        errorMessage
      );

      // Log detalhado do erro para debug
      if (error instanceof Error) {
        console.error(`🔍 [${requestId}] Stack trace:`, error.stack);
      }

      throw new Error(`Falha na liberação da plataforma V2: ${errorMessage}`);
    }
  }
}
