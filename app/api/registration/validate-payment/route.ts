// trader-evaluation-fx/app/api/registration/validate-payment/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("[Validate Payment] Iniciando validação...");

    // Verificar API Key
    const authHeader = req.headers.get("authorization");
    console.log("[Validate Payment] Auth Header recebido:", authHeader);
    console.log(
      "[Validate Payment] API Key configurada:",
      !!process.env.API_KEY
    );

    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[Validate Payment] Formato de autorização inválido");
      return Response.json(
        {
          error: "Unauthorized",
          message: "Formato de autorização inválido",
        },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");
    if (apiKey !== process.env.API_KEY) {
      console.log("[Validate Payment] API Key inválida");
      console.log("Recebida:", apiKey);
      console.log("Esperada:", process.env.API_KEY);
      return Response.json(
        {
          error: "Unauthorized",
          message: "API Key inválida",
        },
        { status: 401 }
      );
    }

    // Obter hublaPaymentId da query
    const { searchParams } = new URL(req.url);
    const hublaPaymentId = searchParams.get("paymentId");
    console.log("[Validate Payment] PaymentId recebido:", hublaPaymentId);

    if (!hublaPaymentId) {
      return Response.json(
        {
          error: "PaymentId não fornecido",
        },
        { status: 400 }
      );
    }

    // Buscar pagamento
    const payment = await prisma.payment.findFirst({
      where: {
        hublaPaymentId: hublaPaymentId,
        status: "received",
      },
    });

    console.log(
      "[Validate Payment] Payment encontrado:",
      payment ? "Sim" : "Não"
    );

    if (!payment) {
      return Response.json(
        {
          error: "Pagamento não encontrado ou já processado",
        },
        { status: 404 }
      );
    }

    return Response.json({
      valid: true,
      paymentData: {
        id: payment.id,
        platform: payment.platform,
        plan: payment.plan,
        customerEmail: payment.customerEmail,
        customerName: payment.customerName,
        customerDocument: payment.customerDocument,
      },
    });
  } catch (error) {
    console.error("[Validate Payment] Erro:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
