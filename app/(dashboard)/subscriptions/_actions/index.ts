// app/(dashboard)/subscriptions/_actions/index.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NelogicaService } from "@/lib/services/nelogica-service";
import { logger } from "@/lib/logger";

/**
 * Obtém todas as assinaturas da Nelogica
 */
export async function getSubscriptions() {
  try {
    logger.info("Buscando assinaturas na Nelogica");

    // Instancia o serviço Nelogica
    const nelogicaService = new NelogicaService();

    // Busca as assinaturas na API da Nelogica
    const subscriptions = await nelogicaService.listSubscriptions();

    // Busca os clientes correspondentes no banco local
    const clients = await prisma.client.findMany({
      where: {
        nelogicaSubscriptionId: {
          in: subscriptions.map((sub) => sub.subscriptionId),
        },
      },
    });

    // Combina os dados da Nelogica com os dados locais
    const enrichedSubscriptions = subscriptions.map((subscription) => {
      const client = clients.find(
        (c) => c.nelogicaSubscriptionId === subscription.subscriptionId
      );

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
            }
          : null,
      };
    });

    logger.info(`${enrichedSubscriptions.length} assinaturas encontradas`);
    return enrichedSubscriptions;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao obter assinaturas: ${errorMsg}`);
    throw new Error("Falha ao obter assinaturas da Nelogica");
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
