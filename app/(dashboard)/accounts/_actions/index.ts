// app/(dashboard)/accounts/_actions/index.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NelogicaService } from "@/lib/services/nelogica-service";
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
  isBlocked?: boolean;
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

    // Instancia o serviço Nelogica
    const nelogicaService = new NelogicaService();

    // Busca as assinaturas na API da Nelogica (que contêm as contas)
    const subscriptions = await nelogicaService.listSubscriptions();

    // Extrair todas as contas de todas as assinaturas
    const accounts: NelogicaAccount[] = [];

    for (const subscription of subscriptions) {
      if (!subscription.accounts || !Array.isArray(subscription.accounts)) {
        continue;
      }

      // Busca o cliente correspondente no banco local
      const client = await prisma.client.findFirst({
        where: { nelogicaSubscriptionId: subscription.subscriptionId },
      });

      // Adiciona cada conta ao array de contas
      for (const account of subscription.accounts || []) {
        accounts.push({
          account: account.account,
          name: account.name,
          licenseId: subscription.licenseId,
          profileId: account.profileId,
          validatedAt: account.validadedAt,
          // Status de bloqueio não está disponível diretamente na API, verificaremos o status mais tarde
          isBlocked: false,
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

    // Instancia o serviço Nelogica
    const nelogicaService = new NelogicaService();

    // Bloqueia a conta na Nelogica
    await nelogicaService.blockAccount(licenseId, account);

    logger.info(`Conta ${account} bloqueada com sucesso`);
    revalidatePath("/accounts");

    return { success: true };
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

    // Instancia o serviço Nelogica
    const nelogicaService = new NelogicaService();

    // Desbloqueia a conta na Nelogica
    await nelogicaService.unblockAccount(licenseId, account);

    logger.info(`Conta ${account} desbloqueada com sucesso`);
    revalidatePath("/accounts");

    return { success: true };
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

    // Instancia o serviço Nelogica
    const nelogicaService = new NelogicaService();

    // Remove a conta na Nelogica
    await nelogicaService.removeAccount(licenseId, account);

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
 * Obtém detalhes da conta
 */
export async function getAccountDetails(licenseId: string, account: string) {
  try {
    logger.info(`Obtendo detalhes da conta ${account}`);

    // Instancia o serviço Nelogica
    const nelogicaService = new NelogicaService();

    // Lista assinaturas para encontrar a assinatura que contém a conta
    const subscriptions = await nelogicaService.listSubscriptions();

    // Encontra a assinatura correspondente
    const subscription = subscriptions.find(
      (sub) =>
        sub.licenseId === licenseId &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sub.accounts?.some((acc: any) => acc.account === account)
    );

    if (!subscription) {
      throw new Error(`Conta ${account} não encontrada`);
    }

    // Encontrar a conta específica
    const accountData = subscription.accounts?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc: any) => acc.account === account
    );

    if (!accountData) {
      throw new Error(`Conta ${account} não encontrada`);
    }

    // Busca o cliente correspondente no banco local
    const client = await prisma.client.findFirst({
      where: {
        OR: [{ nelogicaAccount: account }, { nelogicaLicenseId: licenseId }],
      },
    });

    // Montar objeto de retorno
    const result = {
      ...accountData,
      licenseId,
      subscriptionId: subscription.subscriptionId,
      customerId: subscription.customerId,
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

    logger.info(`Detalhes da conta ${account} obtidos com sucesso`);
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Erro ao obter detalhes da conta: ${errorMsg}`);
    throw new Error(
      `Falha ao obter detalhes da conta na Nelogica: ${errorMsg}`
    );
  }
}
