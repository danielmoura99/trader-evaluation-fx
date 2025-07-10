/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/test-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ProxyService } from "@/lib/services/proxy-service";

/**
 * API Route para testar o IP atual da aplicação
 * Mostra se o proxy está funcionando corretamente
 */
export async function GET(req: NextRequest) {
  const requestId = `testip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`🔍 [${requestId}] ===== TESTE DE IP =====`);

    // Obter informações do proxy
    const proxyService = ProxyService.getInstance();
    const proxyInfo = proxyService.getProxyInfo();

    console.log(`🔧 [${requestId}] Status do proxy:`, proxyInfo);

    // Configurar axios com proxy se disponível
    const axios = require("axios");
    const axiosConfig: any = {
      timeout: 10000,
      headers: {
        "User-Agent": "TradersHouse-IP-Test/1.0",
      },
    };

    // Adicionar proxy se habilitado
    if (proxyService.isEnabled()) {
      const proxyConfig = proxyService.getAxiosProxyConfig();
      if (proxyConfig) {
        axiosConfig.proxy = proxyConfig;
        console.log(
          `🔄 [${requestId}] Usando proxy: ${proxyConfig.host}:${proxyConfig.port}`
        );
      }
    } else {
      console.log(`🔄 [${requestId}] Usando conexão direta`);
    }

    // Testar com múltiplos serviços para maior confiabilidade
    const ipServices = [
      "https://httpbin.org/ip",
      "https://api.ipify.org?format=json",
      "https://ipinfo.io/json",
    ];

    let ipInfo = null;
    let lastError = null;

    for (const service of ipServices) {
      try {
        console.log(`🌐 [${requestId}] Testando serviço: ${service}`);

        const startTime = Date.now();
        const response = await axios.get(service, axiosConfig);
        const duration = Date.now() - startTime;

        console.log(
          `✅ [${requestId}] Resposta em ${duration}ms:`,
          response.data
        );

        // Processar resposta baseada no serviço
        if (service.includes("httpbin.org")) {
          ipInfo = {
            ip:
              response.data.origin?.split(",")[0]?.trim() ||
              response.data.origin,
            provider: proxyInfo.enabled ? proxyInfo.provider : "Conexão Direta",
            service: "httpbin.org",
          };
        } else if (service.includes("ipify.org")) {
          ipInfo = {
            ip: response.data.ip,
            provider: proxyInfo.enabled ? proxyInfo.provider : "Conexão Direta",
            service: "ipify.org",
          };
        } else if (service.includes("ipinfo.io")) {
          ipInfo = {
            ip: response.data.ip,
            provider: proxyInfo.enabled ? proxyInfo.provider : "Conexão Direta",
            country: response.data.country,
            city: response.data.city,
            region: response.data.region,
            timezone: response.data.timezone,
            org: response.data.org,
            service: "ipinfo.io",
          };
        }

        if (ipInfo?.ip) {
          console.log(`🎯 [${requestId}] IP detectado: ${ipInfo.ip}`);
          break; // Sucesso, sair do loop
        }
      } catch (error: any) {
        console.error(
          `❌ [${requestId}] Erro no serviço ${service}:`,
          error.message
        );
        lastError = error;
        continue; // Tentar próximo serviço
      }
    }

    if (!ipInfo?.ip) {
      throw lastError || new Error("Nenhum serviço de IP respondeu");
    }

    // Adicionar informações do proxy ao resultado
    const result = {
      success: true,
      ipInfo: {
        ...ipInfo,
        timestamp: new Date().toISOString(),
        proxyUsed: proxyInfo.enabled,
        proxyProvider: proxyInfo.enabled ? proxyInfo.provider : null,
        proxyStatus: proxyInfo.status,
      },
      proxyInfo: proxyInfo,
      requestId: requestId,
    };

    console.log(`🎉 [${requestId}] Teste concluído com sucesso`);
    console.log(`🔍 [${requestId}] ===== FIM TESTE IP =====`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`❌ [${requestId}] ===== ERRO NO TESTE IP =====`);
    console.error(`❌ [${requestId}] Erro:`, error.message);

    if (error.code) {
      console.error(`🏷️  [${requestId}] Código:`, error.code);
    }

    if (error.response) {
      console.error(`📊 [${requestId}] Status HTTP:`, error.response.status);
      console.error(`📄 [${requestId}] Response data:`, error.response.data);
    }

    console.error(`❌ [${requestId}] ===== FIM ERRO =====`);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        requestId: requestId,
        proxyInfo: ProxyService.getInstance().getProxyInfo(),
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint POST para testes mais avançados
 */
export async function POST(req: NextRequest) {
  const requestId = `testip_post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const body = await req.json();
    const { target = "https://httpbin.org/ip", timeout = 10000 } = body;

    console.log(`🔍 [${requestId}] ===== TESTE IP CUSTOMIZADO =====`);
    console.log(`🎯 [${requestId}] Target: ${target}`);
    console.log(`⏰ [${requestId}] Timeout: ${timeout}ms`);

    const proxyService = ProxyService.getInstance();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const axios = require("axios");

    const axiosConfig: any = {
      timeout: timeout,
      headers: {
        "User-Agent": "TradersHouse-Custom-IP-Test/1.0",
      },
    };

    if (proxyService.isEnabled()) {
      axiosConfig.proxy = proxyService.getAxiosProxyConfig();
    }

    const startTime = Date.now();
    const response = await axios.get(target, axiosConfig);
    const duration = Date.now() - startTime;

    console.log(`✅ [${requestId}] Resposta customizada em ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: response.data,
      duration: duration,
      proxyUsed: proxyService.isEnabled(),
      requestId: requestId,
    });
  } catch (error: any) {
    console.error(
      `❌ [${requestId}] Erro no teste customizado:`,
      error.message
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        requestId: requestId,
      },
      { status: 500 }
    );
  }
}
