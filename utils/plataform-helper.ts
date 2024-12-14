export const SUBSCRIPTION_PLAN_IDS = {
  "Black Arrow Pro": 14140,
  "Black Arrow One": 14140,
} as const;

export function getSubscriptionPlanId(platform: string): number {
  return (
    SUBSCRIPTION_PLAN_IDS[platform as keyof typeof SUBSCRIPTION_PLAN_IDS] ||
    14140
  ); // default para Profit One
}
