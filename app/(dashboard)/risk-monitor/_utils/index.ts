// app/(dashboard)/risk-monitor/_utils/index.ts
import type { RiskStatus } from "../_types";

/**
 * Calcula o status de risco baseado nos dados atuais
 */
export function calculateRiskStatus(
  drawdownDiario: number,
  limitePerdaDiaria: number
): RiskStatus {
  if (drawdownDiario >= limitePerdaDiaria) {
    return "Critical";
  }

  if (drawdownDiario >= limitePerdaDiaria * 0.8) {
    return "Alert";
  }

  return "Normal";
}

/**
 * Formata valores monetários
 */
export function formatCurrency(value: number | string): string {
  if (value === "Pendente") return value;
  if (typeof value === "string") return value;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata percentual
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Obter cor baseada no valor
 */
export function getValueColor(value: number, isProfit: boolean = true): string {
  if (value === 0) return "text-zinc-400";
  if (isProfit) {
    return value > 0 ? "text-green-500" : "text-red-500";
  } else {
    return value > 0 ? "text-red-500" : "text-green-500";
  }
}
