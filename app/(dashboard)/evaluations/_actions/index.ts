"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TraderStatus } from "@/app/types";
import { NelogicaService } from "@/lib/services/nelogica-service";
import { logger } from "@/lib/logger";

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
    logger.info(`Iniciando avaliação para cliente ${clientId}`);

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
      // Se já possui os dados da Nelogica, apenas atualiza o status
      logger.info(
        `Cliente ${clientId} já possui dados na Nelogica, apenas atualizando status`
      );

      const startDate = new Date();
      // Calculando a data de fim (60 dias após o início)
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 60);

      await prisma.client.update({
        where: { id: clientId },
        data: {
          traderStatus: TraderStatus.IN_PROGRESS,
          startDate,
          endDate,
        },
      });
    } else {
      // Se não possui dados da Nelogica, inicia o fluxo completo
      logger.info(
        `Iniciando fluxo completo na Nelogica para cliente ${clientId}`
      );

      // Instancia o serviço Nelogica
      const nelogicaService = new NelogicaService();

      // Inicia o fluxo completo de liberação de plataforma
      await nelogicaService.releaseTraderPlatform({
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

      // O serviço já atualizou o status do cliente no banco
    }

    // Revalida a rota para atualizar a UI
    revalidatePath("/evaluations");
    return true;
  } catch (error) {
    logger.error(
      `Erro ao iniciar avaliação: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
    throw error; // Propaga o erro para ser tratado pelo componente
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
