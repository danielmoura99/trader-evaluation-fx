/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/nelogica-service.ts
import {
  NelogicaApiClient,
  CreateSubscriptionParams,
  CreateAccountParams,
  RiskProfileParams,
} from "./nelogica-api-client";
import { prisma } from "@/lib/prisma";
import { TraderStatus } from "@/app/types";

/**
 * Mapeamento de perfis de risco da Nelogica
 * Estes são os perfis mostrados na documentação
 */
export const NELOGICA_PROFILES = {
  "FX - 5K": "5631e4fb-aa99-404c-b45a-9dd7915de825", // LEVEL 1 - $25,000
  "FX - 10K": "b4495f41-6f09-4c3b-b34c-0bc8d85f2f8f", // LEVEL 2 - $50,000
  "FX - 25K": "581f1d7d-b5b5-4c0e-82cf-3f4fd9834bb3", // LEVEL 3 - $100,000
  "FX - 50K": "e762b216-e00a-4004-9c71-64019ff01997", // LEVEL 4 - $150,000
  // Mapeamento adicional se necessário
  "FX - 100K": "ad7a0f90-210b-4f78-82aa-eebe58401d28", // LEVEL 5 - $250,000
  "FX - 150K": "392705c5-8306-4e64-bd7a-4028b6ff40f1", // LEVEL 6 - $300,000
};

// Interfaces para os métodos do serviço
export interface CreateSubscriptionResult {
  customerId: string;
  subscriptionId: string;
  licenseId: string;
  accounts: {
    account: string;
    profileId: string;
  }[];
}

/**
 * Serviço de integração com a Nelogica
 */
export class NelogicaService {
  private apiClient: NelogicaApiClient;
  private environmentId: string;

  constructor(
    apiUrl: string,
    username: string,
    password: string,
    environmentId: string
  ) {
    this.apiClient = new NelogicaApiClient(apiUrl, username, password);
    this.environmentId = environmentId;
  }

  /**
   * Registra um novo cliente e cria uma assinatura na Nelogica
   */
  public async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<CreateSubscriptionResult> {
    try {
      console.log(
        "[NelogicaService] Criando assinatura para cliente:",
        params.email
      );

      // Chama a API da Nelogica para criar a assinatura
      const response = await this.apiClient.createSubscription(params);

      if (!response.isSuccess) {
        throw new Error(`Falha ao criar assinatura: ${response.message}`);
      }

      console.log(
        "[NelogicaService] Assinatura criada com sucesso:",
        response.data.subscriptionId
      );

      return {
        customerId: response.data.customerId,
        subscriptionId: response.data.subscriptionId,
        licenseId: response.data.licenseId,
        accounts: response.data.accounts,
      };
    } catch (error) {
      console.error("[NelogicaService] Erro ao criar assinatura:", error);
      throw error;
    }
  }

  /**
   * Cria uma nova conta na Nelogica
   */
  public async createAccount(
    licenseId: string,
    accounts: CreateAccountParams[]
  ): Promise<{ account: string; profileId: string }[]> {
    try {
      console.log(
        `[NelogicaService] Criando ${accounts.length} conta(s) para licença:`,
        licenseId
      );

      // Chama a API da Nelogica para criar a conta
      const response = await this.apiClient.createAccount(licenseId, accounts);

      if (!response.isSuccess) {
        throw new Error(`Falha ao criar conta: ${response.message}`);
      }

      console.log(
        "[NelogicaService] Contas criadas com sucesso:",
        response.data
      );

      return response.data;
    } catch (error) {
      console.error("[NelogicaService] Erro ao criar conta:", error);
      throw error;
    }
  }

  /**
   * Cancela uma assinatura na Nelogica
   */
  public async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      console.log("[NelogicaService] Cancelando assinatura:", subscriptionId);

      // Chama a API da Nelogica para cancelar a assinatura
      const response = await this.apiClient.cancelSubscription(subscriptionId);

      if (!response.isSuccess) {
        throw new Error(`Falha ao cancelar assinatura: ${response.message}`);
      }

      console.log("[NelogicaService] Assinatura cancelada com sucesso");
    } catch (error) {
      console.error("[NelogicaService] Erro ao cancelar assinatura:", error);
      throw error;
    }
  }

  /**
   * Remove uma conta na Nelogica
   */
  public async removeAccount(
    licenseId: string,
    account: string
  ): Promise<void> {
    try {
      console.log("[NelogicaService] Removendo conta:", account);

      // Chama a API da Nelogica para remover a conta
      const response = await this.apiClient.removeAccount(licenseId, account);

      if (!response.isSuccess) {
        throw new Error(`Falha ao remover conta: ${response.message}`);
      }

      console.log("[NelogicaService] Conta removida com sucesso");
    } catch (error) {
      console.error("[NelogicaService] Erro ao remover conta:", error);
      throw error;
    }
  }

  /**
   * Bloqueia uma conta na Nelogica
   */
  public async blockAccount(licenseId: string, account: string): Promise<void> {
    try {
      console.log("[NelogicaService] Bloqueando conta:", account);

      // Chama a API da Nelogica para bloquear a conta
      const response = await this.apiClient.blockAccount(licenseId, account);

      if (!response.isSuccess) {
        throw new Error(`Falha ao bloquear conta: ${response.message}`);
      }

      console.log("[NelogicaService] Conta bloqueada com sucesso");
    } catch (error) {
      console.error("[NelogicaService] Erro ao bloquear conta:", error);
      throw error;
    }
  }

  /**
   * Desbloqueia uma conta na Nelogica
   */
  public async unblockAccount(
    licenseId: string,
    account: string
  ): Promise<void> {
    try {
      console.log("[NelogicaService] Desbloqueando conta:", account);

      // Chama a API da Nelogica para desbloquear a conta
      const response = await this.apiClient.unblockAccount(licenseId, account);

      if (!response.isSuccess) {
        throw new Error(`Falha ao desbloquear conta: ${response.message}`);
      }

      console.log("[NelogicaService] Conta desbloqueada com sucesso");
    } catch (error) {
      console.error("[NelogicaService] Erro ao desbloquear conta:", error);
      throw error;
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
  ): Promise<void> {
    try {
      console.log(
        "[NelogicaService] Configurando perfil de risco para conta:",
        account
      );

      // Chama a API da Nelogica para definir o perfil de risco
      const response = await this.apiClient.setAccountRisk(
        licenseId,
        account,
        profileId,
        accountType
      );

      if (!response.isSuccess) {
        throw new Error(
          `Falha ao definir perfil de risco: ${response.message}`
        );
      }

      console.log("[NelogicaService] Perfil de risco configurado com sucesso");
    } catch (error) {
      console.error(
        "[NelogicaService] Erro ao definir perfil de risco:",
        error
      );
      throw error;
    }
  }

  /**
   * Lista ambientes disponíveis
   */
  public async listEnvironments() {
    try {
      console.log("[NelogicaService] Listando ambientes disponíveis");

      const response = await this.apiClient.listEnvironments();

      if (!response.isSuccess) {
        throw new Error(`Falha ao listar ambientes: ${response.message}`);
      }

      console.log("[NelogicaService] Ambientes listados com sucesso");
      return response.data.environments;
    } catch (error) {
      console.error("[NelogicaService] Erro ao listar ambientes:", error);
      throw error;
    }
  }

  /**
   * Lista perfis de risco
   */
  public async listRiskProfiles() {
    try {
      console.log("[NelogicaService] Listando perfis de risco");

      const response = await this.apiClient.listRiskProfiles(
        this.environmentId
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao listar perfis de risco: ${response.message}`);
      }

      console.log("[NelogicaService] Perfis de risco listados com sucesso");
      return response.data.riskProfiles;
    } catch (error) {
      console.error("[NelogicaService] Erro ao listar perfis de risco:", error);
      throw error;
    }
  }

  /**
   * Cria um perfil de risco
   */
  public async createRiskProfile(params: RiskProfileParams) {
    try {
      console.log("[NelogicaService] Criando perfil de risco");

      const response = await this.apiClient.createRiskProfile(
        this.environmentId,
        params
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao criar perfil de risco: ${response.message}`);
      }

      console.log(
        "[NelogicaService] Perfil de risco criado com sucesso:",
        response.data.profileId
      );
      return response.data.profileId;
    } catch (error) {
      console.error("[NelogicaService] Erro ao criar perfil de risco:", error);
      throw error;
    }
  }

  /**
   * Lista assinaturas
   */
  public async listSubscriptions(params?: {
    account?: string;
    customerId?: string;
    pageNumber?: number;
    pageSize?: number;
  }) {
    try {
      console.log("[NelogicaService] Listando assinaturas");

      const response = await this.apiClient.listSubscriptions(params);

      if (!response.isSuccess) {
        throw new Error(`Falha ao listar assinaturas: ${response.message}`);
      }

      console.log("[NelogicaService] Assinaturas listadas com sucesso");
      return response.data.subscriptions;
    } catch (error) {
      console.error("[NelogicaService] Erro ao listar assinaturas:", error);
      throw error;
    }
  }

  /**
   * Atualiza um cliente
   */
  public async updateCustomer(
    customerId: string,
    firstName: string,
    lastName: string
  ) {
    try {
      console.log("[NelogicaService] Atualizando cliente:", customerId);

      const response = await this.apiClient.updateCustomer(
        customerId,
        firstName,
        lastName
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao atualizar cliente: ${response.message}`);
      }

      console.log("[NelogicaService] Cliente atualizado com sucesso");
      return response.data;
    } catch (error) {
      console.error("[NelogicaService] Erro ao atualizar cliente:", error);
      throw error;
    }
  }

  /**
   * Cria uma assinatura e conta para um cliente registrado no sistema
   */
  public async registerClientEvaluation(client: any) {
    try {
      console.log(
        "[NelogicaService] Iniciando registro de avaliação para cliente:",
        client.name
      );

      // 1. Preparar dados para o registro na Nelogica
      const [firstName, ...lastNameParts] = client.name.split(" ");
      const lastName = lastNameParts.join(" ") || firstName; // Caso tenha apenas um nome

      const subscriptionParams: CreateSubscriptionParams = {
        firstName,
        lastName,
        email: client.email,
        PhoneNumber: client.phone,
        document: {
          documentType: 1, // 1 = CPF
          document: client.cpf.replace(/\D/g, ""),
        },
        birth: client.birthDate
          ? new Date(client.birthDate).toISOString().split("T")[0]
          : undefined,
        address: {
          street: client.address,
          zipCode: client.zipCode,
          country: "BRA", // Assumindo Brasil como país padrão
          city: "São Paulo", // Valores padrão se não estiverem disponíveis
          state: "SP",
          neighborhood: "Centro",
        },
        // Não criamos a conta aqui para ter mais controle
      };

      // 2. Criar assinatura na Nelogica
      const subscriptionResult =
        await this.createSubscription(subscriptionParams);

      // 3. Criar conta para a licença gerada
      const accountName = `${client.name.substring(0, 20)} - ${client.plan}`; // Limitando o tamanho do nome
      const profileId =
        NELOGICA_PROFILES[client.plan as keyof typeof NELOGICA_PROFILES];

      if (!profileId) {
        throw new Error(
          `Perfil de risco não encontrado para o plano: ${client.plan}`
        );
      }

      const accountParams: CreateAccountParams[] = [
        {
          name: accountName,
          profileId,
        },
      ];

      const accountResult = await this.createAccount(
        subscriptionResult.licenseId,
        accountParams
      );

      // 4. Atualizar registro do cliente no banco de dados
      await prisma.client.update({
        where: { id: client.id },
        data: {
          nelogicaCustomerId: subscriptionResult.customerId,
          nelogicaSubscriptionId: subscriptionResult.subscriptionId,
          nelogicaLicenseId: subscriptionResult.licenseId,
          nelogicaAccount: accountResult[0].account,
          // Não mudar o status ainda, isso será feito em outro ponto do fluxo
        },
      });

      console.log(
        "[NelogicaService] Cliente registrado com sucesso na Nelogica:",
        {
          customerId: subscriptionResult.customerId,
          subscriptionId: subscriptionResult.subscriptionId,
          licenseId: subscriptionResult.licenseId,
          account: accountResult[0].account,
        }
      );

      return {
        customerId: subscriptionResult.customerId,
        subscriptionId: subscriptionResult.subscriptionId,
        licenseId: subscriptionResult.licenseId,
        account: accountResult[0].account,
      };
    } catch (error) {
      console.error(
        "[NelogicaService] Erro ao registrar cliente na Nelogica:",
        error
      );
      throw error;
    }
  }

  /**
   * Inicia a avaliação de um cliente, definindo os perfis de risco
   */
  public async startEvaluation(client: any) {
    try {
      console.log(
        "[NelogicaService] Iniciando avaliação para cliente:",
        client.id
      );

      // Verificar se o cliente tem os dados da Nelogica
      if (!client.nelogicaLicenseId || !client.nelogicaAccount) {
        throw new Error("Cliente não possui configuração na Nelogica");
      }

      // Definir o perfil de risco para a conta
      const profileId =
        NELOGICA_PROFILES[client.plan as keyof typeof NELOGICA_PROFILES];

      if (!profileId) {
        throw new Error(
          `Perfil de risco não encontrado para o plano: ${client.plan}`
        );
      }

      // Define o tipo de conta como Desafio (0)
      await this.setAccountRisk(
        client.nelogicaLicenseId,
        client.nelogicaAccount,
        profileId,
        0
      );

      // Atualizar status do cliente no banco de dados
      await prisma.client.update({
        where: { id: client.id },
        data: {
          traderStatus: TraderStatus.IN_PROGRESS,
          startDate: new Date(),
          // Calculando a data de fim (60 dias após o início)
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      });

      console.log(
        "[NelogicaService] Avaliação iniciada com sucesso para o cliente:",
        client.id
      );

      return {
        success: true,
        message: "Avaliação iniciada com sucesso",
      };
    } catch (error) {
      console.error("[NelogicaService] Erro ao iniciar avaliação:", error);
      throw error;
    }
  }

  /**
   * Finaliza a avaliação de um cliente
   */
  public async finishEvaluation(client: any, status: "Aprovado" | "Reprovado") {
    try {
      console.log(
        `[NelogicaService] Finalizando avaliação para cliente ${client.id} com status: ${status}`
      );

      // Verificar se o cliente tem os dados da Nelogica
      if (
        !client.nelogicaLicenseId ||
        !client.nelogicaSubscriptionId ||
        !client.nelogicaAccount
      ) {
        throw new Error("Cliente não possui configuração na Nelogica");
      }

      // 1. Remover a conta de avaliação
      await this.removeAccount(
        client.nelogicaLicenseId,
        client.nelogicaAccount
      );

      // 2. Se aprovado, poderia criar uma nova conta (conta real ou de simulação remunerada)
      // Isso seria implementado em outro método

      // 3. Atualizar status do cliente no banco de dados
      await prisma.client.update({
        where: { id: client.id },
        data: {
          traderStatus:
            status === "Aprovado"
              ? TraderStatus.APPROVED
              : TraderStatus.REJECTED,
          endDate: new Date(),
          cancellationDate: new Date(),
        },
      });

      console.log(
        `[NelogicaService] Avaliação finalizada com sucesso para o cliente ${client.id}: ${status}`
      );

      return {
        success: true,
        message: `Avaliação finalizada como ${status.toLowerCase()}`,
      };
    } catch (error) {
      console.error("[NelogicaService] Erro ao finalizar avaliação:", error);
      throw error;
    }
  }
}
