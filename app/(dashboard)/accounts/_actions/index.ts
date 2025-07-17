/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/accounts/_actions/index.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NelogicaApiClient } from "@/lib/services/nelogica-api-client";
import { logger } from "@/lib/logger";

// Configurações da API Nelogica
const NELOGICA_API_URL =
  process.env.NELOGICA_API_URL || "https://api-broker4-v2.nelogica.com.br";
const NELOGICA_USERNAME =
  process.env.NELOGICA_USERNAME || "tradersHouse.hml@nelogica";
const NELOGICA_PASSWORD =
  process.env.NELOGICA_PASSWORD || "OJOMy4miz63YLFwOM27ZGTO5n";

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
 * Obtém todas as contas Nelogica
 */
export async function getAccounts() {
  try {
    logger.info("Buscando contas na Nelogica");

    // Instancia o cliente da API Nelogica
    const nelogicaClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    // Busca as assinaturas na API da Nelogica (que contêm as contas)
    const subscriptionsResponse = await nelogicaClient.listSubscriptions();

    if (!subscriptionsResponse.isSuccess) {
      throw new Error(
        `Falha ao obter assinaturas: ${subscriptionsResponse.message}`
      );
    }

    // Extrair todas as contas de todas as assinaturas
    const accounts: NelogicaAccount[] = [];

    for (const subscription of subscriptionsResponse.data.subscriptions) {
      if (!subscription.accounts || !Array.isArray(subscription.accounts)) {
        continue;
      }

      // Busca o cliente correspondente no banco local
      const client = await prisma.client.findFirst({
        where: { nelogicaSubscriptionId: subscription.subscriptionId },
      });

      // Adiciona cada conta ao array de contas
      for (const account of subscription.accounts) {
        // A API da Nelogica não fornece um endpoint direto para verificar se uma conta está bloqueada
        // Assumimos que não está bloqueada por padrão
        // Se necessário, o status será atualizado através das operações de block/unblock
        const isBlocked = false;

        accounts.push({
          account: account.account,
          name: account.name,
          licenseId: subscription.licenseId,
          profileId: account.profileId,
          validatedAt: account.validadedAt,
          isBlocked: isBlocked,
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
        });
      }
    }

    logger.info(`${accounts.length} contas encontradas`);
    return accounts;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao obter contas: ${errorMsg}`);
    throw new Error("Falha ao obter contas da Nelogica");
  }
}

/**
 * Bloqueia uma conta Nelogica
 */
export async function blockAccount(licenseId: string, account: string) {
  try {
    logger.info(`Bloqueando conta ${account}`);

    // Instancia o cliente da API Nelogica
    const nelogicaClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    // Bloqueia a conta na Nelogica
    const response = await nelogicaClient.blockAccount(licenseId, account);

    if (!response.isSuccess) {
      throw new Error(`Falha ao bloquear conta: ${response.message}`);
    }

    // Atualiza o registro do cliente local se necessário
    const client = await prisma.client.findFirst({
      where: { nelogicaAccount: account },
    });

    if (client) {
      // Opcionalmente podemos atualizar algum status no cliente local
      // dependendo das necessidades do projeto
      logger.info(`Cliente encontrado para a conta ${account}: ${client.name}`);
    }

    logger.info(`Conta ${account} bloqueada com sucesso`);
    revalidatePath("/accounts");

    return { success: true, isBlocked: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao bloquear conta: ${errorMsg}`);
    throw new Error(`Falha ao bloquear conta na Nelogica: ${errorMsg}`);
  }
}

/**
 * Desbloqueia uma conta Nelogica
 */
export async function unblockAccount(licenseId: string, account: string) {
  try {
    logger.info(`Desbloqueando conta ${account}`);

    // Instancia o cliente da API Nelogica
    const nelogicaClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    // Desbloqueia a conta na Nelogica
    const response = await nelogicaClient.unblockAccount(licenseId, account);

    if (!response.isSuccess) {
      throw new Error(`Falha ao desbloquear conta: ${response.message}`);
    }

    // Atualiza o registro do cliente local se necessário
    const client = await prisma.client.findFirst({
      where: { nelogicaAccount: account },
    });

    if (client) {
      // Opcionalmente podemos atualizar algum status no cliente local
      // dependendo das necessidades do projeto
      logger.info(`Cliente encontrado para a conta ${account}: ${client.name}`);
    }

    logger.info(`Conta ${account} desbloqueada com sucesso`);
    revalidatePath("/accounts");

    return { success: true, isBlocked: false };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao desbloquear conta: ${errorMsg}`);
    throw new Error(`Falha ao desbloquear conta na Nelogica: ${errorMsg}`);
  }
}

/**
 * Remove uma conta Nelogica
 */
export async function removeAccount(licenseId: string, account: string) {
  try {
    logger.info(`Removendo conta ${account}`);

    // Instancia o cliente da API Nelogica
    const nelogicaClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    // Remove a conta na Nelogica
    const response = await nelogicaClient.removeAccount(licenseId, account);

    if (!response.isSuccess) {
      throw new Error(`Falha ao remover conta: ${response.message}`);
    }

    // Atualiza o registro do cliente local se necessário
    const client = await prisma.client.findFirst({
      where: { nelogicaAccount: account },
    });

    if (client) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          nelogicaAccount: null,
        },
      });
      logger.info(`Registro local do cliente ${client.name} atualizado`);
    }

    logger.info(`Conta ${account} removida com sucesso`);
    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao remover conta: ${errorMsg}`);
    throw new Error(`Falha ao remover conta na Nelogica: ${errorMsg}`);
  }
}

/**
 * Define o perfil de risco para uma conta
 */
export async function setAccountRiskProfile(
  licenseId: string,
  account: string,
  profileId: string,
  accountType: number = 0
) {
  try {
    logger.info(
      `Configurando perfil de risco ${profileId} para conta ${account}`
    );

    // Instancia o cliente da API Nelogica
    const nelogicaClient = new NelogicaApiClient(
      NELOGICA_API_URL,
      NELOGICA_USERNAME,
      NELOGICA_PASSWORD
    );

    // Define o perfil de risco na Nelogica
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
      `Perfil de risco ${profileId} configurado com sucesso para conta ${account}`
    );
    revalidatePath("/accounts");

    return { success: true, profileId, accountType };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao configurar perfil de risco: ${errorMsg}`);
    throw new Error(
      `Falha ao configurar perfil de risco na Nelogica: ${errorMsg}`
    );
  }
}
