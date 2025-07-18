"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TraderStatus } from "@/app/types";
import { NelogicaApiClient } from "@/lib/services/nelogica-api-client";
import { logger } from "@/lib/logger";

// Configurações da API Nelogica
const NELOGICA_API_URL =
  process.env.NELOGICA_API_URL || "https://api-broker4-v2.nelogica.com.br";
const NELOGICA_USERNAME =
  process.env.NELOGICA_USERNAME || "tradersHouse.hml@nelogica";
const NELOGICA_PASSWORD =
  process.env.NELOGICA_PASSWORD || "OJOMy4miz63YLFwOM27ZGTO5n";

export async function getAwaitingClients() {
  return await prisma.client.findMany({
    where: {
      traderStatus: TraderStatus.WAITING,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getEvaluationClients() {
  return await prisma.client.findMany({
    where: {
      traderStatus: TraderStatus.IN_PROGRESS,
    },
    orderBy: {
      startDate: "asc",
    },
  });
}

export async function startEvaluation(clientId: string) {
  try {
    logger.info(`Iniciando avaliação V2 para cliente ${clientId}`);

    // Busca o cliente no banco de dados
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      logger.error(`Cliente não encontrado: ${clientId}`);
      throw new Error("Cliente não encontrado");
    }

    // Verifica se o cliente já tem uma plataforma ativa
    if (client.nelogicaLicenseId && client.nelogicaAccount) {
      // Se já possui os dados da Nelogica, apenas atualiza o status e datas
      logger.info(
        `Cliente ${clientId} já possui dados na Nelogica, apenas atualizando status`
      );

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30); // 30 dias de avaliação

      await prisma.client.update({
        where: { id: clientId },
        data: {
          traderStatus: TraderStatus.IN_PROGRESS,
          startDate,
          endDate,
        },
      });

      logger.info(`Status do cliente ${clientId} atualizado para IN_PROGRESS`);
    } else {
      // Se não possui dados da Nelogica, inicia o fluxo completo V2
      logger.info(
        `Iniciando fluxo completo V2 na Nelogica para cliente ${clientId}`
      );

      // Instancia o cliente da API Nelogica V2
      const nelogicaClient = new NelogicaApiClient(
        NELOGICA_API_URL,
        NELOGICA_USERNAME,
        NELOGICA_PASSWORD
      );

      // Executa o fluxo completo de liberação da plataforma V2
      await nelogicaClient.releaseTraderPlatformV2({
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

      logger.info(
        `Fluxo completo V2 executado com sucesso para cliente ${clientId}`
      );
    }

    // Revalida a rota para atualizar a UI
    revalidatePath("/evaluations");
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    logger.error(`Erro ao iniciar avaliação V2: ${errorMessage}`);

    // Re-throw o erro para que a UI possa capturar e exibir
    throw new Error(`Falha ao iniciar avaliação: ${errorMessage}`);
  }
}

export async function finishEvaluation(
  clientId: string,
  status: "Aprovado" | "Reprovado"
) {
  await prisma.client.update({
    where: { id: clientId },
    data: {
      traderStatus:
        status === "Aprovado" ? TraderStatus.APPROVED : TraderStatus.REJECTED,
      endDate: new Date(),
      cancellationDate: new Date(),
    },
  });
  revalidatePath("/evaluations");
}
