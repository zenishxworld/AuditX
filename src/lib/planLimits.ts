import { supabase } from '@/integrations/supabase/client';

export const FREE_LIMITS = {
  audits: 5,
  tokens: 3,
  walletInspections: 5,
};

export const PRO_LIMITS = {
  audits: 50,
  tokens: 50,
  walletInspections: 50,
};

export const PREMIUM_LIMITS = {
  audits: Infinity,
  tokens: Infinity,
  walletInspections: Infinity,
};

export type PlanType = 'Free' | 'Pro' | 'Premium';

export const getPlanLimits = (planType: PlanType) => {
  switch (planType) {
    case 'Pro':
      return PRO_LIMITS;
    case 'Premium':
      return PREMIUM_LIMITS;
    default:
      return FREE_LIMITS;
  }
};

export async function getUserPlan(userId: string): Promise<PlanType> {
  // Temporary storage until user_subscriptions table exists
  // Use a per-user namespaced key to avoid leaking plan across different users
  const namespacedKey = `userPlanType:${userId}`;
  const storedPlanType = localStorage.getItem(namespacedKey);

  // Backward compatibility: migrate legacy global key if present
  const legacyKey = localStorage.getItem('userPlanType');
  if (!storedPlanType && (legacyKey === 'Pro' || legacyKey === 'Premium' || legacyKey === 'Free')) {
    localStorage.setItem(namespacedKey, legacyKey);
    localStorage.removeItem('userPlanType');
    return legacyKey as PlanType;
  }

  // Validate stored plan
  if (storedPlanType === 'Pro' || storedPlanType === 'Premium' || storedPlanType === 'Free') {
    return storedPlanType as PlanType;
  }

  // Default for new users
  return 'Free';
}

export async function getUserUsage(userId: string) {
  // Count audits
  const { count: auditsCount } = await supabase
    .from('audit_reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Count tokens
  const { count: tokensCount } = await supabase
    .from('token_scans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return {
    audits: auditsCount || 0,
    tokens: tokensCount || 0,
  };
}

export function isOverLimit(usage: { audits: number; tokens: number }, planType: PlanType) {
  const limits = getPlanLimits(planType);
  return (
    (limits.audits !== Infinity && usage.audits >= limits.audits) ||
    (limits.tokens !== Infinity && usage.tokens >= limits.tokens)
  );
}

// For backward compatibility
export function isOverFreeLimit(usage: { audits: number; tokens: number }) {
  return isOverLimit(usage, 'Free');
}

// For backward compatibility
export async function getFreePlanUsage(userId: string) {
  return getUserUsage(userId);
}

// Wallet Inspector monthly usage and limits
export async function getWalletInspectorUsage(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startIso = startOfMonth.toISOString();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextIso = nextMonth.toISOString();

  const { count } = await supabase
    .from('wallet_inspections')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startIso)
    .lt('created_at', nextIso);

  return count || 0;
}

export function isOverWalletInspectorLimit(usageCount: number, planType: PlanType): boolean {
  const limits = getPlanLimits(planType);
  const limit = limits.walletInspections;
  return limit !== Infinity && usageCount >= limit;
}