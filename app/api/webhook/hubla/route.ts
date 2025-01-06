//trader-evaluation-fx/app/api/webhook/hubla/route.ts
import { HublaService } from "@/lib/services/hubla";
import { HublaWebhookPayload } from "@/app/types/hubla";
import { NextRequest } from "next/server";
import { sendRegistrationEmail } from "@/lib/email-service"; // Adicionar este import

export async function POST(req: NextRequest) {
  try {
    console.log("\n=== INÍCIO DO PROCESSAMENTO DO WEBHOOK ===");
    console.log("[Hubla Webhook] Iniciando processamento...");

    // Verificar se é ambiente sandbox
    const isSandbox = req.headers.get("x-hubla-sandbox") === "true";
    console.log("[Hubla Webhook] Ambiente sandbox:", isSandbox);

    // Verificar token da Hubla
    const hublaToken = req.headers.get("x-hubla-token");
    if (!hublaToken || hublaToken !== process.env.HUBLA_WEBHOOK_SECRET) {
      console.log("[Hubla Webhook] Token inválido ou ausente");
      return Response.json(
        {
          error: "Token inválido",
          message: "O token fornecido não é válido",
        },
        { status: 401 }
      );
    }

    // Log dos headers
    const allHeaders = Array.from(req.headers.entries());
    console.log("[Hubla Webhook] Headers completos:", allHeaders);

    // Lê o payload
    const payload = await req.text();
    console.log("[Hubla Webhook] Payload completo:", payload);

    // Parse do payload
    let webhookData: HublaWebhookPayload;
    try {
      webhookData = JSON.parse(payload);
      console.log("[Hubla Webhook] Dados processados:", {
        type: webhookData.type,
        productName: webhookData.event.product.name,
        userId: webhookData.event.user.id,
        invoiceId: webhookData.event.invoice.id,
        status: webhookData.event.invoice.status,
      });
    } catch (parseError) {
      console.error(
        "[Hubla Webhook] Erro ao fazer parse do payload:",
        parseError
      );
      return Response.json(
        {
          error: "Payload inválido",
          message: "Não foi possível processar o payload recebido",
        },
        { status: 400 }
      );
    }

    // Verifica tipo do evento
    if (webhookData.type !== "invoice.payment_succeeded") {
      console.log("[Hubla Webhook] Evento ignorado:", webhookData.type);
      return Response.json(
        {
          message: "Evento ignorado",
          type: webhookData.type,
        },
        { status: 200 }
      );
    }

    const hublaService = new HublaService();

    // Extrai e valida dados do pagamento
    const paymentData = hublaService.extractPaymentData(webhookData);
    if (!paymentData) {
      console.log(
        "[Hubla Webhook] Erro: Dados do pagamento inválidos ou incompletos"
      );
      return Response.json(
        {
          error: "Dados inválidos",
          message: "Não foi possível extrair os dados necessários do pagamento",
        },
        { status: 400 }
      );
    }

    console.log("[Hubla Webhook] Dados do pagamento extraídos:", {
      hublaPaymentId: paymentData.hublaPaymentId,
      platform: paymentData.platform,
      plan: paymentData.plan,
      customerEmail: paymentData.customerEmail,
      amount: paymentData.amount,
      status: paymentData.status,
    });

    // Processa o pagamento
    const payment = await hublaService.processPayment(paymentData);
    const registrationUrl = `${
      process.env.CLIENT_PORTAL_URL || "https://portal.tradershouse.com.br/"
    }/registration/${payment.hublaPaymentId}`;

    // Adicionar envio de email
    try {
      await sendRegistrationEmail({
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        registrationUrl,
      });

      console.log("[Hubla Webhook] Email de registro enviado com sucesso");
    } catch (emailError) {
      console.error(
        "[Hubla Webhook] Erro ao enviar email de registro:",
        emailError
      );
      // Não retornamos erro aqui para não impedir o processo caso o email falhe
    }

    console.log("[Hubla Webhook] Pagamento processado:", {
      id: payment.id,
      hublaPaymentId: payment.hublaPaymentId,
      status: payment.status,
      platform: payment.platform,
      plan: payment.plan,
      registrationUrl,
    });

    console.log("=== FIM DO PROCESSAMENTO DO WEBHOOK ===\n");

    return Response.json({
      message: "Pagamento processado com sucesso",
      paymentId: payment.hublaPaymentId,
      registrationUrl,
      sandbox: isSandbox,
    });
  } catch (error) {
    console.error("[Hubla Webhook] Erro crítico ao processar webhook:", error);

    if (error instanceof Error) {
      console.error("[Hubla Webhook] Detalhes do erro:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
