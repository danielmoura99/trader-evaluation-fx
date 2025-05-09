/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/nelogica-api-client.ts
import axios, { AxiosInstance } from "axios";

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

  constructor(
    baseUrl: string,
    private username: string,
    private password: string
  ) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    console.log(`[Nelogica API] Cliente inicializado para ${this.baseUrl}`);
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
   * Lista assinaturas
   */
  public async listSubscriptions(params?: {
    // Removemos subscriptionId já que não é suportado diretamente pela API
    customerId?: string;
    account?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<NelogicaSubscriptionsResponse> {
    try {
      const queryParams = new URLSearchParams();

      // Apenas adicionar parâmetros suportados
      if (params?.customerId)
        queryParams.append("customerId", params.customerId);
      if (params?.account) queryParams.append("account", params.account);
      if (params?.pageNumber)
        queryParams.append("pageNumber", params.pageNumber.toString());
      if (params?.pageSize)
        queryParams.append("pageSize", params.pageSize.toString());

      const url = `api/v2/manager/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      return await this.executeApiCall(async () => {
        const response =
          await this.apiClient.get<NelogicaSubscriptionsResponse>(url);
        return response.data;
      });
    } catch (error) {
      console.error("[Nelogica API] Erro ao listar assinaturas:", error);
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
   * Testa a conectividade básica com o servidor da Nelogica
   */
  public async testConnectivity(): Promise<boolean> {
    console.log(`[Nelogica API] Testando conectividade com ${this.baseUrl}`);
    const startTime = Date.now();

    try {
      // Tenta fazer uma requisição simples sem autenticação
      await axios.get(`${this.baseUrl}/ping`, {
        timeout: 5000,
        validateStatus: () => true, // Aceita qualquer status de resposta
      });

      const elapsedTime = Date.now() - startTime;
      console.log(
        `[Nelogica API] Conectividade confirmada em ${elapsedTime}ms`
      );
      return true;
    } catch (error: any) {
      const elapsedTime = Date.now() - startTime;
      console.error(
        `[Nelogica API] Falha na conectividade após ${elapsedTime}ms:`,
        error.message
      );

      // Log detalhado de erros de rede
      if (error.isAxiosError) {
        console.error("[Nelogica API] Detalhes do erro de conectividade:", {
          code: error.code,
          message: error.message,
          hostname: new URL(this.baseUrl).hostname,
          port: new URL(this.baseUrl).port || "default",
        });
      }

      return false;
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
