/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/subscriptions/_actions/index.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NelogicaService } from "@/lib/services/nelogica-service";
import { logger } from "@/lib/logger";

/**
 * Obtém todas as assinaturas da Nelogica com logs detalhados
 */
export async function getSubscriptions() {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`🔍 [${requestId}] ===== INÍCIO DA BUSCA DE ASSINATURAS =====`);
    console.log(`📅 [${requestId}] Timestamp: ${new Date().toISOString()}`);

    logger.info(`[${requestId}] Iniciando busca de assinaturas na Nelogica`);

    // 1. Instanciar serviço Nelogica com logs
    console.log(`⚙️  [${requestId}] Instanciando NelogicaService...`);
    const nelogicaService = new NelogicaService();
    console.log(`✅ [${requestId}] NelogicaService instanciado com sucesso`);

    // 2. Buscar assinaturas na API da Nelogica
    console.log(`🌐 [${requestId}] Fazendo chamada para API da Nelogica...`);
    console.log(`🔗 [${requestId}] Endpoint: listSubscriptions()`);

    const startTime = Date.now();
    const subscriptions = await nelogicaService.listSubscriptions();
    const apiCallDuration = Date.now() - startTime;

    console.log(
      `⏱️  [${requestId}] Chamada API completada em ${apiCallDuration}ms`
    );
    console.log(
      `📊 [${requestId}] Assinaturas retornadas da API: ${subscriptions.length}`
    );

    if (subscriptions.length > 0) {
      console.log(`📋 [${requestId}] Primeira assinatura (exemplo):`, {
        subscriptionId: subscriptions[0].subscriptionId,
        licenseId: subscriptions[0].licenseId,
        customerId: subscriptions[0].customerId,
        createdAt: subscriptions[0].createdAt,
        planId: subscriptions[0].planId || "N/A",
        accounts: subscriptions[0].accounts?.length || 0,
      });
    }

    // 3. Buscar clientes correspondentes no banco local
    console.log(
      `🗄️  [${requestId}] Buscando clientes correspondentes no banco local...`
    );
    const subscriptionIds = subscriptions.map((sub) => sub.subscriptionId);
    console.log(
      `🔍 [${requestId}] IDs de assinaturas para busca: [${subscriptionIds.join(", ")}]`
    );

    const dbStartTime = Date.now();
    const clients = await prisma.client.findMany({
      where: {
        nelogicaSubscriptionId: {
          in: subscriptionIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        plan: true,
        traderStatus: true,
        nelogicaSubscriptionId: true,
        startDate: true,
        endDate: true,
      },
    });
    const dbCallDuration = Date.now() - dbStartTime;

    console.log(
      `⏱️  [${requestId}] Consulta ao banco completada em ${dbCallDuration}ms`
    );
    console.log(
      `👥 [${requestId}] Clientes encontrados no banco: ${clients.length}`
    );

    if (clients.length > 0) {
      console.log(`👤 [${requestId}] Primeiro cliente (exemplo):`, {
        id: clients[0].id,
        name: clients[0].name,
        email: clients[0].email,
        nelogicaSubscriptionId: clients[0].nelogicaSubscriptionId,
        traderStatus: clients[0].traderStatus,
      });
    }

    // 4. Combinar dados da Nelogica com dados locais
    console.log(
      `🔗 [${requestId}] Combinando dados da Nelogica com dados locais...`
    );

    const enrichedSubscriptions = subscriptions.map((subscription, index) => {
      const client = clients.find(
        (c) => c.nelogicaSubscriptionId === subscription.subscriptionId
      );

      if (index === 0) {
        console.log(`🔍 [${requestId}] Primeira combinação (exemplo):`, {
          subscriptionId: subscription.subscriptionId,
          clientFound: !!client,
          clientId: client?.id || "N/A",
          clientName: client?.name || "N/A",
        });
      }

      return {
        ...subscription,
        client: client
          ? {
              id: client.id,
              name: client.name,
              email: client.email,
              cpf: client.cpf,
              plan: client.plan,
              traderStatus: client.traderStatus,
              startDate: client.startDate?.toISOString() || null,
              endDate: client.endDate?.toISOString() || null,
            }
          : null,
      };
    });

    console.log(`✅ [${requestId}] Dados combinados com sucesso`);
    console.log(
      `📊 [${requestId}] Assinaturas com clientes: ${enrichedSubscriptions.filter((s) => s.client).length}`
    );
    console.log(
      `📊 [${requestId}] Assinaturas sem clientes: ${enrichedSubscriptions.filter((s) => !s.client).length}`
    );

    const totalDuration = Date.now() - startTime;
    console.log(
      `⏱️  [${requestId}] Operação total completada em ${totalDuration}ms`
    );

    logger.info(
      `[${requestId}] ${enrichedSubscriptions.length} assinaturas encontradas e processadas`
    );

    console.log(`🎉 [${requestId}] ===== FIM DA BUSCA DE ASSINATURAS =====`);

    return enrichedSubscriptions;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    console.error(`❌ [${requestId}] ===== ERRO NA BUSCA DE ASSINATURAS =====`);
    console.error(
      `❌ [${requestId}] Tipo do erro:`,
      error?.constructor?.name || "Unknown"
    );
    console.error(`❌ [${requestId}] Mensagem:`, errorMsg);

    if (error instanceof Error) {
      console.error(`❌ [${requestId}] Stack trace:`, error.stack);
    }

    // Se for erro de rede/HTTP, capturar mais detalhes
    if (error && typeof error === "object") {
      const errorObj = error as any;
      if (errorObj.response) {
        console.error(
          `🌐 [${requestId}] Status HTTP:`,
          errorObj.response.status
        );
        console.error(
          `🌐 [${requestId}] Status Text:`,
          errorObj.response.statusText
        );
        console.error(
          `🌐 [${requestId}] Response Data:`,
          errorObj.response.data
        );
        console.error(`🌐 [${requestId}] Headers:`, errorObj.response.headers);
      }
      if (errorObj.request) {
        console.error(
          `📡 [${requestId}] Request URL:`,
          errorObj.config?.url || "N/A"
        );
        console.error(
          `📡 [${requestId}] Request Method:`,
          errorObj.config?.method || "N/A"
        );
        console.error(
          `📡 [${requestId}] Request Headers:`,
          errorObj.config?.headers || "N/A"
        );
      }
      if (errorObj.code) {
        console.error(`🏷️  [${requestId}] Error Code:`, errorObj.code);
      }
    }

    console.error(`❌ [${requestId}] ===== FIM DO ERRO =====`);

    logger.error(`[${requestId}] Erro ao obter assinaturas: ${errorMsg}`);
    throw new Error(`Falha ao obter assinaturas da Nelogica: ${errorMsg}`);
  }
}

/**
 * Cancela uma assinatura na Nelogica
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    logger.info(`Cancelando assinatura ${subscriptionId}`);

    // Instancia o serviço Nelogica
    const nelogicaService = new NelogicaService();

    // Cancela a assinatura na Nelogica
    await nelogicaService.cancelSubscription(subscriptionId);

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
    }

    logger.info(`Assinatura ${subscriptionId} cancelada com sucesso`);
    revalidatePath("/subscriptions");

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao cancelar assinatura: ${errorMsg}`);
    throw new Error("Falha ao cancelar assinatura na Nelogica");
  }
}

/**
 * Reativa uma assinatura na Nelogica
 */
export async function reactivateSubscription(clientId: string) {
  try {
    logger.info(`Reativando assinatura para cliente ${clientId}`);

    // Busca o cliente no banco local
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error("Cliente não encontrado");
    }

    // Instancia o serviço Nelogica
    const nelogicaService = new NelogicaService();

    // Inicia o fluxo de liberação de plataforma
    const result = await nelogicaService.releaseTraderPlatform({
      id: client.id,
      name: client.name,
      email: client.email,
      cpf: client.cpf,
      phone: client.phone,
      birthDate: client.birthDate,
      address: client.address || undefined,
      zipCode: client.zipCode || undefined,
      plan: client.plan,
    });

    logger.info(`Assinatura reativada com sucesso para cliente ${clientId}`);
    revalidatePath("/subscriptions");

    return {
      success: true,
      subscriptionId: result.subscriptionId,
      licenseId: result.licenseId,
      account: result.account,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao reativar assinatura: ${errorMsg}`);
    throw new Error("Falha ao reativar assinatura na Nelogica");
  }
}

/**
 * Obtém detalhes de uma assinatura específica
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  try {
    logger.info(`Buscando detalhes da assinatura ${subscriptionId}`);

    // Instancia o serviço Nelogica
    const nelogicaService = new NelogicaService();

    // Busca os detalhes da assinatura na Nelogica
    const details =
      await nelogicaService.getSubscriptionDetails(subscriptionId);

    // Busca informações adicionais do cliente no banco local
    const client = await prisma.client.findFirst({
      where: { nelogicaSubscriptionId: subscriptionId },
    });

    return {
      ...details,
      clientDetails: client
        ? {
            id: client.id,
            name: client.name,
            email: client.email,
            cpf: client.cpf,
            phone: client.phone,
            plan: client.plan,
            traderStatus: client.traderStatus,
            startDate: client.startDate,
            endDate: client.endDate,
          }
        : null,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao obter detalhes da assinatura: ${errorMsg}`);
    throw new Error("Falha ao obter detalhes da assinatura na Nelogica");
  }
}
