/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/nelogica-test/_components/proxy-status.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Shield,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProxyInfo {
  enabled: boolean;
  provider: string;
  host?: string;
  port?: string;
  status: string;
  maskedUrl?: string;
  error?: string;
}

interface IPInfo {
  ip: string;
  provider?: string;
  country?: string;
  city?: string;
  timezone?: string;
}

export function ProxyStatus(): JSX.Element {
  const [proxyInfo, setProxyInfo] = useState<ProxyInfo | null>(null);
  const [currentIP, setCurrentIP] = useState<IPInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { toast } = useToast();

  // Verificar status do proxy ao montar o componente
  useEffect(() => {
    checkProxyStatus();
  }, []);

  /**
   * Verifica o status do proxy (apenas lado do cliente)
   */
  const checkProxyStatus = async (): Promise<void> => {
    try {
      // Verificar variáveis de ambiente do cliente
      const fixieUrl = process.env.NEXT_PUBLIC_FIXIE_URL;

      let proxyData: ProxyInfo = {
        enabled: !!fixieUrl,
        provider: fixieUrl ? "Fixie" : "none",
        status: fixieUrl ? "active" : "disabled",
      };

      if (fixieUrl) {
        try {
          const url = new URL(fixieUrl);
          proxyData = {
            ...proxyData,
            host: url.hostname,
            port: url.port || "80",
            maskedUrl: fixieUrl.replace(/:[^:@]*@/, ":****@"),
          };
        } catch (error) {
          proxyData = {
            ...proxyData,
            status: "error",
            error: "URL inválida",
          };
        }
      }

      setProxyInfo(proxyData);
      console.log("🔧 [ProxyStatus/Cliente] Status do proxy:", proxyData);
    } catch (error) {
      console.error(
        "❌ [ProxyStatus] Erro ao verificar status do proxy:",
        error
      );
    }
  };

  /**
   * Testa o IP atual fazendo chamada para API route
   */
  const testCurrentIP = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("🔍 [ProxyStatus] Testando IP atual via API...");

      // Fazer requisição para nossa API route
      const response = await fetch("/api/test-ip");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setCurrentIP(data.ipInfo);
        setLastChecked(new Date());

        toast({
          title: "IP Verificado",
          description: `Seu IP atual é: ${data.ipInfo.ip}`,
        });

        console.log("✅ [ProxyStatus] IP obtido:", data.ipInfo);
      } else {
        throw new Error(data.error || "Falha ao obter IP");
      }
    } catch (error: any) {
      console.error("❌ [ProxyStatus] Erro ao testar IP:", error);

      let errorMessage = "Não foi possível obter o IP atual.";

      // Mensagens de erro mais específicas
      if (error.message.includes("HTTP 500")) {
        errorMessage = "Erro no servidor. Verifique os logs do console.";
      } else if (error.message.includes("fetch")) {
        errorMessage = "Erro de conexão. Verifique sua internet.";
      }

      toast({
        title: "Erro ao verificar IP",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copia IP para clipboard
   */
  const copyIPToClipboard = async (): Promise<void> => {
    if (currentIP?.ip) {
      try {
        await navigator.clipboard.writeText(currentIP.ip);
        toast({
          title: "IP Copiado",
          description: "IP foi copiado para a área de transferência.",
        });
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o IP.",
          variant: "destructive",
        });
      }
    }
  };

  /**
   * Obtém o status visual baseado no proxy
   */
  const getProxyStatusDisplay = () => {
    if (!proxyInfo) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10 border-yellow-500/20",
        status: "Verificando...",
        description: "Obtendo informações do proxy",
      };
    }

    if (proxyInfo.enabled && proxyInfo.status === "active") {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        color: "text-green-500",
        bgColor: "bg-green-500/10 border-green-500/20",
        status: "Proxy Ativo",
        description: `Usando ${proxyInfo.provider} - IP fixo garantido`,
      };
    }

    if (proxyInfo.enabled && proxyInfo.status === "error") {
      return {
        icon: <XCircle className="h-4 w-4" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10 border-red-500/20",
        status: "Erro no Proxy",
        description: proxyInfo.error || "Configuração inválida",
      };
    }

    return {
      icon: <XCircle className="h-4 w-4" />,
      color: "text-gray-500",
      bgColor: "bg-gray-500/10 border-gray-500/20",
      status: "Proxy Desabilitado",
      description: "Usando conexão direta - IP dinâmico",
    };
  };

  const statusDisplay = getProxyStatusDisplay();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card do Status do Proxy */}
      <Card
        className={`${statusDisplay.bgColor} border transition-all duration-200`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={statusDisplay.color}>{statusDisplay.icon}</div>
              <span className="text-zinc-100">Status do Proxy</span>
            </div>
            <Badge
              variant={proxyInfo?.enabled ? "default" : "secondary"}
              className="text-xs"
            >
              {proxyInfo?.enabled ? "Habilitado" : "Desabilitado"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-medium text-zinc-300">
              {statusDisplay.status}
            </div>
            <div className="text-xs text-zinc-500">
              {statusDisplay.description}
            </div>
          </div>

          {proxyInfo?.enabled && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500">Provedor:</span>
                  <div className="font-medium text-zinc-300">
                    {proxyInfo.provider}
                  </div>
                </div>
                {proxyInfo.host && (
                  <div>
                    <span className="text-zinc-500">Host:</span>
                    <div className="font-medium text-zinc-300">
                      {proxyInfo.host}:{proxyInfo.port}
                    </div>
                  </div>
                )}
              </div>

              {proxyInfo.maskedUrl && (
                <div className="pt-1">
                  <span className="text-zinc-500 text-xs">URL:</span>
                  <div className="font-mono text-xs text-zinc-300 break-all">
                    {proxyInfo.maskedUrl}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={checkProxyStatus}
            className="w-full mt-3"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Verificar Status
          </Button>
        </CardContent>
      </Card>

      {/* Card do IP Atual */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-zinc-100">IP Atual</span>
            </div>
            <Badge
              variant={currentIP ? "default" : "secondary"}
              className="text-xs"
            >
              {currentIP ? "Detectado" : "Não testado"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentIP ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-mono text-lg font-bold text-zinc-100">
                  {currentIP.ip}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyIPToClipboard}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {(currentIP.provider || currentIP.country) && (
                <div className="grid grid-cols-1 gap-1 text-xs pt-2 border-t border-zinc-800">
                  {currentIP.provider && (
                    <div>
                      <span className="text-zinc-500">Provedor:</span>
                      <span className="ml-2 text-zinc-300">
                        {currentIP.provider}
                      </span>
                    </div>
                  )}
                  {currentIP.country && (
                    <div>
                      <span className="text-zinc-500">Localização:</span>
                      <span className="ml-2 text-zinc-300">
                        {currentIP.city ? `${currentIP.city}, ` : ""}
                        {currentIP.country}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {lastChecked && (
                <div className="text-xs text-zinc-500">
                  Verificado em: {lastChecked.toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-zinc-500 text-sm mb-2">
                IP não verificado
              </div>
              <div className="text-zinc-600 text-xs">
                Clique no botão abaixo para testar
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={testCurrentIP}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
            ) : (
              <Globe className="h-3 w-3 mr-2" />
            )}
            {isLoading ? "Testando..." : "Testar IP"}
          </Button>

          {proxyInfo?.enabled && currentIP && (
            <div className="pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Para Nelogica:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const subject = encodeURIComponent("Liberação de IP");
                    const body = encodeURIComponent(
                      `Solicito liberação do IP: ${currentIP.ip}`
                    );
                    window.open(
                      `mailto:suporte@nelogica.com?subject=${subject}&body=${body}`,
                      "_blank"
                    );
                  }}
                  className="h-6 text-xs text-blue-400 hover:text-blue-300"
                >
                  Solicitar Liberação
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
