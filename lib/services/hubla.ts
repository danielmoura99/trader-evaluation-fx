// trader-evaluation-fx/lib/services/hubla.ts
import { prisma } from "@/lib/prisma";
import { HublaWebhookPayload, HublaPaymentData } from "@/app/types/hubla";
import crypto from "crypto";

export class HublaService {
  private webhookSecret: string;

  constructor() {
    const secret = process.env.HUBLA_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("HUBLA_WEBHOOK_SECRET não configurado");
    }
    this.webhookSecret = secret;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hmac = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload)
      .digest("hex");
    return hmac === signature;
  }

  extractPaymentData(webhook: HublaWebhookPayload): HublaPaymentData | null {
    try {
      // Ignora faturas de order bump (offer-1, offer-2)
      if (webhook.event.invoice.id.includes("-offer-")) {
        console.log("Order bump ignorado:", webhook.event.invoice.id);
        return null;
      }
      // Verificar tipo do evento e status
      if (
        webhook.type !== "invoice.payment_succeeded" ||
        webhook.event.invoice.status !== "paid"
      ) {
        console.log("Evento ignorado ou status inválido:", {
          type: webhook.type,
          status: webhook.event.invoice.status,
        });
        return null;
      }

      // Log para debug
      console.log("Processando webhook:", {
        tipo: webhook.type,
        produto: webhook.event.product.name,
        usuario: webhook.event.user,
      });

      // Extrair plataforma e plano do nome do produto
      const productParts = webhook.event.product.name
        .split("-")
        .map((p) => p.trim());
      let planPart = productParts[0]; // "Trader 5K, 10K, 25K ou 50K"
      if (planPart) {
        // Verificar se é um plano FX e transformar
        const matchPlan = planPart.match(/Trader (\d+K)/);
        if (matchPlan) {
          planPart = `FX - ${matchPlan[1]}`;
        }
      }
      //const platformPart = productParts[1]?.split("|")[0]?.trim(); // "Profit One" ou "Profit Pro"
      const platformPart = "Black Arrow Pro";
      // Tratamento para documento (pode não existir em ambiente de teste)
      const customerDocument = webhook.event.user.document
        ? webhook.event.user.document.replace(/[^\d]/g, "")
        : "00000000000"; // CPF padrão para testes

      return {
        hublaPaymentId: webhook.event.invoice.id,
        subscriptionId: webhook.event.invoice.subscriptionId,
        payerId: webhook.event.invoice.payerId,
        amount: webhook.event.invoice.amount.totalCents,
        customerName:
          `${webhook.event.user.firstName} ${webhook.event.user.lastName}`.trim(),
        customerEmail: webhook.event.user.email,
        customerPhone: webhook.event.user.phone,
        customerDocument: customerDocument,
        platform: platformPart || "Não especificado",
        plan: planPart || "Não especificado",
        status: webhook.event.invoice.status,
        saleDate: new Date(webhook.event.invoice.saleDate),
        paymentMethod: webhook.event.invoice.paymentMethod,
      };
    } catch (error) {
      console.error("Erro ao extrair dados do webhook:", error);
      console.error("Payload recebido:", webhook);
      return null;
    }
  }

  async processPayment(paymentData: HublaPaymentData) {
    try {
      // Verifica se já existe um pagamento com este ID
      const existingPayment = await prisma.payment.findUnique({
        where: { hublaPaymentId: paymentData.hublaPaymentId },
      });

      if (existingPayment) {
        console.log(
          "Pagamento já processado anteriormente:",
          existingPayment.id
        );
        return existingPayment;
      }

      // Salva o novo pagamento
      const payment = await prisma.payment.create({
        data: {
          hublaPaymentId: paymentData.hublaPaymentId,
          platform: paymentData.platform,
          plan: paymentData.plan,
          amount: paymentData.amount,
          customerEmail: paymentData.customerEmail,
          customerName: paymentData.customerName,
          customerPhone: paymentData.customerPhone,
          customerDocument: paymentData.customerDocument,
          status: "received",
          saleDate: paymentData.saleDate,
          paymentMethod: paymentData.paymentMethod,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("Novo pagamento processado:", {
        id: payment.id,
        hublaPaymentId: payment.hublaPaymentId,
        status: payment.status,
        platform: payment.platform,
        plan: payment.plan,
      });

      return payment;
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      throw error;
    }
  }
}
