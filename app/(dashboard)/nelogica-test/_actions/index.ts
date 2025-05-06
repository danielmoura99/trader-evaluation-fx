// app/(dashboard)/nelogica-test/_actions/index.ts
"use server";

import {
  NelogicaApiClient,
  CreateSubscriptionParams,
} from "@/lib/services/nelogica-api-client";
import { NELOGICA_PROFILES } from "@/lib/services/nelogica-service";
import axios from "axios";

// Configurações da API Nelogica
const NELOGICA_API_URL =
  process.env.NELOGICA_API_URL || "https://api-broker4-v2.nelogica.com.br";
const NELOGICA_USERNAME =
  process.env.NELOGICA_USERNAME || "tradersHouse.hml@nelogica";
const NELOGICA_PASSWORD =
  process.env.NELOGICA_PASSWORD || "OJOMy4miz63YLFwOM27ZGTO5n";
//const NELOGICA_ENVIRONMENT_ID = process.env.NELOGICA_ENVIRONMENT_ID || 'environment_id';

/**
 * Testa a autenticação na API da Nelogica
 */
export async function testNelogicaAuth() {
  try {
    console.log("Iniciando teste de autenticação na Nelogica...");
    console.log(`Conectando a ${NELOGICA_API_URL}`);

    const apiClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    await apiClient.login();

    console.log("Autenticação na Nelogica concluída com sucesso");

    return {
      success: true,
      expiresAt: "Token obtido com sucesso", // Na implementação real, retornaria a data de expiração
    };
  } catch (error) {
    console.error("Erro ao testar autenticação Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

interface CreateSubscriptionRequest {
  planId: string;
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  plan: string;
}

/**
 * Testa a criação de assinatura na Nelogica
 */
export async function testNelogicaCreateSubscription(
  request: CreateSubscriptionRequest
) {
  try {
    console.log("Iniciando criação de assinatura na Nelogica...");

    const apiClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    const params: CreateSubscriptionParams = {
      planId: "c0dc847f-8fe6-4a31-ab14-62c2977ed4a0",
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      document: {
        documentType: 1, // 1 = CPF
        document: request.cpf.replace(/\D/g, ""),
      },
      PhoneNumber: request.phone,
      countryNationality: "BRA",
      address: {
        street: "Endereço de Teste",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        country: "BRA",
        zipCode: "01000-000",
      },
      // Não inclua conta aqui, vamos criar separadamente para melhor controle
    };

    const response = await apiClient.createSubscription(params);

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Assinatura criada com sucesso:", response.data);

    return {
      success: true,
      customerId: response.data.customerId,
      subscriptionId: response.data.subscriptionId,
      licenseId: response.data.licenseId,
    };
  } catch (error) {
    console.error("Erro ao criar assinatura Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

interface CreateAccountRequest {
  licenseId: string;
  name: string;
  plan: string;
  accountType?: number;
  profileId?: string;
}

/**
 * Testa a criação de conta na Nelogica
 */
export async function testNelogicaCreateAccount(request: CreateAccountRequest) {
  try {
    console.log("Iniciando criação de conta na Nelogica...");

    const apiClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    // Obtém o ID do perfil a partir do plano
    const profileId =
      NELOGICA_PROFILES[request.plan as keyof typeof NELOGICA_PROFILES];

    if (!profileId) {
      return {
        success: false,
        error: `Perfil não encontrado para o plano: ${request.plan}`,
      };
    }

    const accounts = [
      {
        name: request.name.substring(0, 50), // Ajustando para o limite de 50 caracteres da documentação
        profileId: profileId,
        accountType:
          request.accountType !== undefined ? request.accountType : 0, // 0: Desafio (padrão)
      },
    ];

    const response = await apiClient.createAccount(request.licenseId, accounts);

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Conta criada com sucesso:", response.data);

    return {
      success: true,
      account: response.data[0].account,
      profileId: response.data[0].profileId,
    };
  } catch (error) {
    console.error("Erro ao criar conta Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

interface SetRiskRequest {
  licenseId: string;
  account: string;
  plan: string;
}

/**
 * Testa a configuração de perfil de risco na Nelogica
 */
export async function testNelogicaSetRisk(request: SetRiskRequest) {
  try {
    console.log("Iniciando configuração de perfil de risco na Nelogica...");

    const apiClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    // Obtém o ID do perfil a partir do plano
    const profileId =
      NELOGICA_PROFILES[request.plan as keyof typeof NELOGICA_PROFILES];

    if (!profileId) {
      return {
        success: false,
        error: `Perfil não encontrado para o plano: ${request.plan}`,
      };
    }

    // Define o tipo de conta como Desafio (0)
    const response = await apiClient.setAccountRisk(
      request.licenseId,
      request.account,
      profileId,
      0
    );

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Perfil de risco configurado com sucesso");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao configurar perfil de risco Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

interface AccountActionRequest {
  licenseId: string;
  account: string;
}

/**
 * Testa o bloqueio de conta na Nelogica
 */
export async function testNelogicaBlockAccount(request: AccountActionRequest) {
  try {
    console.log("Iniciando bloqueio de conta na Nelogica...");

    const apiClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    const response = await apiClient.blockAccount(
      request.licenseId,
      request.account
    );

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Conta bloqueada com sucesso");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao bloquear conta Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa o desbloqueio de conta na Nelogica
 */
export async function testNelogicaUnblockAccount(
  request: AccountActionRequest
) {
  try {
    console.log("Iniciando desbloqueio de conta na Nelogica...");

    const apiClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    const response = await apiClient.unblockAccount(
      request.licenseId,
      request.account
    );

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Conta desbloqueada com sucesso");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao desbloquear conta Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa a listagem de ambientes na Nelogica
 */
export async function testNelogicaListEnvironments() {
  try {
    console.log("Iniciando listagem de ambientes na Nelogica...");

    const apiClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    const response = await apiClient.listEnvironments();

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Ambientes listados com sucesso:", response.data.environments);

    return {
      success: true,
      environments: response.data.environments,
    };
  } catch (error) {
    console.error("Erro ao listar ambientes Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa a listagem de assinaturas e contas na Nelogica
 */
export async function testNelogicaListSubscriptions() {
  try {
    console.log("Iniciando listagem de assinaturas e contas na Nelogica...");

    const apiClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    // Constante com o planId específico que queremos filtrar
    const TARGET_PLAN_ID = "c0dc847f-8fe6-4a31-ab14-62c2977ed4a0";

    // Obtém todas as assinaturas
    const response = await apiClient.listSubscriptions({
      pageNumber: 1,
      pageSize: 100, // Aumentamos o tamanho da página para garantir que pegamos todas as assinaturas
    });

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    // Filtra as assinaturas que têm o planId específico
    const filteredSubscriptions = response.data.subscriptions.filter(
      (subscription) => subscription.planId === TARGET_PLAN_ID
    );

    console.log(
      "Assinaturas filtradas por planId:",
      filteredSubscriptions.length,
      "de",
      response.data.subscriptions.length,
      "total"
    );

    return {
      success: true,
      subscriptions: filteredSubscriptions,
    };
  } catch (error) {
    console.error("Erro ao listar assinaturas Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// Adicione essa nova função
/**
 * Testa apenas a conectividade básica com o servidor da Nelogica
 */
export async function testNelogicaConnectivity() {
  try {
    console.log("Iniciando teste de conectividade com a Nelogica...");
    console.log(`Tentando conectar a ${NELOGICA_API_URL}`);

    const startTime = Date.now();

    // Aqui utilizamos axios diretamente para evitar dependências de autenticação
    try {
      // Tentamos uma conexão simples a um endpoint que responda rapidamente
      // Muitos servidores têm um endpoint /health ou /ping para isso
      await axios.get(`${NELOGICA_API_URL}/ping`, {
        timeout: 5000, // timeout menor para teste rápido
        validateStatus: () => true, // aceita qualquer status HTTP como sucesso
      });

      const elapsedTime = Date.now() - startTime;
      console.log(`Conectividade testada com sucesso em ${elapsedTime}ms`);

      return {
        success: true,
        elapsedTime,
      };
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      console.error(`Erro ao testar conectividade (${elapsedTime}ms):`, error);

      // Log detalhado para entender melhor o problema
      let errorDetails = "";
      if (axios.isAxiosError(error)) {
        errorDetails = `Code: ${error.code || "N/A"}, Message: ${error.message}`;
        console.error("Detalhes:", {
          code: error.code,
          message: error.message,
          config: error.config,
        });
      }

      return {
        success: false,
        error: `Falha na conectividade: ${errorDetails}`,
        elapsedTime,
      };
    }
  } catch (error) {
    console.error("Erro inesperado ao testar conectividade Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Cria um perfil de risco na Nelogica
 */
export async function testNelogicaCreateRiskProfile(params: {
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
}) {
  try {
    console.log("Iniciando criação de perfil de risco na Nelogica...");

    const apiClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    // Por padrão, usamos o environmentId padrão da Nelogica
    // Idealmente, isso viria de uma variável de ambiente ou configuração
    const environmentId = process.env.NELOGICA_ENVIRONMENT_ID || "1";

    const response = await apiClient.createRiskProfile(environmentId, params);

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("Perfil de risco criado com sucesso:", response.data.profileId);

    return {
      success: true,
      profileId: response.data.profileId,
    };
  } catch (error) {
    console.error("Erro ao criar perfil de risco Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
