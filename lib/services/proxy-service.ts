/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/proxy-service.ts
"use client";

/**
 * Serviço para gerenciar configuração de proxy
 * Centraliza a lógica de proxy para todas as requisições HTTP
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
   * Inicializa a configuração do proxy
   */
  private initializeProxy(): void {
    // Verifica se estamos no servidor (Node.js) ou no cliente
    if (typeof window === "undefined") {
      // Servidor - pode acessar process.env
      this.fixieUrl = process.env.FIXIE_URL || null;
    } else {
      // Cliente - precisa usar variáveis públicas
      this.fixieUrl = process.env.NEXT_PUBLIC_FIXIE_URL || null;
    }

    this.isProxyEnabled = !!this.fixieUrl;

    if (this.isProxyEnabled) {
      console.log("🔄 [ProxyService] Proxy Fixie detectado e habilitado");
      console.log("🔗 [ProxyService] URL do proxy:", this.getMaskedUrl());
    } else {
      console.log(
        "⚠️  [ProxyService] Proxy não configurado - usando conexão direta"
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
