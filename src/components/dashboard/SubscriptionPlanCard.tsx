import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Crown, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { SubscriptionService } from '@/services/SubscriptionService';
import { cn } from '@/lib/utils';

export const SubscriptionPlanCard: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, limits, loading } = useSubscription();

  if (loading || !subscription || !limits) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl backdrop-blur-md border border-white/10 bg-white/5 shadow-sm animate-pulse">
        <div className="w-8 h-8 rounded-full bg-white/10 mb-3" />
        <div className="w-24 h-4 rounded bg-white/10 mb-2" />
        <div className="w-16 h-3 rounded bg-white/10" />
      </div>
    );
  }

  const isTrial = subscription.status === 'trial';
  const isFreeOrTrial = isTrial || subscription.tier === 'calmini';
  const daysUntilRenewal = SubscriptionService.getDaysUntilRenewal(subscription.current_period_end);

  const storiesLeft = Math.max(0, limits.stories_per_month - (subscription.stories_used_this_period || 0));
  const storiesPct = Math.min(100, ((subscription.stories_used_this_period || 0) / limits.stories_per_month) * 100);

  const tierIcons: Record<string, React.ReactNode> = {
    calmini: <Sparkles className="w-5 h-5 text-[#A8DADC]" />,
    calmidium: <Zap className="w-5 h-5 text-[#F4A261]" />,
    calmix: <Crown className="w-5 h-5 text-[#B7E4C7]" />,
    calmixxl: <Rocket className="w-5 h-5 text-[#E9C46A]" />,
  };

  const tierGradients: Record<string, string> = {
    calmini: 'from-[#A8DADC]/20 to-[#457B9D]/10',
    calmidium: 'from-[#F4A261]/20 to-[#E76F51]/10',
    calmix: 'from-[#B7E4C7]/20 to-[#2A9D8F]/10',
    calmixxl: 'from-[#E9C46A]/20 to-[#F4A261]/10',
  };

  return (
    <div
      className={cn(
        'flex flex-col p-5 rounded-2xl backdrop-blur-md border shadow-sm transition-all duration-500 overflow-hidden relative',
        'bg-gradient-to-br',
        tierGradients[subscription.tier] || tierGradients.calmini,
        isTrial ? 'border-[#A8DADC]/40' : 'border-white/10'
      )}
    >
      {/* Halo décoratif */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 blur-2xl rounded-full pointer-events-none" />

      {/* En-tête */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
            {tierIcons[subscription.tier] || tierIcons.calmini}
          </div>
          <span className="font-semibold text-sm text-foreground">
            {SubscriptionService.getTierDisplayName(subscription.tier)}
          </span>
        </div>
        <Badge
          variant={isTrial ? 'secondary' : 'outline'}
          className={cn(
            'text-[10px] uppercase tracking-wider',
            isTrial && 'bg-[#A8DADC]/20 text-[#A8DADC] border-[#A8DADC]/30'
          )}
        >
          {isTrial ? `Essai · ${daysUntilRenewal}j` : 'Actif'}
        </Badge>
      </div>

      {/* Quota histoires */}
      <div className="mb-4 relative z-10">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted-foreground">Histoires ce mois</span>
          <span className="text-xs font-bold text-foreground">
            {subscription.stories_used_this_period || 0} / {limits.stories_per_month}
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              storiesPct >= 80 ? 'bg-destructive' : 'bg-[#A8DADC]'
            )}
            style={{ width: `${storiesPct}%` }}
          />
        </div>
        {storiesLeft <= 2 && storiesLeft > 0 && (
          <p className="text-[10px] text-destructive mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Plus que {storiesLeft} histoire{storiesLeft > 1 ? 's' : ''} ce mois
          </p>
        )}
        {storiesLeft === 0 && (
          <p className="text-[10px] text-destructive mt-1.5 font-medium">
            Quota atteint — passe à l'étage supérieur !
          </p>
        )}
      </div>

      {/* Bouton d'action */}
      <Button
        onClick={() => navigate('/pricing')}
        variant="outline"
        size="sm"
        className={cn(
          'w-full justify-center text-xs font-semibold backdrop-blur-sm transition-all',
          isFreeOrTrial
            ? 'border-[#A8DADC]/40 bg-[#A8DADC]/10 text-[#A8DADC] hover:bg-[#A8DADC]/20 hover:text-white'
            : 'border-white/10 bg-white/5 text-foreground hover:bg-white/10'
        )}
      >
        {isTrial ? 'Découvrir l\'univers' : 'Explorer les plans'}
      </Button>
    </div>
  );
};
