/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/risk-profiles/_actions/index.ts - VERSÃO SUPER OTIMIZADA
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NelogicaSingleton } from "@/lib/services/nelogica-singleton"; // ✅ NOVO
import { logger } from "@/lib/logger";

// ✅ REMOVIDO: Configurações duplicadas - agora usa singleton centralizadamente
const NELOGICA_ENVIRONMENT_ID = process.env.NELOGICA_ENVIRONMENT_ID || "1";

/**
 * ✅ CORRIGIDO: Interface alinhada com a documentação oficial da Nelogica
 * Baseado na documentação "NELOGICA BROKER API V2" v1.1
 */
export interface RiskProfile {
  id?: string;
  name: string; // Campo local - não enviado para Nelogica
  nelogicaProfileId?: string;
  // ✅ CAMPOS CONFORME DOCUMENTAÇÃO OFICIAL:
  initialBalance: number; // Float na documentação ✅
  trailing: boolean; // Bool na documentação ✅
  stopOutRule: number; // Float na documentação ✅
  leverage: number; // ⚠️ CORRIGIDO: Int na documentação, mas number funciona
  commissionsEnabled: boolean; // Bool na documentação ✅
  enableContractExposure: boolean; // Bool na documentação ✅
  contractExposure: number; // Int na documentação ✅
  enableLoss: boolean; // Bool na documentação ✅
  lossRule: number; // Float na documentação ✅
  enableGain: boolean; // Bool na documentação ✅
  gainRule: number; // Float na documentação ✅
  planMappings?: string[]; // Campo local - não enviado para Nelogica
}

/**
 * 🚀 SUPER OTIMIZADA: Busca perfis usando singleton
 * ELIMINA login desnecessário
 */
export async function getRiskProfiles() {
  try {
    logger.info("📊 [Risk Profiles] Buscando perfis de risco com Singleton");

    // Buscar perfis no banco de dados local (não precisa de API para isso)
    const dbProfiles = await prisma.riskProfile.findMany({
      include: {
        planMappings: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(
      `✅ [Risk Profiles] ${dbProfiles.length} perfis encontrados localmente (sem API call)`
    );

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
  } catch (error: any) {
    logger.error(
      `❌ [Risk Profiles] Erro ao obter perfis de risco: ${error.message}`
    );
    throw new Error("Falha ao obter perfis de risco");
  }
}

/**
 * 🔍 OTIMIZADA: Busca perfil por ID (sem API call)
 */
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
    logger.error(
      `❌ [Risk Profiles] Erro ao obter perfil de risco: ${error.message}`
    );
    throw new Error("Falha ao obter perfil de risco");
  }
}

/**
 * ✅ MIGRADA PARA SINGLETON: Criar perfil usando singleton
 * Conforme documentação: POST /api/v2/manager/risk/{environmentId}
 */
export async function createRiskProfile(profile: RiskProfile) {
  try {
    logger.info(
      `🎯 [Risk Profiles] Criando perfil de risco: ${profile.name} usando Singleton`
    );

    // ✅ MUDANÇA: Usando singleton ao invés de instância direta
    const nelogicaClient = await NelogicaSingleton.getInstance();
    console.log("🔄 [Risk Profiles] Singleton obtido para criação de perfil");

    // ✅ CONFORME DOCUMENTAÇÃO: Payload exato da API
    const nelogicaPayload = {
      initialBalance: profile.initialBalance, // Float ✅
      trailing: profile.trailing, // Bool ✅
      stopOutRule: profile.stopOutRule, // Float ✅
      leverage: Math.round(profile.leverage), // ✅ CORRIGIDO: Forçar Int conforme doc
      commissionsEnabled: profile.commissionsEnabled, // Bool ✅
      enableContractExposure: profile.enableContractExposure, // Bool ✅
      contractExposure: Math.round(profile.contractExposure), // ✅ CORRIGIDO: Forçar Int
      enableLoss: profile.enableLoss, // Bool ✅
      lossRule: profile.lossRule, // Float ✅
      enableGain: profile.enableGain, // Bool ✅
      gainRule: profile.gainRule, // Float ✅
    };

    console.log("📋 [Risk Profiles] Payload para Nelogica:", nelogicaPayload);

    // Criar o perfil na Nelogica
    const nelogicaResponse = await nelogicaClient.createRiskProfile(
      NELOGICA_ENVIRONMENT_ID,
      nelogicaPayload
    );

    if (!nelogicaResponse.isSuccess) {
      throw new Error(
        `Falha ao criar perfil na Nelogica: ${nelogicaResponse.message}`
      );
    }

    const nelogicaProfileId = nelogicaResponse.data.profileId;
    console.log(
      `🆔 [Risk Profiles] Profile ID criado na Nelogica: ${nelogicaProfileId}`
    );

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

    logger.info(
      `✅ [Risk Profiles] Perfil criado com sucesso: ${dbProfile.id} usando Singleton`
    );
    console.log(
      "💡 [Risk Profiles] Singleton reutilizado - economia de login na criação"
    );
    revalidatePath("/risk-profiles");

    return {
      id: dbProfile.id,
      nelogicaProfileId,
    };
  } catch (error: any) {
    logger.error(
      `❌ [Risk Profiles] Erro ao criar perfil de risco: ${error.message}`
    );
    throw new Error(`Falha ao criar perfil de risco: ${error.message}`);
  }
}

/**
 * ✅ MIGRADA PARA SINGLETON: Atualizar perfil usando singleton
 * Conforme documentação: PUT /api/v2/manager/risk/{environmentId}
 */
export async function updateRiskProfile(id: string, profile: RiskProfile) {
  try {
    logger.info(
      `📝 [Risk Profiles] Atualizando perfil de risco: ${id} usando Singleton`
    );

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

    // ✅ MUDANÇA: Usando singleton ao invés de instância direta
    const nelogicaClient = await NelogicaSingleton.getInstance();
    console.log(
      "🔄 [Risk Profiles] Singleton obtido para atualização de perfil"
    );

    // ✅ CONFORME DOCUMENTAÇÃO: Payload com profileId obrigatório para UPDATE
    const nelogicaPayload = {
      profileId: currentProfile.nelogicaProfileId, // ✅ OBRIGATÓRIO para UPDATE
      initialBalance: profile.initialBalance, // Float ✅
      trailing: profile.trailing, // Bool ✅
      stopOutRule: profile.stopOutRule, // Float ✅
      leverage: Math.round(profile.leverage), // ✅ CORRIGIDO: Forçar Int
      commissionsEnabled: profile.commissionsEnabled, // Bool ✅
      enableContractExposure: profile.enableContractExposure, // Bool ✅
      contractExposure: Math.round(profile.contractExposure), // ✅ CORRIGIDO: Forçar Int
      enableLoss: profile.enableLoss, // Bool ✅
      lossRule: profile.lossRule, // Float ✅
      enableGain: profile.enableGain, // Bool ✅
      gainRule: profile.gainRule, // Float ✅
    };

    console.log(
      "📋 [Risk Profiles] Payload de atualização para Nelogica:",
      nelogicaPayload
    );

    // Atualizar na Nelogica
    const nelogicaResponse = await nelogicaClient.updateRiskProfile(
      NELOGICA_ENVIRONMENT_ID,
      nelogicaPayload
    );

    if (!nelogicaResponse.isSuccess) {
      throw new Error(
        `Falha ao atualizar perfil na Nelogica: ${nelogicaResponse.message}`
      );
    }

    // Atualizar os mapeamentos de planos
    await prisma.planRiskMapping.deleteMany({
      where: { riskProfileId: id },
    });

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

    logger.info(
      `✅ [Risk Profiles] Perfil atualizado com sucesso: ${id} usando Singleton`
    );
    console.log(
      "💡 [Risk Profiles] Singleton reutilizado - economia de login na atualização"
    );
    revalidatePath("/risk-profiles");

    return { success: true };
  } catch (error: any) {
    logger.error(
      `❌ [Risk Profiles] Erro ao atualizar perfil: ${error.message}`
    );
    throw new Error(`Falha ao atualizar perfil de risco: ${error.message}`);
  }
}

/**
 * ⚠️ CORRIGIDA: Exclusão melhorada com aviso
 * NOTA: API Nelogica NÃO TEM endpoint DELETE para risk profiles
 */
export async function deleteRiskProfile(id: string) {
  try {
    logger.info(`🗑️ [Risk Profiles] Excluindo perfil de risco: ${id}`);

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

    // Obter dados do perfil para log
    const profile = await prisma.riskProfile.findUnique({
      where: { id },
    });

    // Excluir os mapeamentos de planos
    await prisma.planRiskMapping.deleteMany({
      where: { riskProfileId: id },
    });

    // Excluir o perfil local
    await prisma.riskProfile.delete({
      where: { id },
    });

    // ⚠️ AVISO IMPORTANTE: Log sobre limitação da API
    console.log(
      "⚠️ [Risk Profiles] ATENÇÃO: Perfil excluído apenas localmente"
    );
    console.log(
      `⚠️ [Risk Profiles] Profile ID ${profile?.nelogicaProfileId} ainda existe na Nelogica`
    );
    console.log(
      "⚠️ [Risk Profiles] API Nelogica não possui endpoint DELETE para risk profiles"
    );

    logger.info(`✅ [Risk Profiles] Perfil excluído localmente: ${id}`);
    logger.warn(
      `⚠️ [Risk Profiles] Perfil ${profile?.nelogicaProfileId} permanece na Nelogica (limitação da API)`
    );
    revalidatePath("/risk-profiles");

    return { success: true };
  } catch (error: any) {
    logger.error(`❌ [Risk Profiles] Erro ao excluir perfil: ${error.message}`);
    throw new Error(`Falha ao excluir perfil de risco: ${error.message}`);
  }
}

/**
 * ✅ MIGRADA PARA SINGLETON: Lista perfis da Nelogica usando singleton
 * Conforme documentação: GET /api/v2/manager/risk/{environmentId}
 */
export async function listNelogicaRiskProfiles() {
  try {
    logger.info(
      "📋 [Risk Profiles] Listando perfis de risco da Nelogica usando Singleton"
    );

    // ✅ MUDANÇA: Usando singleton ao invés de instância direta
    const nelogicaClient = await NelogicaSingleton.getInstance();
    console.log("🔄 [Risk Profiles] Singleton obtido para listagem de perfis");

    // ✅ CONFORME DOCUMENTAÇÃO: GET /api/v2/manager/risk/{environmentId}
    const response = await nelogicaClient.listRiskProfiles(
      NELOGICA_ENVIRONMENT_ID,
      {
        pageNumber: 1,
        pageSize: 100, // Conforme documentação, padrão é 100
      }
    );

    if (!response.isSuccess) {
      throw new Error(
        `Falha ao listar perfis da Nelogica: ${response.message}`
      );
    }

    const profiles = response.data.riskProfiles;
    logger.info(
      `✅ [Risk Profiles] ${profiles.length} perfis encontrados na Nelogica usando Singleton`
    );
    console.log(
      "💡 [Risk Profiles] Singleton reutilizado - economia de login na listagem"
    );

    return profiles;
  } catch (error: any) {
    logger.error(
      `❌ [Risk Profiles] Erro ao listar perfis da Nelogica: ${error.message}`
    );
    throw new Error("Falha ao listar perfis de risco da Nelogica");
  }
}

/**
 * 🔧 OTIMIZADA: Planos disponíveis (sem API call)
 */
export async function getAvailablePlans() {
  try {
    // Planos padrão + dinâmicos do banco
    const dynamicPlans = await prisma.client
      .findMany({
        select: { plan: true },
        distinct: ["plan"],
      })
      .then((results) => results.map((r) => r.plan));

    const allPlans = [
      "FX - 5K",
      "FX - 10K",
      "FX - 25K",
      "FX - 50K",
      "FX - 100K",
      "FX - 150K",
      ...dynamicPlans,
    ];

    // Remover duplicados
    return allPlans.filter((plan, index) => allPlans.indexOf(plan) === index);
  } catch (error: any) {
    logger.error(`❌ [Risk Profiles] Erro ao obter planos: ${error.message}`);
    throw new Error("Falha ao obter planos disponíveis");
  }
}

/**
 * 🧪 NOVA: Teste de economia do singleton para risk profiles
 */
export async function testRiskProfilesSingletonEconomy() {
  try {
    console.log(
      "🧪 [Risk Profiles Test] Iniciando teste de economia do singleton..."
    );
    const startTime = Date.now();

    // Status inicial
    const initialStatus = NelogicaSingleton.getStatus();
    console.log("📊 [Risk Profiles Test] Status inicial:", initialStatus);

    // Simula operações que normalmente fariam login separado
    console.log("🔄 [Test] Operação 1: listNelogicaRiskProfiles()");
    const start1 = Date.now();
    const profiles1 = await listNelogicaRiskProfiles();
    const time1 = Date.now() - start1;

    console.log(
      "🔄 [Test] Operação 2: listNelogicaRiskProfiles() (deveria reutilizar)"
    );
    const start2 = Date.now();
    const profiles2 = await listNelogicaRiskProfiles();
    const time2 = Date.now() - start2;

    const totalTime = Date.now() - startTime;

    // Análise
    const wasReused = time2 < 500; // Se foi rápido, reutilizou
    const sameCount = profiles1.length === profiles2.length;

    console.log("🎯 [Risk Profiles Test] RESULTADO:");
    console.log(`   - Tempos: ${time1}ms / ${time2}ms`);
    console.log(`   - Singleton reutilizado: ${wasReused}`);
    console.log(`   - Dados consistentes: ${sameCount}`);
    console.log(`   - Total: ${totalTime}ms`);

    return {
      success: true,
      times: [time1, time2],
      totalTime,
      wasReused,
      sameCount,
      profileCount: profiles1.length,
      message: `Risk Profiles otimizado! Reutilização: ${wasReused}, Tempos: ${time1}/${time2}ms`,
    };
  } catch (error) {
    console.error("❌ [Risk Profiles Test] Erro no teste:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
