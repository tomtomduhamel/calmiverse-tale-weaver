import { supabase } from '@/integrations/supabase/client';
import { UserSubscription, SubscriptionLimits, SubscriptionTier } from '@/types/subscription';

export class SubscriptionService {
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  static async getSubscriptionLimits(tier: SubscriptionTier): Promise<SubscriptionLimits | null> {
    const { data, error } = await supabase
      .from('subscription_limits')
      .select('*')
      .eq('tier', tier)
      .single();

    if (error) throw error;
    return data;
  }

  static async getAllSubscriptionLimits(): Promise<SubscriptionLimits[]> {
    const { data, error } = await supabase
      .from('subscription_limits')
      .select('*')
      .order('monthly_price_usd', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createTrialSubscription(userId: string): Promise<UserSubscription> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        tier: 'calmini',
        status: 'trial',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSubscriptionTier(userId: string, tier: SubscriptionTier, isAnnual: boolean = false): Promise<void> {
    const periodEnd = new Date();
    if (isAnnual) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        tier,
        is_annual: isAnnual,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        stories_used_this_period: 0,
        audio_generations_used_this_period: 0
      })
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async cancelSubscription(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId);

    if (error) throw error;
  }

  static getTierDisplayName(tier: SubscriptionTier): string {
    const names = {
      calmini: 'Calmini',
      calmidium: 'Calmidium',
      calmix: 'Calmix',
      calmixxl: 'Calmixxl'
    };
    return names[tier];
  }

  static getTierDescription(tier: SubscriptionTier): string {
    const descriptions = {
      calmini: 'Plan d\'essai parfait pour découvrir Calmiverse',
      calmidium: 'Plan intermédiaire avec accès aux suites d\'histoires',
      calmix: 'Plan complet avec audio et fonctionnalités premium',
      calmixxl: 'Plan ultime pour les familles nombreuses'
    };
    return descriptions[tier];
  }

  static getAnnualPrice(monthlyPrice: number): number {
    return monthlyPrice * 12 * 0.8; // 20% de réduction
  }

  static getDaysUntilRenewal(currentPeriodEnd: string): number {
    const endDate = new Date(currentPeriodEnd);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static isTrialExpired(subscription: UserSubscription): boolean {
    if (subscription.status !== 'trial') return false;
    const endDate = new Date(subscription.current_period_end);
    return endDate < new Date();
  }

  static getUpgradeRecommendation(currentTier: SubscriptionTier, reason: 'stories' | 'audio' | 'children' | 'features'): SubscriptionTier | null {
    const tierOrder: SubscriptionTier[] = ['calmini', 'calmidium', 'calmix', 'calmixxl'];
    const currentIndex = tierOrder.indexOf(currentTier);
    
    if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
      return null; // Déjà au niveau maximum
    }

    switch (reason) {
      case 'stories':
        return tierOrder[currentIndex + 1];
      case 'audio':
        return currentTier === 'calmini' || currentTier === 'calmidium' ? 'calmix' : 'calmixxl';
      case 'children':
        return currentTier === 'calmini' ? 'calmidium' : 'calmix';
      case 'features':
        return 'calmix';
      default:
        return tierOrder[currentIndex + 1];
    }
  }
}