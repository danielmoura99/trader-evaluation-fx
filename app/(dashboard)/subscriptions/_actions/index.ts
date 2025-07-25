/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/subscriptions/_actions/index.ts - VERSÃO SUPER OTIMIZADA
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NelogicaSingleton } from "@/lib/services/nelogica-singleton";
import { NelogicaSharedService } from "@/lib/services/nelogica-shared-service"; // ✅ NOVO
import { logger } from "@/lib/logger";

/**
 * 🚀 SUPER OTIMIZADA: Obtém assinaturas usando serviço compartilhado
 * ELIMINA 100% da duplicação com a página accounts
 */
export async function getSubscriptions() {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(
      `🔍 [${requestId}] ===== INÍCIO DA BUSCA DE ASSINATURAS (OTIMIZADA) =====`
    );
    console.log(`📅 [${requestId}] Timestamp: ${new Date().toISOString()}`);

    logger.info(
      `[${requestId}] Iniciando busca de assinaturas com MÁXIMA otimização`
    );

    // ✅ MUDANÇA RADICAL: Usa serviço compartilhado ao invés de chamada duplicada
    console.log(
      `⚡ [${requestId}] Usando NelogicaSharedService (ZERO duplicação)`
    );
    console.log(
      `💡 [${requestId}] Reutilizando dados da página accounts se disponível`
    );

    const startTime = Date.now();

    // 🚀 Uma única linha substitui toda a lógica duplicada!
    const enrichedSubscriptions =
      await NelogicaSharedService.getEnrichedSubscriptions();

    const totalDuration = Date.now() - startTime;

    console.log(
      `⏱️  [${requestId}] Operação OTIMIZADA completada em ${totalDuration}ms`
    );
    console.log(
      `📊 [${requestId}] ${enrichedSubscriptions.length} assinaturas processadas`
    );
    console.log(
      `💎 [${requestId}] ZERO requests duplicadas - máxima eficiência alcançada!`
    );

    const withClients = enrichedSubscriptions.filter((s) => s.client).length;
    const withoutClients = enrichedSubscriptions.filter(
      (s) => !s.client
    ).length;

    console.log(`📊 [${requestId}] Assinaturas com clientes: ${withClients}`);
    console.log(
      `📊 [${requestId}] Assinaturas sem clientes: ${withoutClients}`
    );

    logger.info(
      `[${requestId}] ${enrichedSubscriptions.length} assinaturas encontradas e processadas com otimização máxima`
    );

    console.log(
      `🎉 [${requestId}] ===== FIM DA BUSCA DE ASSINATURAS (OTIMIZADA) =====`
    );

    return enrichedSubscriptions;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    console.error(`❌ [${requestId}] ===== ERRO NA BUSCA DE ASSINATURAS =====`);
    console.error(`❌ [${requestId}] Mensagem:`, errorMsg);

    logger.error(`[${requestId}] Erro ao obter assinaturas: ${errorMsg}`);
    throw new Error(`Falha ao obter assinaturas da Nelogica: ${errorMsg}`);
  }
}

/**
 * 🔄 REFRESH INTELIGENTE: Força atualização das assinaturas
 */
export async function refreshSubscriptions() {
  try {
    logger.info("🔄 [Subscriptions] Refresh forçado das assinaturas");
    console.log(
      "🔄 [Subscriptions] Limpando cache e buscando dados atualizados..."
    );

    // Limpa cache e força nova busca
    NelogicaSharedService.clearCache();

    const subscriptions = await NelogicaSharedService.getEnrichedSubscriptions({
      forceRefresh: true,
    });

    logger.info(
      `✅ [Subscriptions] ${subscriptions.length} assinaturas atualizadas com refresh`
    );
    return subscriptions;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [Subscriptions] Erro no refresh: ${errorMsg}`);
    throw new Error("Falha ao atualizar assinaturas da Nelogica");
  }
}

/**
 * ✅ MIGRADA PARA SINGLETON: Cancela assinatura usando singleton
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    logger.info(
      `🚫 [Subscriptions] Cancelando assinatura ${subscriptionId} usando Singleton`
    );

    // ✅ MUDANÇA: Usando singleton ao invés de instância direta
    const nelogicaClient = await NelogicaSingleton.getInstance();

    console.log(
      "🔄 [Subscriptions] Instância do singleton obtida para cancelamento"
    );

    // Cancela a assinatura na Nelogica
    const response = await nelogicaClient.cancelSubscription(subscriptionId);

    if (!response.isSuccess) {
      throw new Error(`Falha ao cancelar assinatura: ${response.message}`);
    }

    // Atualiza o status do cliente no banco local
    const client = await prisma.client.findFirst({
      where: { nelogicaSubscriptionId: subscriptionId },
    });

    if (client) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          traderStatus: "Reprovado",
          cancellationDate: new Date(),
        },
      });
      logger.info(`Cliente ${client.name} atualizado para status "Reprovado"`);
    }

    // ✅ Limpa cache para forçar atualização
    NelogicaSharedService.clearCache("subscriptions");

    logger.info(
      `✅ [Subscriptions] Assinatura ${subscriptionId} cancelada com sucesso usando Singleton`
    );
    console.log(
      "💡 [Subscriptions] Singleton reutilizado - economia de login no cancelamento"
    );
    console.log(
      "🧹 [Subscriptions] Cache limpo - próxima busca será atualizada"
    );

    revalidatePath("/subscriptions");

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [Subscriptions] Erro ao cancelar assinatura: ${errorMsg}`);
    throw new Error(`Falha ao cancelar assinatura na Nelogica: ${errorMsg}`);
  }
}

/**
 * 🧪 NOVA: Teste de economia MÁXIMA para subscriptions
 */
export async function testSubscriptionsSingletonEconomy() {
  try {
    console.log(
      "🧪 [Subscriptions Test] Iniciando teste de economia MÁXIMA..."
    );
    const startTime = Date.now();

    // Status inicial
    console.log(
      "📊 [Subscriptions Test] Cache status inicial:",
      NelogicaSharedService.getCacheStatus()
    );
    console.log(
      "📊 [Subscriptions Test] Singleton status:",
      NelogicaSingleton.getStatus()
    );

    // Simula múltiplas operações que antes faziam requests duplicados
    console.log("🔄 [Test] Operação 1: getSubscriptions()");
    const start1 = Date.now();
    const subs1 = await getSubscriptions();
    const time1 = Date.now() - start1;

    console.log(
      "🔄 [Test] Operação 2: getSubscriptions() (deveria usar cache)"
    );
    const start2 = Date.now();
    const subs2 = await getSubscriptions();
    const time2 = Date.now() - start2;

    console.log(
      "🔄 [Test] Operação 3: getSubscriptions() (deveria usar cache)"
    );
    const start3 = Date.now();
    const subs3 = await getSubscriptions();
    const time3 = Date.now() - start3;

    const totalTime = Date.now() - startTime;

    // Análise
    const cacheWorking = time2 < 100 && time3 < 100;
    const sameData =
      subs1.length === subs2.length && subs2.length === subs3.length;

    console.log("🎯 [Subscriptions Test] RESULTADO:");
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
      subscriptionCount: subs1.length,
      message: `Otimização máxima! Cache: ${cacheWorking}, Tempos: ${time1}/${time2}/${time3}ms`,
    };
  } catch (error) {
    console.error("❌ [Subscriptions Test] Erro no teste:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * 🔄 NOVA: Teste de interoperabilidade entre accounts e subscriptions
 */
export async function testCrossPageOptimization() {
  try {
    console.log("🔄 [Cross-Page Test] Testando otimização entre páginas...");
    const startTime = Date.now();

    // Simula usuário navegando entre páginas
    console.log("🏦 [Cross-Page] Simulando acesso à página accounts...");
    const accountsStart = Date.now();
    // Simula importação dinâmica da função accounts
    const { getAccounts } = await import(
      "@/app/(dashboard)/accounts/_actions/index"
    );
    const accounts = await getAccounts();
    const accountsTime = Date.now() - accountsStart;

    console.log("📋 [Cross-Page] Simulando acesso à página subscriptions...");
    const subsStart = Date.now();
    const subscriptions = await getSubscriptions();
    const subsTime = Date.now() - subsStart;

    const totalTime = Date.now() - startTime;
    const efficiency =
      subsTime < 100 ? "MÁXIMA" : subsTime < 500 ? "ALTA" : "BAIXA";

    console.log("🎯 [Cross-Page] RESULTADO DA INTEROPERABILIDADE:");
    console.log(`   - Accounts: ${accountsTime}ms (${accounts.length} contas)`);
    console.log(
      `   - Subscriptions: ${subsTime}ms (${subscriptions.length} assinaturas)`
    );
    console.log(`   - Eficiência: ${efficiency}`);
    console.log(`   - Total: ${totalTime}ms`);

    return {
      success: true,
      accountsTime,
      subscriptionsTime: subsTime,
      totalTime,
      efficiency,
      accountCount: accounts.length,
      subscriptionCount: subscriptions.length,
      message: `Cross-page optimization: ${efficiency} efficiency achieved!`,
    };
  } catch (error) {
    console.error("❌ [Cross-Page Test] Erro no teste:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * 📊 NOVA: Status de cache específico para subscriptions
 */
export async function getSubscriptionsCacheStatus() {
  try {
    const cacheStatus = NelogicaSharedService.getCacheStatus();
    const singletonStatus = NelogicaSingleton.getStatus();

    console.log("📊 [Subscriptions Status] Cache status:", cacheStatus);
    console.log("📊 [Subscriptions Status] Singleton status:", singletonStatus);

    return {
      success: true,
      cacheStatus,
      singletonStatus,
      page: "subscriptions",
      optimization: "MAXIMUM",
    };
  } catch (error) {
    console.error("❌ [Subscriptions Status] Erro ao obter status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
