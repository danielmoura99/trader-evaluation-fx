export const SUBSCRIPTION_PLAN_IDS = {
  "Profit Pro": 13510,
  "Profit One": 13509,
} as const;

export function getSubscriptionPlanId(platform: string): number {
  return (
    SUBSCRIPTION_PLAN_IDS[platform as keyof typeof SUBSCRIPTION_PLAN_IDS] ||
    13509
  ); // default para Profit One
}
