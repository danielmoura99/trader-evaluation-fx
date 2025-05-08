/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/risk-profiles/_actions/index.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NelogicaService } from "@/lib/services/nelogica-service";
import { logger } from "@/lib/logger";

// Interface para o perfil de risco
export interface RiskProfile {
  id?: string;
  name: string;
  nelogicaProfileId?: string;
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
  planMappings?: string[];
}

// Buscar todos os perfis de risco
export async function getRiskProfiles() {
  try {
    // Buscar perfis no banco de dados local
    const dbProfiles = await prisma.riskProfile.findMany({
      include: {
        planMappings: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Mapear para o formato esperado pela UI
    return dbProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      nelogicaProfileId: profile.nelogicaProfileId,
      initialBalance: profile.initialBalance,
      trailing: profile.trailing,
      stopOutRule: profile.stopOutRule,
      leverage: profile.leverage,
      commissionsEnabled: profile.commissionsEnabled,
      enableContractExposure: profile.enableContractExposure,
      contractExposure: profile.contractExposure,
      enableLoss: profile.enableLoss,
      lossRule: profile.lossRule,
      enableGain: profile.enableGain,
      gainRule: profile.gainRule,
      planMappings: profile.planMappings.map((pm) => pm.planName),
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error(`Erro ao obter perfis de risco: ${error.message}`);
    throw new Error("Falha ao obter perfis de risco");
  }
}

// Buscar um perfil de risco por ID
export async function getRiskProfileById(id: string) {
  try {
    const profile = await prisma.riskProfile.findUnique({
      where: { id },
      include: {
        planMappings: true,
      },
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      name: profile.name,
      nelogicaProfileId: profile.nelogicaProfileId,
      initialBalance: profile.initialBalance,
      trailing: profile.trailing,
      stopOutRule: profile.stopOutRule,
      leverage: profile.leverage,
      commissionsEnabled: profile.commissionsEnabled,
      enableContractExposure: profile.enableContractExposure,
      contractExposure: profile.contractExposure,
      enableLoss: profile.enableLoss,
      lossRule: profile.lossRule,
      enableGain: profile.enableGain,
      gainRule: profile.gainRule,
      planMappings: profile.planMappings.map((pm) => pm.planName),
    };
  } catch (error: any) {
    logger.error(`Erro ao obter perfil de risco: ${error.message}`);
    throw new Error("Falha ao obter perfil de risco");
  }
}

// Criar um novo perfil de risco
export async function createRiskProfile(profile: RiskProfile) {
  try {
    logger.info(`Criando perfil de risco: ${profile.name}`);

    // Criar o perfil na Nelogica
    const nelogicaService = new NelogicaService();
    const nelogicaProfileId = await nelogicaService.createRiskProfile({
      initialBalance: profile.initialBalance,
      trailing: profile.trailing,
      stopOutRule: profile.stopOutRule,
      leverage: profile.leverage,
      commissionsEnabled: profile.commissionsEnabled,
      enableContractExposure: profile.enableContractExposure,
      contractExposure: profile.contractExposure,
      enableLoss: profile.enableLoss,
      lossRule: profile.lossRule,
      enableGain: profile.enableGain,
      gainRule: profile.gainRule,
    });

    // Salvar o perfil no banco de dados local
    const dbProfile = await prisma.riskProfile.create({
      data: {
        name: profile.name,
        nelogicaProfileId,
        initialBalance: profile.initialBalance,
        trailing: profile.trailing,
        stopOutRule: profile.stopOutRule,
        leverage: profile.leverage,
        commissionsEnabled: profile.commissionsEnabled,
        enableContractExposure: profile.enableContractExposure,
        contractExposure: profile.contractExposure,
        enableLoss: profile.enableLoss,
        lossRule: profile.lossRule,
        enableGain: profile.enableGain,
        gainRule: profile.gainRule,
        planMappings: {
          create: (profile.planMappings || []).map((planName) => ({
            planName,
          })),
        },
      },
    });

    logger.info(`Perfil de risco criado com sucesso: ${dbProfile.id}`);
    revalidatePath("/risk-profiles");

    return {
      id: dbProfile.id,
      nelogicaProfileId,
    };
  } catch (error: any) {
    logger.error(`Erro ao criar perfil de risco: ${error.message}`);
    throw new Error(`Falha ao criar perfil de risco: ${error.message}`);
  }
}

// Atualizar um perfil de risco existente
export async function updateRiskProfile(id: string, profile: RiskProfile) {
  try {
    logger.info(`Atualizando perfil de risco: ${id}`);

    // Obter o perfil atual
    const currentProfile = await prisma.riskProfile.findUnique({
      where: { id },
      include: {
        planMappings: true,
      },
    });

    if (!currentProfile) {
      throw new Error("Perfil de risco não encontrado");
    }

    // Atualizar na Nelogica
    const nelogicaService = new NelogicaService();
    await nelogicaService.updateRiskProfile(currentProfile.nelogicaProfileId, {
      initialBalance: profile.initialBalance,
      trailing: profile.trailing,
      stopOutRule: profile.stopOutRule,
      leverage: profile.leverage,
      commissionsEnabled: profile.commissionsEnabled,
      enableContractExposure: profile.enableContractExposure,
      contractExposure: profile.contractExposure,
      enableLoss: profile.enableLoss,
      lossRule: profile.lossRule,
      enableGain: profile.enableGain,
      gainRule: profile.gainRule,
    });

    // Atualizar os mapeamentos de planos
    // Primeiro removemos todos os mapeamentos existentes
    await prisma.planRiskMapping.deleteMany({
      where: { riskProfileId: id },
    });

    // Depois criamos os novos mapeamentos
    await Promise.all(
      (profile.planMappings || []).map((planName) =>
        prisma.planRiskMapping.create({
          data: {
            planName,
            riskProfileId: id,
          },
        })
      )
    );

    // Atualizar o perfil no banco local
    await prisma.riskProfile.update({
      where: { id },
      data: {
        name: profile.name,
        initialBalance: profile.initialBalance,
        trailing: profile.trailing,
        stopOutRule: profile.stopOutRule,
        leverage: profile.leverage,
        commissionsEnabled: profile.commissionsEnabled,
        enableContractExposure: profile.enableContractExposure,
        contractExposure: profile.contractExposure,
        enableLoss: profile.enableLoss,
        lossRule: profile.lossRule,
        enableGain: profile.enableGain,
        gainRule: profile.gainRule,
      },
    });

    logger.info(`Perfil de risco atualizado com sucesso: ${id}`);
    revalidatePath("/risk-profiles");

    return { success: true };
  } catch (error: any) {
    logger.error(`Erro ao atualizar perfil de risco: ${error.message}`);
    throw new Error(`Falha ao atualizar perfil de risco: ${error.message}`);
  }
}

// Excluir um perfil de risco
export async function deleteRiskProfile(id: string) {
  try {
    logger.info(`Excluindo perfil de risco: ${id}`);

    // Verificar se o perfil está em uso
    const clientsUsingProfile = await prisma.client.count({
      where: {
        plan: {
          in: await prisma.planRiskMapping
            .findMany({
              where: { riskProfileId: id },
              select: { planName: true },
            })
            .then((mappings) => mappings.map((m) => m.planName)),
        },
      },
    });

    if (clientsUsingProfile > 0) {
      throw new Error("Não é possível excluir um perfil em uso por clientes");
    }

    // Excluir os mapeamentos de planos
    await prisma.planRiskMapping.deleteMany({
      where: { riskProfileId: id },
    });

    // Excluir o perfil
    await prisma.riskProfile.delete({
      where: { id },
    });

    // Não excluímos da Nelogica, pois pode estar sendo usado em outra integração

    logger.info(`Perfil de risco excluído com sucesso: ${id}`);
    revalidatePath("/risk-profiles");

    return { success: true };
  } catch (error: any) {
    logger.error(`Erro ao excluir perfil de risco: ${error.message}`);
    throw new Error(`Falha ao excluir perfil de risco: ${error.message}`);
  }
}

// Obter todos os planos disponíveis
export async function getAvailablePlans() {
  try {
    // Aqui podemos obter os planos do sistema ou definir uma lista predefinida
    const plans = await prisma.client
      .findMany({
        select: {
          plan: true,
        },
        distinct: ["plan"],
      })
      .then((results) => results.map((r) => r.plan))
      .then((plans) => [
        // Garantir que os planos padrão estejam na lista
        "FX - 5K",
        "FX - 10K",
        "FX - 25K",
        "FX - 50K",
        "FX - 100K",
        "FX - 150K",
        // Adicionar outros planos encontrados no banco
        ...plans,
      ])
      // Remover duplicados
      .then((plans) => {
        return plans.filter((plan, index) => plans.indexOf(plan) === index);
      });

    return plans;
  } catch (error: any) {
    logger.error(`Erro ao obter planos disponíveis: ${error.message}`);
    throw new Error("Falha ao obter planos disponíveis");
  }
}
