export type SubscriptionTier = 'calmini' | 'calmidium' | 'calmix' | 'calmixxl';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial';

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  stories_used_this_period: number;
  audio_generations_used_this_period: number;
  is_annual: boolean;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionLimits {
  id: string;
  tier: SubscriptionTier;
  stories_per_month: number;
  max_children: number | null;
  has_story_series: boolean;
  has_background_music: boolean;
  audio_generations_per_month: number;
  has_priority_access: boolean;
  has_community_access: boolean;
  monthly_price_usd: number;
  annual_price_usd: number;
  created_at: string;
  updated_at: string;
}

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number | null;
  tier: SubscriptionTier;
}