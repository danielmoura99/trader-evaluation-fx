/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/nelogica-uat-client.ts
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
 * Cliente para a API da Nelogica no ambiente UAT
 * Utiliza diretamente o token estático fornecido
 */
export class NelogicaUatClient {
  private baseUrl: string;
  private apiClient: AxiosInstance;
  private token: string;

  constructor(ip: string, port: number, token: string) {
    this.baseUrl = `http://${ip}:${port}`;
    this.token = token;

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    });

    console.log(`[Nelogica UAT] Cliente inicializado para ${this.baseUrl}`);
  }

  /**
   * Testa a conexão com a API
   */
  public async testConnection(): Promise<boolean> {
    try {
      // Vamos tentar listar os ambientes como um teste simples
      const response = await this.apiClient.post(
        "api/v2/commerce/environments"
      );
      return response.status === 200;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao testar conexão:",
        error.response?.data || error.message
      );
      return false;
    }
  }

  /**
   * Registra uma nova assinatura e cliente na Nelogica
   */
  public async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<NelogicaSubscriptionResponse> {
    try {
      console.log("[Nelogica UAT] Criando nova assinatura para:", params.email);

      const response = await this.apiClient.post<NelogicaSubscriptionResponse>(
        "api/v2/manager/subscriptions",
        params
      );

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica UAT] Assinatura criada com sucesso:",
          response.data.data.subscriptionId
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao criar assinatura:",
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
        `[Nelogica UAT] Criando ${accounts.length} conta(s) para a licença:`,
        licenseId
      );

      const response = await this.apiClient.post<NelogicaCreateAccountResponse>(
        `api/v2/manager/${licenseId}/accounts`,
        accounts
      );

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica UAT] Contas criadas com sucesso:",
          response.data.data
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao criar conta:",
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
      console.log("[Nelogica UAT] Cancelando assinatura:", subscriptionId);

      const response = await this.apiClient.delete<NelogicaGenericResponse>(
        `api/v2/commerce/subscriptions/products/${subscriptionId}`
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica UAT] Assinatura cancelada com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao cancelar assinatura:",
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
      console.log("[Nelogica UAT] Bloqueando conta:", account);

      const response = await this.apiClient.put<NelogicaGenericResponse>(
        `api/v2/manager/licenses/${licenseId}/block/accounts/${account}`
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica UAT] Conta bloqueada com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao bloquear conta:",
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
      console.log("[Nelogica UAT] Desbloqueando conta:", account);

      const response = await this.apiClient.delete<NelogicaGenericResponse>(
        `api/v2/manager/licenses/${licenseId}/block/accounts/${account}`
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica UAT] Conta desbloqueada com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao desbloquear conta:",
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
        "[Nelogica UAT] Configurando perfil de risco para conta:",
        account
      );

      const response = await this.apiClient.post<NelogicaGenericResponse>(
        `api/v2/manager/${licenseId}/accounts/${account}`,
        {
          profileId,
          accountType,
        }
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica UAT] Perfil de risco configurado com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao definir perfil de risco:",
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
      console.log("[Nelogica UAT] Removendo conta:", account);

      const response = await this.apiClient.delete<NelogicaGenericResponse>(
        `api/v2/manager/license/${licenseId}/accounts/${account}`
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica UAT] Conta removida com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao remover conta:",
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

      console.log("[Nelogica UAT] Listando ambientes");

      const response =
        await this.apiClient.post<NelogicaEnvironmentsResponse>(url);

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica UAT] Ambientes obtidos com sucesso:",
          response.data.data.environments.length
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao listar ambientes:",
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
        "[Nelogica UAT] Listando perfis de risco para o ambiente:",
        environmentId
      );

      const response =
        await this.apiClient.get<NelogicaRiskProfilesResponse>(url);

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica UAT] Perfis de risco obtidos com sucesso:",
          response.data.data.riskProfiles.length
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao listar perfis de risco:",
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
        "[Nelogica UAT] Criando perfil de risco para o ambiente:",
        environmentId
      );

      const response = await this.apiClient.post<NelogicaCreateRiskResponse>(
        `api/v2/manager/risk/${environmentId}`,
        params
      );

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica UAT] Perfil de risco criado com sucesso:",
          response.data.data.profileId
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao criar perfil de risco:",
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
        "[Nelogica UAT] Atualizando perfil de risco:",
        params.profileId
      );

      const response = await this.apiClient.put<NelogicaCreateRiskResponse>(
        `api/v2/manager/risk/${environmentId}`,
        params
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica UAT] Perfil de risco atualizado com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao atualizar perfil de risco:",
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
  public async listSubscriptions(
    params?: { account?: string; customerId?: string } & PaginationParams
  ): Promise<NelogicaSubscriptionsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.account) queryParams.append("account", params.account);
      if (params?.customerId)
        queryParams.append("customerId", params.customerId);
      if (params?.pageNumber)
        queryParams.append("pageNumber", params.pageNumber.toString());
      if (params?.pageSize)
        queryParams.append("pageSize", params.pageSize.toString());

      const url = `api/v2/manager/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      console.log("[Nelogica UAT] Listando assinaturas");

      const response =
        await this.apiClient.get<NelogicaSubscriptionsResponse>(url);

      if (response.data.isSuccess) {
        console.log(
          "[Nelogica UAT] Assinaturas obtidas com sucesso:",
          response.data.data.subscriptions.length
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao listar assinaturas:",
        error.response?.data || error.message
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
      console.log("[Nelogica UAT] Atualizando cliente:", customerId);

      const response = await this.apiClient.put<NelogicaGenericResponse>(
        `api/v2/manager/customers/${customerId}`,
        {
          firstName,
          lastName,
        }
      );

      if (response.data.isSuccess) {
        console.log("[Nelogica UAT] Cliente atualizado com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "[Nelogica UAT] Erro ao atualizar cliente:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao atualizar cliente: ${error.response?.data?.message || error.message}`
      );
    }
  }
}
