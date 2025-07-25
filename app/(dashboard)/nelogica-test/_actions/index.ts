/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/nelogica-test/_actions/index.ts
"use server";

import {
  NelogicaApiClient,
  CreateSubscriptionParams,
} from "@/lib/services/nelogica-api-client";
import { NelogicaSingleton } from "@/lib/services/nelogica-singleton";
//import { NELOGICA_PROFILES } from "@/lib/services/nelogica-service";
import axios from "axios";

// Configurações da API Nelogica
const NELOGICA_API_URL =
  process.env.NELOGICA_API_URL || "https://api-broker4-v2.nelogica.com.br";
const NELOGICA_USERNAME =
  process.env.NELOGICA_USERNAME || "tradersHouse.hml@nelogica";
const NELOGICA_PASSWORD =
  process.env.NELOGICA_PASSWORD || "OJOMy4miz63YLFwOM27ZGTO5n";

/**
 * 🧪 TESTE ESPECÍFICO DO SINGLETON
 * Testa se o singleton está funcionando corretamente
 */
export async function testSingletonEconomy() {
  try {
    console.log(
      "🧪 [Singleton Test] Iniciando teste de economia do singleton..."
    );
    const startTime = Date.now();

    // Status inicial
    const initialStatus = NelogicaSingleton.getStatus();
    console.log("📊 [Singleton Test] Status inicial:", initialStatus);

    // Simula 3 operações simultâneas que normalmente fariam login separado
    const operations = Array(3)
      .fill(0)
      .map(async (_, index) => {
        console.log(`🔄 [Singleton Test] Iniciando operação ${index + 1}...`);
        const operationStart = Date.now();

        const client = await NelogicaSingleton.getInstance();

        const operationTime = Date.now() - operationStart;
        console.log(
          `✅ [Singleton Test] Operação ${index + 1} completada em ${operationTime}ms`
        );

        return {
          operation: index + 1,
          time: operationTime,
          wasReused: operationTime < 1000, // Se foi muito rápido, provavelmente reutilizou
        };
      });

    const results = await Promise.all(operations);
    const totalTime = Date.now() - startTime;

    // Status final
    const finalStatus = NelogicaSingleton.getStatus();
    console.log("📊 [Singleton Test] Status final:", finalStatus);

    // Análise dos resultados
    const reuseCount = results.filter((r) => r.wasReused).length;

    console.log(`✅ [Singleton Test] Teste concluído em ${totalTime}ms`);
    console.log(
      `🔄 [Singleton Test] ${reuseCount}/${results.length} operações reutilizaram a instância`
    );

    return {
      success: true,
      totalTime,
      results,
      reuseCount,
      message: `Singleton funcionando! ${reuseCount}/${results.length} reutilizações em ${totalTime}ms`,
      initialStatus,
      finalStatus,
    };
  } catch (error) {
    console.error("❌ [Singleton Test] Erro no teste:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa a autenticação na API da Nelogica usando Singleton
 */
export async function testNelogicaAuth() {
  try {
    console.log(
      "🔑 [Auth Test] Iniciando teste de autenticação usando Singleton..."
    );
    console.log(`🌐 [Auth Test] Conectando a ${NELOGICA_API_URL}`);

    // Status antes do teste
    const beforeStatus = NelogicaSingleton.getStatus();
    console.log("📊 [Auth Test] Status do singleton antes:", beforeStatus);

    // ✅ MUDANÇA: Usando singleton ao invés de instância direta
    const apiClient = await NelogicaSingleton.getInstance();

    // Status após obter instância
    const afterStatus = NelogicaSingleton.getStatus();
    console.log(
      "📊 [Auth Test] Status do singleton após getInstance:",
      afterStatus
    );

    console.log("✅ [Auth Test] Instância obtida com sucesso");
    console.log(
      `🔄 [Auth Test] Instância foi ${beforeStatus.hasInstance ? "reutilizada" : "criada"}`
    );

    return {
      success: true,
      expiresAt: "Token obtido com sucesso",
      wasReused: beforeStatus.hasInstance,
      singletonStatus: afterStatus,
    };
  } catch (error) {
    console.error("❌ [Auth Test] Erro ao testar autenticação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa apenas a conectividade básica com o servidor da Nelogica
 */
export async function testNelogicaConnectivity() {
  try {
    console.log("🌐 [Connectivity Test] Iniciando teste de conectividade...");
    console.log(
      `🔗 [Connectivity Test] Tentando conectar a ${NELOGICA_API_URL}`
    );

    const startTime = Date.now();

    try {
      await axios.get(`${NELOGICA_API_URL}/ping`, {
        timeout: 5000,
        validateStatus: () => true,
      });

      const elapsedTime = Date.now() - startTime;
      console.log(
        `✅ [Connectivity Test] Conectividade testada com sucesso em ${elapsedTime}ms`
      );

      return {
        success: true,
        elapsedTime,
      };
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      console.error(
        `❌ [Connectivity Test] Erro ao testar conectividade (${elapsedTime}ms):`,
        error
      );

      let errorDetails = "";
      if (axios.isAxiosError(error)) {
        errorDetails = `Code: ${error.code || "N/A"}, Message: ${error.message}`;
        console.error("Detalhes:", {
          code: error.code,
          message: error.message,
        });
      }

      return {
        success: false,
        error: `Falha na conectividade: ${errorDetails}`,
        elapsedTime,
      };
    }
  } catch (error) {
    console.error("❌ [Connectivity Test] Erro inesperado:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa a criação de assinatura na Nelogica usando Singleton
 */
export async function testNelogicaCreateSubscription(
  params: CreateSubscriptionParams
) {
  try {
    console.log(
      "📝 [Subscription Test] Iniciando criação de assinatura usando Singleton..."
    );
    console.log("📋 [Subscription Test] Dados:", params);

    // ✅ MUDANÇA: Usando singleton
    const apiClient = await NelogicaSingleton.getInstance();

    console.log("🔄 [Subscription Test] Instância do singleton obtida");

    const response = await apiClient.createSubscription(params);

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log(
      "✅ [Subscription Test] Assinatura criada com sucesso:",
      response.data
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ [Subscription Test] Erro ao criar assinatura:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa a criação de conta na Nelogica usando Singleton
 */
export async function testNelogicaCreateAccount(params: {
  licenseId: string;
  profileId: string;
  accountType: number;
}) {
  try {
    console.log(
      "🏦 [Account Test] Iniciando criação de conta usando Singleton..."
    );
    console.log("📋 [Account Test] Parâmetros:", params);

    // ✅ MUDANÇA: Usando singleton
    const apiClient = await NelogicaSingleton.getInstance();

    console.log("🔄 [Account Test] Instância do singleton obtida");

    const accountData = [
      {
        name: "Conta de Teste",
        profileId: params.profileId,
        accountType: params.accountType,
      },
    ];

    const response = await apiClient.createAccount(
      params.licenseId,
      accountData
    );

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log("✅ [Account Test] Conta criada com sucesso:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ [Account Test] Erro ao criar conta:", error);
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
 * Testa a configuração de perfil de risco na Nelogica usando Singleton
 */
export async function testNelogicaSetRisk(request: SetRiskRequest) {
  try {
    console.log(
      "⚖️ [Risk Test] Iniciando configuração de perfil de risco usando Singleton..."
    );

    // ✅ MUDANÇA: Usando singleton
    const apiClient = await NelogicaSingleton.getInstance();

    console.log("🔄 [Risk Test] Instância do singleton obtida");

    const profileId =
      NELOGICA_PROFILES[request.plan as keyof typeof NELOGICA_PROFILES];

    if (!profileId) {
      return {
        success: false,
        error: `Perfil não encontrado para o plano: ${request.plan}`,
      };
    }

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

    console.log("✅ [Risk Test] Perfil de risco configurado com sucesso");

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ [Risk Test] Erro ao configurar perfil de risco:", error);
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
 * Testa o bloqueio de conta na Nelogica usando Singleton
 */
export async function testNelogicaBlockAccount(request: AccountActionRequest) {
  try {
    console.log(
      "🔒 [Block Test] Iniciando bloqueio de conta usando Singleton..."
    );

    // ✅ MUDANÇA: Usando singleton
    const apiClient = await NelogicaSingleton.getInstance();

    console.log("🔄 [Block Test] Instância do singleton obtida");

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

    console.log("✅ [Block Test] Conta bloqueada com sucesso");

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ [Block Test] Erro ao bloquear conta:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa o desbloqueio de conta na Nelogica usando Singleton
 */
export async function testNelogicaUnblockAccount(
  request: AccountActionRequest
) {
  try {
    console.log(
      "🔓 [Unblock Test] Iniciando desbloqueio de conta usando Singleton..."
    );

    // ✅ MUDANÇA: Usando singleton
    const apiClient = await NelogicaSingleton.getInstance();

    console.log("🔄 [Unblock Test] Instância do singleton obtida");

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

    console.log("✅ [Unblock Test] Conta desbloqueada com sucesso");

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ [Unblock Test] Erro ao desbloquear conta:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa a listagem de ambientes na Nelogica usando Singleton
 */
export async function testNelogicaListEnvironments() {
  try {
    console.log(
      "🌍 [Environments Test] Iniciando listagem de ambientes usando Singleton..."
    );

    // ✅ MUDANÇA: Usando singleton
    const apiClient = await NelogicaSingleton.getInstance();

    console.log("🔄 [Environments Test] Instância do singleton obtida");

    const response = await apiClient.listEnvironments();

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log(
      "✅ [Environments Test] Ambientes listados com sucesso:",
      response.data.environments
    );

    return {
      success: true,
      environments: response.data.environments,
    };
  } catch (error) {
    console.error("❌ [Environments Test] Erro ao listar ambientes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa a listagem de assinaturas e contas na Nelogica usando Singleton
 */
export async function testNelogicaListSubscriptions() {
  try {
    console.log(
      "📋 [Subscriptions Test] Iniciando listagem de assinaturas usando Singleton..."
    );

    // ✅ MUDANÇA: Usando singleton
    const apiClient = await NelogicaSingleton.getInstance();

    console.log("🔄 [Subscriptions Test] Instância do singleton obtida");

    const TARGET_PLAN_ID = "c0dc847f-8fe6-4a31-ab14-62c2977ed4a0";

    const response = await apiClient.listSubscriptions({
      pageNumber: 1,
      pageSize: 1000,
    });

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    const filteredSubscriptions = response.data.subscriptions.filter(
      (subscription) => subscription.planId === TARGET_PLAN_ID
    );

    console.log(
      "✅ [Subscriptions Test] Assinaturas filtradas:",
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
    console.error("❌ [Subscriptions Test] Erro ao listar assinaturas:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Cria um perfil de risco na Nelogica usando Singleton
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
    console.log(
      "⚖️ [Risk Profile Test] Iniciando criação de perfil de risco usando Singleton..."
    );

    // ✅ MUDANÇA: Usando singleton
    const apiClient = await NelogicaSingleton.getInstance();

    console.log("🔄 [Risk Profile Test] Instância do singleton obtida");

    const environmentId = process.env.NELOGICA_ENVIRONMENT_ID || "1";

    const response = await apiClient.createRiskProfile(environmentId, params);

    if (!response.isSuccess) {
      return {
        success: false,
        error: response.message,
      };
    }

    console.log(
      "✅ [Risk Profile Test] Perfil de risco criado com sucesso:",
      response.data.profileId
    );

    return {
      success: true,
      profileId: response.data.profileId,
    };
  } catch (error) {
    console.error(
      "❌ [Risk Profile Test] Erro ao criar perfil de risco:",
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * 🔧 Utilitário para resetar o singleton (desenvolvimento)
 */
export async function resetSingletonForTesting() {
  try {
    console.log("🔄 [Reset Test] Forçando reset do singleton...");

    // Limpa o singleton atual
    NelogicaSingleton.clearForTesting();

    console.log("✅ [Reset Test] Singleton resetado com sucesso");

    return {
      success: true,
      message: "Singleton resetado - próxima operação criará nova instância",
    };
  } catch (error) {
    console.error("❌ [Reset Test] Erro ao resetar singleton:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * 📊 Utilitário para obter status do singleton
 */
export async function getSingletonStatus() {
  try {
    const status = NelogicaSingleton.getStatus();
    console.log("📊 [Status Check] Status do singleton:", status);

    return {
      success: true,
      status,
    };
  } catch (error) {
    console.error("❌ [Status Check] Erro ao obter status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
