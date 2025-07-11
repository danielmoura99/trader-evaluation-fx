/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/nelogica-ws/route.ts
import { NextRequest } from "next/server";
import { WebSocketBridge } from "@/lib/services/websocket-bridge";

// Instância única do bridge para reutilizar conexão
let bridgeInstance: WebSocketBridge | null = null;

/**
 * Endpoint WebSocket para fazer bridge com a Nelogica
 * Usa Server-Sent Events como alternativa ao WebSocket no Vercel
 */
export async function GET(request: NextRequest) {
  console.log("🌉 [WebSocket Bridge] Nova conexão solicitada");

  // Verificar se o bridge já existe
  if (!bridgeInstance) {
    try {
      bridgeInstance = new WebSocketBridge();
      await bridgeInstance.initialize();
      console.log("✅ [WebSocket Bridge] Bridge inicializado com sucesso");
    } catch (error) {
      console.error("❌ [WebSocket Bridge] Erro ao inicializar:", error);
      return new Response("Erro ao inicializar bridge", { status: 500 });
    }
  }

  // Configurar Server-Sent Events
  const encoder = new TextEncoder();
  let isConnectionClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      console.log("📡 [WebSocket Bridge] Iniciando stream SSE");

      // Enviar status inicial
      const initialMessage = {
        type: "status",
        data: {
          connected: bridgeInstance?.isConnected() || false,
          authenticated: bridgeInstance?.isAuthenticated() || false,
        },
      };

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`)
      );

      // Listener para dados da Nelogica
      const handleNelogicaMessage = (data: any) => {
        if (isConnectionClosed) return;

        const message = {
          type: "nelogica-data",
          data: data,
        };

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
          );
        } catch (error) {
          console.error("❌ [WebSocket Bridge] Erro ao enviar dados:", error);
        }
      };

      // Listener para mudanças de status
      const handleStatusChange = (status: any) => {
        if (isConnectionClosed) return;

        const message = {
          type: "status",
          data: status,
        };

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
          );
        } catch (error) {
          console.error("❌ [WebSocket Bridge] Erro ao enviar status:", error);
        }
      };

      // Registrar listeners
      bridgeInstance?.on("nelogica-message", handleNelogicaMessage);
      bridgeInstance?.on("status-change", handleStatusChange);

      // Cleanup quando a conexão for fechada
      request.signal.addEventListener("abort", () => {
        console.log("🔌 [WebSocket Bridge] Cliente desconectado");
        isConnectionClosed = true;

        bridgeInstance?.off("nelogica-message", handleNelogicaMessage);
        bridgeInstance?.off("status-change", handleStatusChange);

        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

/**
 * Endpoint POST para enviar comandos para a Nelogica
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📤 [WebSocket Bridge] Comando recebido:", body);

    if (!bridgeInstance || !bridgeInstance.isConnected()) {
      return Response.json(
        { error: "Bridge não conectado à Nelogica" },
        { status: 503 }
      );
    }

    // Enviar comando para a Nelogica
    const result = await bridgeInstance.sendCommand(body);

    return Response.json({
      success: true,
      result: result,
    });
  } catch (error) {
    console.error("❌ [WebSocket Bridge] Erro ao processar comando:", error);
    return Response.json(
      { error: "Erro ao processar comando" },
      { status: 500 }
    );
  }
}
