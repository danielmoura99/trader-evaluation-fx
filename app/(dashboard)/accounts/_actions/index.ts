/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/accounts/_actions/index.ts - VERSÃO OTIMIZADA
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NelogicaSingleton } from "@/lib/services/nelogica-singleton";
import { NelogicaSharedService } from "@/lib/services/nelogica-shared-service"; // ✅ NOVO
import { logger } from "@/lib/logger";

/**
 * Interface para accounts
 */
export interface NelogicaAccount {
  id?: string;
  account: string;
  name: string;
  licenseId: string;
  clientId?: string;
  profileId: string;
  isBlocked: boolean;
  validatedAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    plan: string;
    traderStatus: string;
  } | null;
}

/**
 * 🚀 SUPER OTIMIZADA: Obtém contas usando serviço compartilhado
 * ZERO requests duplicadas + Singleton + Cache inteligente
 */
export async function getAccounts() {
  try {
    logger.info("🏦 [Accounts] Buscando contas com MÁXIMA otimização");
    console.log("⚡ [Accounts] Usando NelogicaSharedService (zero duplicação)");

    // ✅ USA SERVIÇO COMPARTILHADO - reutiliza subscriptions de outras páginas
    const accounts = await NelogicaSharedService.getAccountsFromSubscriptions();

    logger.info(
      `✅ [Accounts] ${accounts.length} contas obtidas com otimização máxima`
    );
    console.log(
      "💡 [Accounts] Zero requests duplicadas! Reutilizou dados existentes."
    );

    return accounts;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [Accounts] Erro ao obter contas: ${errorMsg}`);
    throw new Error("Falha ao obter contas da Nelogica");
  }
}

/**
 * 🔄 REFRESH INTELIGENTE: Força atualização quando necessário
 */
export async function refreshAccounts() {
  try {
    logger.info("🔄 [Accounts] Refresh forçado das contas");
    console.log("🔄 [Accounts] Limpando cache e buscando dados atualizados...");

    // Limpa cache e força nova busca
    NelogicaSharedService.clearCache();

    const accounts = await NelogicaSharedService.getAccountsFromSubscriptions({
      forceRefresh: true,
    });

    logger.info(
      `✅ [Accounts] ${accounts.length} contas atualizadas com refresh`
    );
    return accounts;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [Accounts] Erro no refresh: ${errorMsg}`);
    throw new Error("Falha ao atualizar contas da Nelogica");
  }
}

/**
 * ✅ MANTÉM SINGLETON: Bloqueia conta (operação individual)
 */
export async function blockAccount(licenseId: string, account: string) {
  try {
    logger.info(`🔒 [Accounts] Bloqueando conta ${account} usando Singleton`);

    // ✅ Singleton para operações específicas (não é subscriptions)
    const nelogicaClient = await NelogicaSingleton.getInstance();
    console.log("🔄 [Accounts] Singleton reutilizado para bloqueio");

    const response = await nelogicaClient.blockAccount(licenseId, account);

    if (!response.isSuccess) {
      throw new Error(`Falha ao bloquear conta: ${response.message}`);
    }

    // Atualiza cliente local se necessário
    const client = await prisma.client.findFirst({
      where: { nelogicaAccount: account },
    });

    if (client) {
      logger.info(`Cliente encontrado para a conta ${account}: ${client.name}`);
    }

    // ✅ Limpa cache para forçar atualização na próxima busca
    NelogicaSharedService.clearCache("subscriptions");

    logger.info(`✅ [Accounts] Conta ${account} bloqueada com sucesso`);
    console.log("💡 [Accounts] Cache limpo - próxima busca será atualizada");
    revalidatePath("/accounts");

    return { success: true, isBlocked: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [Accounts] Erro ao bloquear conta: ${errorMsg}`);
    throw new Error(`Falha ao bloquear conta na Nelogica: ${errorMsg}`);
  }
}

/**
 * ✅ MANTÉM SINGLETON: Desbloqueia conta (operação individual)
 */
export async function unblockAccount(licenseId: string, account: string) {
  try {
    logger.info(
      `🔓 [Accounts] Desbloqueando conta ${account} usando Singleton`
    );

    // ✅ Singleton para operações específicas
    const nelogicaClient = await NelogicaSingleton.getInstance();
    console.log("🔄 [Accounts] Singleton reutilizado para desbloqueio");

    const response = await nelogicaClient.unblockAccount(licenseId, account);

    if (!response.isSuccess) {
      throw new Error(`Falha ao desbloquear conta: ${response.message}`);
    }

    const client = await prisma.client.findFirst({
      where: { nelogicaAccount: account },
    });

    if (client) {
      logger.info(`Cliente encontrado para a conta ${account}: ${client.name}`);
    }

    // ✅ Limpa cache para atualização
    NelogicaSharedService.clearCache("subscriptions");

    logger.info(`✅ [Accounts] Conta ${account} desbloqueada com sucesso`);
    revalidatePath("/accounts");

    return { success: true, isBlocked: false };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [Accounts] Erro ao desbloquear conta: ${errorMsg}`);
    throw new Error(`Falha ao desbloquear conta na Nelogica: ${errorMsg}`);
  }
}

/**
 * ✅ MANTÉM SINGLETON: Remove conta (operação individual)
 */
export async function removeAccount(licenseId: string, account: string) {
  try {
    logger.info(`🗑️ [Accounts] Removendo conta ${account} usando Singleton`);

    const nelogicaClient = await NelogicaSingleton.getInstance();
    console.log("🔄 [Accounts] Singleton reutilizado para remoção");

    const response = await nelogicaClient.removeAccount(licenseId, account);

    if (!response.isSuccess) {
      throw new Error(`Falha ao remover conta: ${response.message}`);
    }

    const client = await prisma.client.findFirst({
      where: { nelogicaAccount: account },
    });

    if (client) {
      await prisma.client.update({
        where: { id: client.id },
        data: { nelogicaAccount: null },
      });
      logger.info(`Registro local do cliente ${client.name} atualizado`);
    }

    // ✅ Limpa cache
    NelogicaSharedService.clearCache("subscriptions");

    logger.info(`✅ [Accounts] Conta ${account} removida com sucesso`);
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [Accounts] Erro ao remover conta: ${errorMsg}`);
    throw new Error(`Falha ao remover conta na Nelogica: ${errorMsg}`);
  }
}

/**
 * ✅ MANTÉM SINGLETON: Configura perfil de risco (operação individual)
 */
export async function setAccountRiskProfile(
  licenseId: string,
  account: string,
  profileId: string,
  accountType: number = 0
) {
  try {
    logger.info(
      `⚖️ [Accounts] Configurando perfil de risco ${profileId} para conta ${account}`
    );

    const nelogicaClient = await NelogicaSingleton.getInstance();
    console.log(
      "🔄 [Accounts] Singleton reutilizado para configuração de risco"
    );

    const response = await nelogicaClient.setAccountRisk(
      licenseId,
      account,
      profileId,
      accountType
    );

    if (!response.isSuccess) {
      throw new Error(
        `Falha ao configurar perfil de risco: ${response.message}`
      );
    }

    logger.info(
      `✅ [Accounts] Perfil de risco ${profileId} configurado com sucesso`
    );
    revalidatePath("/accounts");

    return { success: true, profileId, accountType };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(
      `❌ [Accounts] Erro ao configurar perfil de risco: ${errorMsg}`
    );
    throw new Error(
      `Falha ao configurar perfil de risco na Nelogica: ${errorMsg}`
    );
  }
}

/**
 * 🧪 NOVA: Teste de economia MÁXIMA
 */
export async function testMaxOptimization() {
  try {
    console.log("🧪 [Accounts Test] Testando otimização MÁXIMA...");
    const startTime = Date.now();

    // Status inicial
    console.log(
      "📊 [Test] Cache status inicial:",
      NelogicaSharedService.getCacheStatus()
    );
    console.log("📊 [Test] Singleton status:", NelogicaSingleton.getStatus());

    // Simula múltiplas operações que antes faziam requests duplicados
    console.log("🔄 [Test] Operação 1: getAccounts()");
    const start1 = Date.now();
    const accounts1 = await getAccounts();
    const time1 = Date.now() - start1;

    console.log("🔄 [Test] Operação 2: getAccounts() (deveria usar cache)");
    const start2 = Date.now();
    const accounts2 = await getAccounts();
    const time2 = Date.now() - start2;

    console.log("🔄 [Test] Operação 3: getAccounts() (deveria usar cache)");
    const start3 = Date.now();
    const accounts3 = await getAccounts();
    const time3 = Date.now() - start3;

    const totalTime = Date.now() - startTime;

    // Análise
    const cacheWorking = time2 < 100 && time3 < 100;
    const sameData =
      accounts1.length === accounts2.length &&
      accounts2.length === accounts3.length;

    console.log("🎯 [Test] RESULTADO:");
    console.log(`   - Tempos: ${time1}ms / ${time2}ms / ${time3}ms`);
    console.log(`   - Cache funcionando: ${cacheWorking}`);
    console.log(`   - Dados consistentes: ${sameData}`);
    console.log(`   - Total: ${totalTime}ms`);
    console.log(
      "📊 [Test] Cache status final:",
      NelogicaSharedService.getCacheStatus()
    );

    return {
      success: true,
      times: [time1, time2, time3],
      totalTime,
      cacheWorking,
      sameData,
      accountCount: accounts1.length,
      message: `Otimização máxima! Cache: ${cacheWorking}, Tempos: ${time1}/${time2}/${time3}ms`,
    };
  } catch (error) {
    console.error("❌ [Test] Erro no teste:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
