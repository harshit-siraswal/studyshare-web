const DEFAULT_AI_BASE_BUDGET = 40160;
const DEFAULT_AI_BUDGET_INR = 1;
const DEFAULT_AI_PREMIUM_MULTIPLIER = 10;

export const RAW_AI_TOKENS_PER_VISIBLE_TOKEN = 2000;
export const AI_RECHARGE_PACKS = [19, 29, 49, 99, 149, 199] as const;

export interface AiTokenBudgetSnapshot {
  baseBudget: number;
  freeBudget: number;
  premiumBudget: number;
  currentBudget: number;
  budgetMultiplier: number;
  premiumMultiplier: number;
  isPremiumActive: boolean;
  budgetInr: number;
}

export function toSafeInt(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value) : 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const direct = Number(trimmed);
    if (Number.isFinite(direct)) return Math.round(direct);

    const normalized = trimmed.replace(/,/g, "");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }

  return 0;
}

export function toSafeFloat(value: unknown, fallback = DEFAULT_AI_BUDGET_INR): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    const normalized = trimmed.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function visibleAiTokensFromRaw(rawTokenCount: number): number {
  if (rawTokenCount <= 0) return 0;
  return Math.max(1, Math.floor(rawTokenCount / RAW_AI_TOKENS_PER_VISIBLE_TOKEN));
}

export function formatVisibleAiTokens(rawTokenCount: number): string {
  return visibleAiTokensFromRaw(rawTokenCount).toString();
}

export function resolveTokensPerRupee(
  baseBudget: number,
  budgetInr: number,
): number {
  return Math.max(
    1,
    Math.round(baseBudget / Math.max(0.01, budgetInr || DEFAULT_AI_BUDGET_INR)),
  );
}

export function estimateRechargeRawTokens(
  rechargeRupees: number,
  baseBudget: number,
  budgetInr: number,
): number {
  return Math.max(1, rechargeRupees * resolveTokensPerRupee(baseBudget, budgetInr));
}

export function estimateRechargeVisibleTokens(
  rechargeRupees: number,
  baseBudget: number,
  budgetInr: number,
): number {
  return visibleAiTokensFromRaw(
    estimateRechargeRawTokens(rechargeRupees, baseBudget, budgetInr),
  );
}

export function buildAiTokenBudgetSnapshot(
  profile: Record<string, unknown>,
  defaultBudget = DEFAULT_AI_BASE_BUDGET,
): AiTokenBudgetSnapshot {
  const budgetFromApi = toSafeInt(profile.ai_token_budget);
  const baseBudgetFromApi = toSafeInt(profile.ai_token_base_budget);
  const rawBudgetMultiplier = Math.max(
    1,
    toSafeInt(profile.ai_token_budget_multiplier),
  );
  const rawPremiumMultiplier = Math.max(
    1,
    toSafeInt(profile.ai_token_premium_multiplier),
  );
  const premiumMultiplier =
    rawPremiumMultiplier > 1 ? rawPremiumMultiplier : DEFAULT_AI_PREMIUM_MULTIPLIER;

  const tier = String(profile.subscription_tier ?? "")
    .trim()
    .toLowerCase();
  const subscriptionEnd = profile.subscription_end_date
    ? new Date(String(profile.subscription_end_date))
    : null;
  const isPremiumActive =
    (tier === "pro" || tier === "max" || tier === "premium") &&
    !!subscriptionEnd &&
    !Number.isNaN(subscriptionEnd.getTime()) &&
    subscriptionEnd.getTime() > Date.now();

  const freeBudget = (() => {
    if (budgetFromApi > 0) {
      if (isPremiumActive && premiumMultiplier > 1) {
        return Math.max(1, Math.round(budgetFromApi / premiumMultiplier));
      }
      return budgetFromApi;
    }

    if (baseBudgetFromApi > 0) {
      return Math.max(1, baseBudgetFromApi * rawBudgetMultiplier);
    }

    return Math.max(1, defaultBudget * rawBudgetMultiplier);
  })();

  const baseBudget =
    baseBudgetFromApi > 0
      ? baseBudgetFromApi
      : Math.max(1, Math.round(freeBudget / rawBudgetMultiplier));
  const budgetMultiplier = Math.max(1, Math.round(freeBudget / baseBudget));
  const premiumBudget = Math.max(1, freeBudget * premiumMultiplier);
  const currentBudget = budgetFromApi > 0
    ? Math.max(budgetFromApi, isPremiumActive ? premiumBudget : freeBudget)
    : (isPremiumActive ? premiumBudget : freeBudget);
  const budgetInr = Math.max(
    DEFAULT_AI_BUDGET_INR,
    toSafeFloat(profile.ai_budget_inr, DEFAULT_AI_BUDGET_INR),
  );

  return {
    baseBudget,
    freeBudget,
    premiumBudget,
    currentBudget,
    budgetMultiplier,
    premiumMultiplier,
    isPremiumActive,
    budgetInr,
  };
}
