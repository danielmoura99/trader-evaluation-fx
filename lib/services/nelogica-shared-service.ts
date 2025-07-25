/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/nelogica-shared-service.ts
/**
 * Serviço compartilhado para eliminar duplicação de requests
 * OTIMIZAÇÃO: Uma única chamada para subscriptions serve ambas as páginas
 */

import { NelogicaSingleton } from "./nelogica-singleton";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Cache em memória para evitar múltiplas chamadas na mesma sessão
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live em ms
}

class NelogicaSharedService {
  private static cache = new Map<string, CacheEntry>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * 🚀 MÉTODO PRINCIPAL: Busca subscriptions com cache inteligente
   * Elimina chamadas duplicadas dentro do mesmo período
   */
  static async getSubscriptionsWithCache(
    options: {
      forceRefresh?: boolean;
      ttl?: number;
    } = {}
  ): Promise<any[]> {
    const cacheKey = "subscriptions";
    const ttl = options.ttl || this.DEFAULT_TTL;

    // Verifica cache primeiro (se não for refresh forçado)
    if (!options.forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const isValid = Date.now() - cached.timestamp < cached.ttl;

      if (isValid) {
        console.log("🔄 [SharedService] Reutilizando subscriptions do cache");
        return cached.data;
      } else {
        console.log("⏰ [SharedService] Cache expirado, removendo...");
        this.cache.delete(cacheKey);
      }
    }

    console.log(
      "🌐 [SharedService] Buscando subscriptions da API (cache miss ou refresh)"
    );

    try {
      // ✅ USA SINGLETON - uma única autenticação
      const nelogicaClient = await NelogicaSingleton.getInstance();

      // Uma única chamada para subscriptions
      const subscriptionsResponse = await nelogicaClient.listSubscriptions({
        pageNumber: 1,
        pageSize: 1000,
      });

      if (!subscriptionsResponse.isSuccess) {
        throw new Error(
          `Falha ao obter assinaturas: ${subscriptionsResponse.message}`
        );
      }

      const subscriptions = subscriptionsResponse.data.subscriptions;

      // Armazena no cache
      this.cache.set(cacheKey, {
        data: subscriptions,
        timestamp: Date.now(),
        ttl,
      });

      console.log(
        `✅ [SharedService] ${subscriptions.length} subscriptions carregadas e cacheadas`
      );
      return subscriptions;
    } catch (error) {
      logger.error("❌ [SharedService] Erro ao buscar subscriptions:");
      throw error;
    }
  }

  /**
   * 🏦 CONTAS: Extrai contas das subscriptions (sem nova API call)
   */
  static async getAccountsFromSubscriptions(
    options: {
      forceRefresh?: boolean;
    } = {}
  ): Promise<any[]> {
    console.log("🏦 [SharedService] Extraindo contas das subscriptions...");

    // Reutiliza as subscriptions (com cache)
    const subscriptions = await this.getSubscriptionsWithCache(options);

    const accounts: any[] = [];

    for (const subscription of subscriptions) {
      if (!subscription.accounts || !Array.isArray(subscription.accounts)) {
        continue;
      }

      // Busca cliente local (apenas 1 query por subscription)
      const client = await prisma.client.findFirst({
        where: { nelogicaSubscriptionId: subscription.subscriptionId },
      });

      // Adiciona cada conta
      for (const account of subscription.accounts) {
        accounts.push({
          account: account.account,
          name: account.name,
          licenseId: subscription.licenseId,
          profileId: account.profileId,
          validatedAt: account.validadedAt,
          isBlocked: false, // Default - será atualizado conforme necessário
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

    console.log(
      `✅ [SharedService] ${accounts.length} contas extraídas (0 API calls extras)`
    );
    return accounts;
  }

  /**
   * 📋 SUBSCRIPTIONS: Enriquece subscriptions com dados locais
   */
  static async getEnrichedSubscriptions(
    options: {
      forceRefresh?: boolean;
    } = {}
  ): Promise<any[]> {
    console.log(
      "📋 [SharedService] Enriquecendo subscriptions com dados locais..."
    );

    // Reutiliza as subscriptions (com cache)
    const subscriptions = await this.getSubscriptionsWithCache(options);

    // Enriquece com dados do banco local
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (subscription) => {
        const client = await prisma.client.findFirst({
          where: { nelogicaSubscriptionId: subscription.subscriptionId },
        });

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
      })
    );

    console.log(
      `✅ [SharedService] ${enrichedSubscriptions.length} subscriptions enriquecidas`
    );
    return enrichedSubscriptions;
  }

  /**
   * 🧹 LIMPEZA: Remove cache manualmente
   */
  static clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`🧹 [SharedService] Cache limpo para: ${key}`);
    } else {
      this.cache.clear();
      console.log("🧹 [SharedService] Todo cache limpo");
    }
  }

  /**
   * 📊 STATUS: Informações do cache para debug
   */
  static getCacheStatus(): any {
    const status: any = {};

    for (const [key, entry] of Array.from(this.cache.entries())) {
      const age = Date.now() - entry.timestamp;
      const remaining = entry.ttl - age;

      status[key] = {
        age: `${Math.round(age / 1000)}s`,
        remaining:
          remaining > 0 ? `${Math.round(remaining / 1000)}s` : "expirado",
        valid: remaining > 0,
      };
    }

    return status;
  }
}

export { NelogicaSharedService };
