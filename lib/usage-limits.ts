/**
 * Usage Limits and Rate Limiting
 */

import { createClient } from '@/lib/supabase/server';

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  maxUsage: number;
}

/**
 * Check if user can generate another tailored resume
 */
export async function checkResumeGenerationLimit(userId: string): Promise<UsageCheckResult> {
  const supabase = await createClient();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return {
      allowed: false,
      reason: 'User not found',
      currentUsage: 0,
      maxUsage: 0,
    };
  }

  // Check if billing period has expired
  const now = new Date();
  const periodEnd = user.billing_period_end ? new Date(user.billing_period_end) : null;
  
  if (periodEnd && now > periodEnd) {
    // Reset usage for new period
    await supabase
      .from('users')
      .update({
        resumes_generated_this_period: 0,
        billing_period_start: now.toISOString(),
        billing_period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .eq('id', userId);
    
    return {
      allowed: true,
      currentUsage: 0,
      maxUsage: user.max_resumes_per_period,
    };
  }

  // Check if user has reached limit
  if (user.resumes_generated_this_period >= user.max_resumes_per_period) {
    return {
      allowed: false,
      reason: `You have reached your monthly limit of ${user.max_resumes_per_period} resumes. Upgrade to Pro for more.`,
      currentUsage: user.resumes_generated_this_period,
      maxUsage: user.max_resumes_per_period,
    };
  }

  return {
    allowed: true,
    currentUsage: user.resumes_generated_this_period,
    maxUsage: user.max_resumes_per_period,
  };
}

/**
 * Increment usage counter
 */
export async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient();
  
  // Direct increment - no RPC needed, just fetch and update
  const { data: user } = await supabase
    .from('users')
    .select('resumes_generated_this_period')
    .eq('id', userId)
    .single();
  
  if (user) {
    await supabase
      .from('users')
      .update({ resumes_generated_this_period: (user.resumes_generated_this_period || 0) + 1 })
      .eq('id', userId);
  }
}

/**
 * Record usage event
 */
export async function recordUsageEvent(
  userId: string,
  eventType: 'tailor_resume' | 'export_docx' | 'export_txt' | 'export_pdf',
  modelName: string,
  inputTokens?: number,
  outputTokens?: number
): Promise<void> {
  const supabase = await createClient();
  
  await supabase.from('usage_events').insert({
    user_id: userId,
    event_type: eventType,
    model_name: modelName,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });
}

