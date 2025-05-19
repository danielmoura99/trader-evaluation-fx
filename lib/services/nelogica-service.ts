/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/nelogica-service.ts
import {
  NelogicaApiClient,
  CreateSubscriptionParams,
  CreateAccountParams,
  //RiskProfileParams,
} from "./nelogica-api-client";
import { prisma } from "@/lib/prisma";
import { TraderStatus } from "@/app/types";
import { logger } from "@/lib/logger"; // Vamos criar este serviço de logger

/**
 * Mapeamento de perfis de risco da Nelogica
 */
export const NELOGICA_PROFILES = {
  "FX - 5K": "af0cd162-d774-475e-866f-315ff1932223",
  "FX - 10K": "b4495f41-6f09-4c3b-b34c-0bc8d85f2f8f",
  "FX - 25K": "581f1d7d-b5b5-4c0e-82cf-3f4fd9834bb3",
  "FX - 50K": "e762b216-e00a-4004-9c71-64019ff01997",
  "FX - 100K": "ad7a0f90-210b-4f78-82aa-eebe58401d28",
  "FX - 150K": "392705c5-8306-4e64-bd7a-4028b6ff40f1",
};

/**
 * Classe de serviço para integração com a API Nelogica
 */
export class NelogicaService {
  private apiClient: NelogicaApiClient;
  private environmentId: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // ms

  constructor() {
    const apiUrl = process.env.NELOGICA_API_URL || "";
    const username = process.env.NELOGICA_USERNAME || "";
    const password = process.env.NELOGICA_PASSWORD || "";
    const environmentId = process.env.NELOGICA_ENVIRONMENT_ID || "1";

    if (!apiUrl || !username || !password) {
      throw new Error(
        "Configurações da API Nelogica não definidas nas variáveis de ambiente"
      );
    }

    this.apiClient = new NelogicaApiClient(apiUrl, username, password);
    this.environmentId = environmentId;

    logger.info("Serviço Nelogica inicializado");
  }

  /**
   * Executa uma função com retry em caso de falha
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          `Tentativa ${attempt}/${this.retryAttempts} falhou: ${lastError.message}`
        );

        // Se não for a última tentativa, aguarde antes de tentar novamente
        if (attempt < this.retryAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempt)
          );
        }
      }
    }

    throw lastError || new Error("Falha após múltiplas tentativas");
  }

  /**
   * Cria uma assinatura na Nelogica para um cliente
   */
  public async createSubscription(client: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    phone?: string;
    birthDate?: Date;
    address?: string;
    zipCode?: string;
    plan: string;
  }): Promise<{
    customerId: string;
    subscriptionId: string;
    licenseId: string;
  }> {
    try {
      logger.info(`Criando assinatura Nelogica para cliente ${client.id}`);

      // Prepara os dados do cliente para a API
      const [firstName, ...lastNameParts] = client.name.split(" ");
      const lastName = lastNameParts.join(" ") || firstName;

      const subscriptionParams: CreateSubscriptionParams = {
        planId:
          process.env.NELOGICA_PLAN_ID ||
          "c0dc847f-8fe6-4a31-ab14-62c2977ed4a0", // Plano padrão da Nelogica
        firstName,
        lastName,
        email: client.email,
        document: {
          documentType: 1, // 1 = CPF
          document: client.cpf.replace(/\D/g, ""),
        },
        PhoneNumber: client.phone,
        birth: client.birthDate
          ? client.birthDate.toISOString().split("T")[0]
          : undefined,
        address:
          client.address && client.zipCode
            ? {
                street: client.address,
                zipCode: client.zipCode,
                country: "BRA",
                city: "São Paulo", // Valores padrão se não estiverem disponíveis
                state: "SP",
              }
            : undefined,
      };

      // Executa com retry
      const response = await this.withRetry(() =>
        this.apiClient.createSubscription(subscriptionParams)
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao criar assinatura: ${response.message}`);
      }

      const result = {
        customerId: response.data.customerId,
        subscriptionId: response.data.subscriptionId,
        licenseId: response.data.licenseId,
      };

      logger.info(`Assinatura criada com sucesso: ${JSON.stringify(result)}`);

      // Atualiza o registro do cliente com os IDs da Nelogica
      await prisma.client.update({
        where: { id: client.id },
        data: {
          nelogicaCustomerId: result.customerId,
          nelogicaSubscriptionId: result.subscriptionId,
          nelogicaLicenseId: result.licenseId,
        },
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao criar assinatura: ${errorMsg}`, {
        clientId: client.id,
      });
      throw error;
    }
  }

  /**
   * Cria uma conta para o cliente na Nelogica
   */
  public async createAccount(
    licenseId: string,
    clientName: string,
    plan: string,
    accountType: number = 0
  ): Promise<{
    account: string;
    profileId: string;
  }> {
    try {
      logger.info(`Criando conta Nelogica para licença ${licenseId}`);

      // Verifica se o nome está vazio e fornece um nome padrão se necessário
      const accountName =
        !clientName || clientName.trim() === ""
          ? `Trader ${plan} - ${new Date().toISOString().substring(0, 10)}`
          : clientName.substring(0, 49);

      // Obtém o ID do perfil a partir do plano
      const profileId =
        NELOGICA_PROFILES[plan as keyof typeof NELOGICA_PROFILES];

      if (!profileId) {
        throw new Error(`Perfil de risco não encontrado para o plano: ${plan}`);
      }

      const accounts: CreateAccountParams[] = [
        {
          name: accountName,
          profileId,
          accountType,
        },
      ];

      logger.debug(`Payload de criação de conta: ${JSON.stringify(accounts)}`);

      // Executa com retry
      const response = await this.withRetry(() =>
        this.apiClient.createAccount(licenseId, accounts)
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao criar conta: ${response.message}`);
      }

      const result = {
        account: response.data[0].account,
        profileId: response.data[0].profileId,
      };

      logger.info(`Conta criada com sucesso: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao criar conta: ${errorMsg}`, { licenseId });
      throw error;
    }
  }

  /**
   * Define o perfil de risco para uma conta
   */
  public async setAccountRisk(
    licenseId: string,
    account: string,
    plan: string,
    accountType: number = 0
  ): Promise<void> {
    try {
      logger.info(`Configurando perfil de risco para conta ${account}`);

      // Obtém o ID do perfil a partir do plano
      const profileId =
        NELOGICA_PROFILES[plan as keyof typeof NELOGICA_PROFILES];

      if (!profileId) {
        throw new Error(`Perfil de risco não encontrado para o plano: ${plan}`);
      }

      // Executa com retry
      const response = await this.withRetry(() =>
        this.apiClient.setAccountRisk(
          licenseId,
          account,
          profileId,
          accountType
        )
      );

      if (!response.isSuccess) {
        throw new Error(
          `Falha ao definir perfil de risco: ${response.message}`
        );
      }

      logger.info(
        `Perfil de risco configurado com sucesso para conta ${account}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao configurar perfil de risco: ${errorMsg}`, {
        licenseId,
        account,
      });
      throw error;
    }
  }

  /**
   * Bloqueia uma conta
   */
  public async blockAccount(licenseId: string, account: string): Promise<void> {
    try {
      logger.info(`Bloqueando conta ${account}`);

      // Executa com retry
      const response = await this.withRetry(() =>
        this.apiClient.blockAccount(licenseId, account)
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao bloquear conta: ${response.message}`);
      }

      logger.info(`Conta ${account} bloqueada com sucesso`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao bloquear conta: ${errorMsg}`, {
        licenseId,
        account,
      });
      throw error;
    }
  }

  /**
   * Desbloqueia uma conta
   */
  public async unblockAccount(
    licenseId: string,
    account: string
  ): Promise<void> {
    try {
      logger.info(`Desbloqueando conta ${account}`);

      // Executa com retry
      const response = await this.withRetry(() =>
        this.apiClient.unblockAccount(licenseId, account)
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao desbloquear conta: ${response.message}`);
      }

      logger.info(`Conta ${account} desbloqueada com sucesso`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao desbloquear conta: ${errorMsg}`, {
        licenseId,
        account,
      });
      throw error;
    }
  }

  /**
   * Remove uma conta
   */
  public async removeAccount(
    licenseId: string,
    account: string
  ): Promise<void> {
    try {
      logger.info(`Removendo conta ${account}`);

      // Executa com retry
      const response = await this.withRetry(() =>
        this.apiClient.removeAccount(licenseId, account)
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao remover conta: ${response.message}`);
      }

      logger.info(`Conta ${account} removida com sucesso`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao remover conta: ${errorMsg}`, {
        licenseId,
        account,
      });
      throw error;
    }
  }

  /**
   * Fluxo completo para liberar a plataforma para um cliente
   * Cria assinatura, conta e configura perfil de risco
   */
  public async releaseTraderPlatform(client: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    phone?: string;
    birthDate?: Date;
    address?: string;
    zipCode?: string;
    plan: string;
  }): Promise<{
    customerId: string;
    subscriptionId: string;
    licenseId: string;
    account: string;
    profileId: string;
  }> {
    try {
      logger.info(
        `Iniciando fluxo de liberação de plataforma para cliente ${client.id}`
      );

      // 1. Criar assinatura
      const subscription = await this.createSubscription(client);

      // 2. Criar conta
      const accountResult = await this.createAccount(
        subscription.licenseId,
        client.name,
        client.plan,
        0 // 0 = Conta de Desafio
      );

      // 3. Atualizar o registro do cliente com os dados da conta
      await prisma.client.update({
        where: { id: client.id },
        data: {
          nelogicaAccount: accountResult.account,
          startDate: new Date(),
          // Define a data de fim como 60 dias após a data atual
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          traderStatus: TraderStatus.IN_PROGRESS,
        },
      });

      const result = {
        ...subscription,
        ...accountResult,
      };

      logger.info(`Plataforma liberada com sucesso para cliente ${client.id}`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao liberar plataforma: ${errorMsg}`, {
        clientId: client.id,
      });
      throw error;
    }
  }

  /**
   * Cria um perfil de risco na Nelogica
   */
  public async createRiskProfile(params: {
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
  }): Promise<string> {
    try {
      logger.info("Criando perfil de risco na Nelogica");

      // Executa com retry
      const response = await this.withRetry(() =>
        this.apiClient.createRiskProfile(this.environmentId, params)
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao criar perfil de risco: ${response.message}`);
      }

      const profileId = response.data.profileId;
      logger.info(
        `Perfil de risco criado com sucesso na Nelogica: ${profileId}`
      );

      return profileId;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao criar perfil de risco na Nelogica: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Atualiza um perfil de risco na Nelogica
   */
  public async updateRiskProfile(
    profileId: string,
    params: {
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
    }
  ): Promise<void> {
    try {
      logger.info(`Atualizando perfil de risco na Nelogica: ${profileId}`);

      // Executa com retry
      const response = await this.withRetry(() =>
        this.apiClient.updateRiskProfile(this.environmentId, {
          ...params,
          profileId,
        })
      );

      if (!response.isSuccess) {
        throw new Error(
          `Falha ao atualizar perfil de risco: ${response.message}`
        );
      }

      logger.info(
        `Perfil de risco atualizado com sucesso na Nelogica: ${profileId}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(
        `Erro ao atualizar perfil de risco na Nelogica: ${errorMsg}`
      );
      throw error;
    }
  }

  /**
   * Lista assinaturas da Nelogica
   */
  public async listSubscriptions(): Promise<any[]> {
    try {
      logger.info("Listando assinaturas na Nelogica");

      // Constante com o planId específico que queremos filtrar
      const TARGET_PLAN_ID = "c0dc847f-8fe6-4a31-ab14-62c2977ed4a0";

      // Executa com retry
      const response = await this.withRetry(() =>
        this.apiClient.listSubscriptions({
          pageNumber: 1,
          pageSize: 100, // Recebe até 100 assinaturas por página
        })
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao listar assinaturas: ${response.message}`);
      }

      // Filtra as assinaturas que têm o planId específico
      const filteredSubscriptions = response.data.subscriptions.filter(
        (subscription) => subscription.planId === TARGET_PLAN_ID
      );

      logger.info(
        `${filteredSubscriptions.length} assinaturas encontradas com o planId ${TARGET_PLAN_ID} (de um total de ${response.data.subscriptions.length})`
      );

      return filteredSubscriptions;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao listar assinaturas: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Cancela uma assinatura na Nelogica
   */
  public async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      logger.info(`Cancelando assinatura ${subscriptionId}`);

      // Executa com retry
      const response = await this.withRetry(() =>
        this.apiClient.cancelSubscription(subscriptionId)
      );

      if (!response.isSuccess) {
        throw new Error(`Falha ao cancelar assinatura: ${response.message}`);
      }

      logger.info(`Assinatura ${subscriptionId} cancelada com sucesso`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao cancelar assinatura: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Obtém detalhes completos de uma assinatura
   */
  public async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    try {
      logger.info(`Obtendo detalhes da assinatura ${subscriptionId}`);

      // Constante com o planId específico que queremos filtrar
      const TARGET_PLAN_ID = "c0dc847f-8fe6-4a31-ab14-62c2977ed4a0";

      // Buscamos todos os subscriptions e filtramos manualmente pelo ID
      const response = await this.withRetry(() =>
        this.apiClient.listSubscriptions({
          pageNumber: 1,
          pageSize: 100,
        })
      );

      if (!response.isSuccess) {
        throw new Error(
          `Falha ao obter detalhes da assinatura: ${response.message}`
        );
      }

      // Filtramos manualmente pela subscriptionId e planId
      const subscription = response.data.subscriptions.find(
        (sub: any) =>
          sub.subscriptionId === subscriptionId && sub.planId === TARGET_PLAN_ID
      );

      if (!subscription) {
        throw new Error(
          `Assinatura ${subscriptionId} não encontrada ou não pertence ao plano correto`
        );
      }

      logger.info(
        `Detalhes da assinatura ${subscriptionId} obtidos com sucesso`
      );

      // Buscar se o cliente tem data de cancelamento em nosso banco
      const client = await prisma.client.findFirst({
        where: { nelogicaSubscriptionId: subscriptionId },
      });

      // Simular histórico, pois a API não fornece essa informação
      const history = [
        {
          action: "Criação",
          timestamp: subscription.createdAt,
          details: "Assinatura criada",
        },
      ];

      // Se o cliente tiver data de cancelamento, adicionamos ao histórico
      if (client?.cancellationDate) {
        history.push({
          action: "Cancelamento",
          timestamp: client.cancellationDate.toISOString(),
          details: "Assinatura cancelada",
        });
      }

      return {
        ...subscription,
        history,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao obter detalhes da assinatura: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Verifica se uma conta está bloqueada
   */
  public async isAccountBlocked(
    licenseId: string,
    account: string
  ): Promise<boolean> {
    try {
      logger.info(`Verificando status de bloqueio da conta ${account}`);

      // Tenta obter informações sobre a conta através de listSubscriptions
      // e filtra para encontrar a conta específica
      const subscriptions = await this.listSubscriptions();

      // Encontra a assinatura correspondente
      const subscription = subscriptions.find(
        (sub) => sub.licenseId === licenseId
      );

      if (!subscription) {
        throw new Error(`Licença ${licenseId} não encontrada`);
      }

      // Verificar se a conta existe e obter informações de status
      // Isso depende de como a API da Nelogica retorna essa informação
      // Esta é uma implementação de exemplo - adapte conforme as capacidades reais da API

      // Exemplo: podemos tentar uma ação específica que falha se a conta estiver bloqueada
      try {
        // Aqui você faria uma chamada real para verificar o status
        // Por exemplo, verificando se a conta aparece em uma lista de contas bloqueadas
        // ou tentando executar uma operação que só funciona em contas desbloqueadas

        // Na falta de uma API específica, verificamos o que foi armazenado no cliente local
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const client = await prisma.client.findFirst({
          where: { nelogicaAccount: account },
          select: {
            id: true,
            // Se você tiver um campo para status de bloqueio, selecione-o aqui
            // isAccountBlocked: true
          },
        });

        // Aqui estamos usando um valor mockado
        // Substitua por uma lógica real com base na sua API
        return false; // MOCK: Para teste, retornar sempre desbloqueado

        // Implementação real quando disponível:
        // return !!client?.isAccountBlocked;
      } catch (error) {
        // Se a operação falhar, consideramos a conta como bloqueada
        logger.warn(
          `Erro ao verificar status da conta ${account}, assumindo bloqueada: ${error}`
        );
        return true;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao verificar se conta está bloqueada: ${errorMsg}`);

      // Em caso de erro, é mais seguro assumir que a conta não está bloqueada
      // para evitar ações equivocadas
      return false;
    }
  }
  /**
   * Obtém detalhes completos de uma conta específica
   */
  public async getAccountDetails(
    licenseId: string,
    account: string
  ): Promise<any> {
    try {
      logger.info(`Obtendo detalhes da conta ${account}`);

      // Busca as assinaturas para encontrar a conta específica
      const subscriptions = await this.listSubscriptions();

      // Filtra para encontrar a assinatura correta
      const subscription = subscriptions.find(
        (sub) => sub.licenseId === licenseId
      );

      if (!subscription) {
        throw new Error(`Licença ${licenseId} não encontrada`);
      }

      // Busca a conta específica
      const accountData = subscription.accounts?.find(
        (acc: any) => acc.account === account
      );

      if (!accountData) {
        throw new Error(`Conta ${account} não encontrada`);
      }

      // Verificar status de bloqueio da conta
      const isBlocked = await this.isAccountBlocked(licenseId, account);

      // Montar objeto de resposta enriquecido com dados adicionais
      const accountDetails = {
        ...accountData,
        licenseId: subscription.licenseId,
        subscriptionId: subscription.subscriptionId,
        customerId: subscription.customerId,
        isBlocked: isBlocked,
        validatedAt: accountData.validadedAt,
        // Adicione outros dados relevantes conforme necessário
      };

      logger.info(`Detalhes da conta ${account} obtidos com sucesso`);
      return accountDetails;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Erro ao obter detalhes da conta: ${errorMsg}`);
      throw new Error(`Falha ao obter detalhes da conta: ${errorMsg}`);
    }
  }
}
