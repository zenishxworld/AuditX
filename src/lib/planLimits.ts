import { supabase } from '@/integrations/supabase/client';

export const FREE_LIMITS = {
  audits: 20,
  tokens: 20,
  chatMessages: 100,
};

export async function getFreePlanUsage(userId: string) {
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

export function isOverFreeLimit(usage: { audits: number; tokens: number; chatMessages: number }) {
  return (
    usage.audits >= FREE_LIMITS.audits ||
    usage.tokens >= FREE_LIMITS.tokens ||
    usage.chatMessages >= FREE_LIMITS.chatMessages
  );
} 