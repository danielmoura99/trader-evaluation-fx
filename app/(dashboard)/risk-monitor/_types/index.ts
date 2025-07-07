// app/(dashboard)/risk-monitor/_types/index.ts

export type RiskStatus = "Normal" | "Alert" | "Critical";

export interface RiskMonitorData {
  subconta: string; // Account ID
  nome: string; // Client name
  perfilRisco: string; // Risk profile name
  operacoesFechadas: number; // Closed operations P&L
  operacoesAbertas: number; // Open positions P&L
  resultadoBruto: number; // Gross result (fechadas + abertas)
  taxaCorretagem: number | "Pendente"; // Commission fees
  resultadoLiquido: number; // Net result (bruto - taxas)
  limitePerdaDiaria: number; // Daily loss limit from risk profile
  drawdownDiario: number; // Daily drawdown current
  saldoMensal: number | "Pendente"; // Monthly balance
  saldoTotal: number; // Total current balance
  status: RiskStatus; // Risk status based on limits
  lastUpdate: Date; // Last update timestamp
  connectionStatus: "connected" | "disconnected" | "connecting";
}

export interface WebSocketStatus {
  connected: boolean;
  authenticated: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
}

export interface RiskAlert {
  id: string;
  subconta: string;
  nome: string;
  type: "LOSS_LIMIT_EXCEEDED" | "APPROACHING_LIMIT" | "CONNECTION_LOST";
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: Date;
  acknowledged: boolean;
}

export interface ExportOptions {
  format: "excel" | "pdf" | "csv";
  includeAlerts: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Interface para dados vindos do WebSocket
export interface WebSocketBalanceData {
  account: string;
  currency: string;
  balance: number;
}

export interface WebSocketRiskData {
  account: string;
  checkLoss: boolean;
  checkGain: boolean;
  checkDrawDown: boolean;
  maxGain: number;
  maxLoss: number;
  drawDown: number;
  currency: string;
}

export interface WebSocketPositionData {
  account: string;
  ticker: string;
  quantity: number;
  averagePrice: number;
  side: string;
}

export interface WebSocketMarginData {
  account: string;
  marginValue: number;
  marginLevel: number;
  marginExcess: number;
  pnl: number;
}

// Interface para dados do banco local
export interface ClientWithAccount {
  id: string;
  name: string;
  email: string;
  cpf: string;
  plan: string;
  traderStatus: string;
  nelogicaAccount?: string;
  nelogicaLicenseId?: string;
  riskProfile?: {
    id: string;
    name: string;
    initialBalance: number;
    enableLoss: boolean;
    lossRule: number;
    enableGain: boolean;
    gainRule: number;
    trailing: boolean;
    stopOutRule: number;
    leverage: number;
  };
}

export interface RiskMonitorFilters {
  status?: RiskStatus[];
  search?: string;
  riskProfile?: string[];
  sortBy?: keyof RiskMonitorData;
  sortDirection?: "asc" | "desc";
}
