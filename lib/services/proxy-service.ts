/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/proxy-service.ts
/**
 * Serviço para gerenciar configuração de proxy
 * Compatível tanto com servidor quanto cliente
 */
export class ProxyService {
  private static instance: ProxyService;
  private fixieUrl: string | null = null;
  private isProxyEnabled: boolean = false;

  private constructor() {
    this.initializeProxy();
  }

  public static getInstance(): ProxyService {
    if (!ProxyService.instance) {
      ProxyService.instance = new ProxyService();
    }
    return ProxyService.instance;
  }

  /**
   * Método estático para uso direto no servidor
   */
  public static getServerInstance(): ProxyService {
    return new ProxyService();
  }

  /**
   * Inicializa a configuração do proxy
   */
  private initializeProxy(): void {
    // Verifica se estamos no servidor (Node.js) ou no cliente
    if (typeof window === "undefined") {
      // Servidor - pode acessar process.env diretamente
      this.fixieUrl = process.env.FIXIE_URL || null;
    } else {
      // Cliente - usa variáveis públicas
      this.fixieUrl = process.env.NEXT_PUBLIC_FIXIE_URL || null;
    }

    this.isProxyEnabled = !!this.fixieUrl;

    const environment = typeof window === "undefined" ? "servidor" : "cliente";

    if (this.isProxyEnabled) {
      console.log(
        `🔄 [ProxyService/${environment}] Proxy Fixie detectado e habilitado`
      );
      console.log(
        `🔗 [ProxyService/${environment}] URL do proxy:`,
        this.getMaskedUrl()
      );
    } else {
      console.log(
        `⚠️  [ProxyService/${environment}] Proxy não configurado - usando conexão direta`
      );
    }
  }

  /**
   * Retorna URL mascarada para logs (segurança)
   */
  private getMaskedUrl(): string {
    if (!this.fixieUrl) return "N/A";

    try {
      const url = new URL(this.fixieUrl);
      return `${url.protocol}//${url.username}:****@${url.hostname}:${url.port}`;
    } catch {
      return "URL inválida";
    }
  }

  /**
   * Verifica se o proxy está habilitado
   */
  public isEnabled(): boolean {
    return this.isProxyEnabled;
  }

  /**
   * Obtém a configuração do proxy para Axios
   */
  public getAxiosProxyConfig(): any {
    if (!this.isProxyEnabled || !this.fixieUrl) {
      return null;
    }

    try {
      const url = new URL(this.fixieUrl);

      return {
        protocol: "http",
        host: url.hostname,
        port: parseInt(url.port) || 80,
        auth: {
          username: url.username || "fixie",
          password: url.password || "",
        },
      };
    } catch (error) {
      console.error("❌ [ProxyService] Erro ao parsear URL do Fixie:", error);
      return null;
    }
  }

  /**
   * Obtém informações do proxy para logs
   */
  public getProxyInfo(): any {
    if (!this.isProxyEnabled) {
      return {
        enabled: false,
        provider: "none",
        status: "disabled",
      };
    }

    try {
      const url = new URL(this.fixieUrl!);
      return {
        enabled: true,
        provider: "Fixie",
        host: url.hostname,
        port: url.port || "80",
        status: "active",
        maskedUrl: this.getMaskedUrl(),
      };
    } catch {
      return {
        enabled: false,
        provider: "Fixie",
        status: "error",
        error: "URL inválida",
      };
    }
  }

  /**
   * Força recarregamento da configuração
   */
  public reload(): void {
    this.initializeProxy();
  }
}

/**
 * Função utilitária para obter configuração do proxy no servidor
 */
export function getServerProxyConfig() {
  const fixieUrl = process.env.FIXIE_URL;

  if (!fixieUrl) {
    return {
      enabled: false,
      config: null,
      info: {
        enabled: false,
        provider: "none",
        status: "disabled",
      },
    };
  }

  try {
    const url = new URL(fixieUrl);

    const config = {
      protocol: "http",
      host: url.hostname,
      port: parseInt(url.port) || 80,
      auth: {
        username: url.username || "fixie",
        password: url.password || "",
      },
    };

    const info = {
      enabled: true,
      provider: "Fixie",
      host: url.hostname,
      port: url.port || "80",
      status: "active",
      maskedUrl: fixieUrl.replace(/:[^:@]*@/, ":****@"),
    };

    return {
      enabled: true,
      config,
      info,
    };
  } catch (error) {
    console.error(
      "❌ [getServerProxyConfig] Erro ao parsear FIXIE_URL:",
      error
    );
    return {
      enabled: false,
      config: null,
      info: {
        enabled: false,
        provider: "Fixie",
        status: "error",
        error: "URL inválida",
      },
    };
  }
}
