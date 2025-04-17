// app/(dashboard)/nelogica-test/_actions/index.ts
"use server";

import {
  NelogicaApiClient,
  CreateSubscriptionParams,
} from "@/lib/services/nelogica-api-client";
import { NELOGICA_PROFILES } from "@/lib/services/nelogica-service";

// Configurações da API Nelogica
const NELOGICA_API_URL =
  process.env.NELOGICA_API_URL || "http://191.252.154.12:36302";
const NELOGICA_USERNAME = process.env.NELOGICA_USERNAME || "seu_usuario_api"; // Use suas credenciais reais aqui
const NELOGICA_PASSWORD = process.env.NELOGICA_PASSWORD || "sua_senha_api"; // Use suas credenciais reais aqui
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
        name: request.name.substring(0, 20), // Limitando o nome a 20 caracteres
        profileId: profileId,
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
 * Testa a listagem de assinaturas na Nelogica
 */
export async function testNelogicaListSubscriptions() {
  try {
    console.log("Iniciando listagem de assinaturas na Nelogica...");

    const apiClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    const response = await apiClient.listSubscriptions();

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log(
      "Assinaturas listadas com sucesso:",
      response.data.subscriptions
    );

    return {
      success: true,
      subscriptions: response.data.subscriptions,
    };
  } catch (error) {
    console.error("Erro ao listar assinaturas Nelogica:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
