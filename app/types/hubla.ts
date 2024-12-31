// trader-evaluation-fx/types/hubla.ts
export interface HublaUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document: string; // Adicionado o campo document
}

export interface HublaInvoice {
  id: string;
  subscriptionId: string;
  payerId: string;
  status: string;
  amount: {
    totalCents: number;
    subtotalCents: number;
    discountCents: number;
  };
  saleDate: string;
  paymentMethod: string;
}

export interface HublaProduct {
  id: string;
  name: string;
}

export interface HublaWebhookPayload {
  type: string;
  version: string;
  event: {
    product: HublaProduct;
    invoice: HublaInvoice;
    user: HublaUser;
  };
}

export interface HublaPaymentData {
  hublaPaymentId: string;
  subscriptionId: string;
  payerId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument: string; // Adicionado o campo document
  platform: string;
  plan: string;
  status: string;
  saleDate: Date;
  paymentMethod: string;
}
