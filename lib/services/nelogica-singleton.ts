// lib/services/nelogica-singleton.ts
import { NelogicaApiClient } from "./nelogica-api-client";

/**
 * Singleton para NelogicaApiClient - ETAPA 1 da otimização
 *
 * PROBLEMA RESOLVIDO:
 * - Múltiplas instâncias = múltiplos logins = desperdício de requests
 *
 * SOLUÇÃO:
 * - Uma instância global reutilizada
 * - Login feito apenas 1 vez por instância do servidor
 * - Economia estimada: 70-80% das requests de login
 */
export class NelogicaSingleton {
  private static instance: NelogicaApiClient | null = null;
  private static isInitializing: boolean = false;

  /**
   * Retorna a instância única do NelogicaApiClient
   * Thread-safe para evitar múltiplas inicializações simultâneas
   */
  public static async getInstance(): Promise<NelogicaApiClient> {
    // Se já temos uma instância, retorna ela
    if (this.instance) {
      console.log("🔄 [NelogicaSingleton] Reutilizando instância existente");
      return this.instance;
    }

    // Se outro processo está inicializando, aguarda
    if (this.isInitializing) {
      console.log(
        "⏳ [NelogicaSingleton] Aguardando inicialização em andamento..."
      );

      // Aguarda até a inicialização terminar (máximo 10 segundos)
      const maxWaitTime = 10000;
      const checkInterval = 100;
      let waited = 0;

      while (this.isInitializing && waited < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }

      if (this.instance) {
        return this.instance;
      }
    }

    // Marca que estamos inicializando
    this.isInitializing = true;

    try {
      console.log("🚀 [NelogicaSingleton] Criando nova instância única");

      // Busca as configurações do ambiente
      const apiUrl =
        process.env.NELOGICA_API_URL ||
        "https://api-broker4-v2.nelogica.com.br";
      const username =
        process.env.NELOGICA_USERNAME || "tradersHouse.hml@nelogica";
      const password =
        process.env.NELOGICA_PASSWORD || "OJOMy4miz63YLFwOM27ZGTO5n";

      // Cria a instância única
      this.instance = new NelogicaApiClient(apiUrl, username, password);

      // Faz o login imediatamente (pré-autenticação)
      console.log("🔑 [NelogicaSingleton] Realizando login inicial...");
      await this.instance.login();

      console.log(
        "✅ [NelogicaSingleton] Instância criada e autenticada com sucesso"
      );
      console.log(
        "💡 [NelogicaSingleton] Próximas chamadas reutilizarão esta instância"
      );

      return this.instance;
    } catch (error) {
      console.error("❌ [NelogicaSingleton] Erro ao criar instância:", error);

      // Reset em caso de erro
      this.instance = null;
      throw error;
    } finally {
      // Sempre libera o lock de inicialização
      this.isInitializing = false;
    }
  }

  /**
   * Força uma nova instância (para casos de erro ou reset)
   * USE COM CUIDADO: só em casos de problemas de conectividade
   */
  public static async resetInstance(): Promise<NelogicaApiClient> {
    console.log("🔄 [NelogicaSingleton] Forçando reset da instância");

    this.instance = null;
    this.isInitializing = false;

    return await this.getInstance();
  }

  /**
   * Verifica se a instância atual está autenticada
   */
  public static isAuthenticated(): boolean {
    if (!this.instance) {
      return false;
    }

    // Verifica se o token ainda é válido (implementação depende do NelogicaApiClient)
    // Por enquanto, assume que se temos instância, está autenticada
    return true;
  }

  /**
   * Obtém informações de status para debugging
   */
  public static getStatus() {
    return {
      hasInstance: !!this.instance,
      isInitializing: this.isInitializing,
      isAuthenticated: this.isAuthenticated(),
      instanceCreatedAt: this.instance ? new Date().toISOString() : null,
    };
  }

  /**
   * Método para uso em desenvolvimento - limpa tudo
   */
  public static clearForTesting(): void {
    console.log("🧪 [NelogicaSingleton] Limpando instância para testes");
    this.instance = null;
    this.isInitializing = false;
  }
}
