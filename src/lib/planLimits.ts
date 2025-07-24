import { supabase } from '@/integrations/supabase/client';

export const FREE_LIMITS = {
  audits: 5,
  tokens: 3,
  chatMessages: 100,
};

export const PRO_LIMITS = {
  audits: 50,
  tokens: 50,
  chatMessages: Infinity,
};

export const PREMIUM_LIMITS = {
  audits: Infinity,
  tokens: Infinity,
  chatMessages: Infinity,
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
  // Use localStorage as a temporary solution until the user_subscriptions table is created
  const storedPlanType = localStorage.getItem('userPlanType');
  
  console.log('Retrieved plan type from localStorage:', storedPlanType);
  
  // Validate that the stored plan type is a valid PlanType
  if (storedPlanType === 'Pro' || storedPlanType === 'Premium') {
    return storedPlanType;
  }
  
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

  // Sum chat messages
  const { data: chats } = await supabase
    .from('chats')
    .select('message_count')
    .eq('user_id', userId);

  const chatMessages = (chats || []).reduce((sum, c) => sum + (c.message_count || 0), 0);

  return {
    audits: auditsCount || 0,
    tokens: tokensCount || 0,
    chatMessages,
  };
}

export function isOverLimit(usage: { audits: number; tokens: number; chatMessages: number }, planType: PlanType) {
  const limits = getPlanLimits(planType);
  return (
    (limits.audits !== Infinity && usage.audits >= limits.audits) ||
    (limits.tokens !== Infinity && usage.tokens >= limits.tokens) ||
    (limits.chatMessages !== Infinity && usage.chatMessages >= limits.chatMessages)
  );
}

// For backward compatibility
export function isOverFreeLimit(usage: { audits: number; tokens: number; chatMessages: number }) {
  return isOverLimit(usage, 'Free');
}

// For backward compatibility
export async function getFreePlanUsage(userId: string) {
  return getUserUsage(userId);
}