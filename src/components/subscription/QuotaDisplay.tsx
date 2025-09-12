import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { SubscriptionService } from '@/services/SubscriptionService';

interface QuotaDisplayProps {
  onUpgrade?: () => void;
}

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ onUpgrade }) => {
  const { subscription, limits, loading } = useSubscription();

  if (loading || !subscription || !limits) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Chargement des quotas...
          </div>
        </CardContent>
      </Card>
    );
  }

  const storiesPercentage = (subscription.stories_used_this_period / limits.stories_per_month) * 100;
  const audioPercentage = limits.audio_generations_per_month > 0 
    ? (subscription.audio_generations_used_this_period / limits.audio_generations_per_month) * 100 
    : 0;

  const daysUntilRenewal = SubscriptionService.getDaysUntilRenewal(subscription.current_period_end);
  const isTrialExpired = SubscriptionService.isTrialExpired(subscription);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-primary';
  };

  const shouldShowWarning = storiesPercentage >= 80 || (limits.audio_generations_per_month > 0 && audioPercentage >= 80);

  return (
    <Card className={`${shouldShowWarning ? 'border-warning' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Utilisation - {SubscriptionService.getTierDisplayName(subscription.tier)}</CardTitle>
          <Badge variant={subscription.status === 'trial' ? 'secondary' : 'default'}>
            {subscription.status === 'trial' ? `Essai (${daysUntilRenewal}j restants)` : 'Actif'}
          </Badge>
        </div>
        {isTrialExpired && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4" />
            Votre période d'essai a expiré
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quota d'histoires */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Histoires créées ce mois</span>
            <span className="font-medium">
              {subscription.stories_used_this_period} / {limits.stories_per_month}
            </span>
          </div>
          <Progress 
            value={storiesPercentage} 
            className={`h-2 ${getProgressColor(storiesPercentage)}`}
          />
          {storiesPercentage >= 80 && (
            <div className="flex items-center gap-1 text-xs text-warning">
              <AlertTriangle className="w-3 h-3" />
              Vous approchez de votre limite mensuelle
            </div>
          )}
        </div>

        {/* Quota audio (si applicable) */}
        {limits.audio_generations_per_month > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Générations audio ce mois</span>
              <span className="font-medium">
                {subscription.audio_generations_used_this_period} / {limits.audio_generations_per_month}
              </span>
            </div>
            <Progress 
              value={audioPercentage} 
              className={`h-2 ${getProgressColor(audioPercentage)}`}
            />
          </div>
        )}

        {/* Renouvellement */}
        <div className="text-xs text-muted-foreground">
          {subscription.status === 'trial' 
            ? `Période d'essai jusqu'au ${new Date(subscription.current_period_end).toLocaleDateString()}`
            : `Renouvellement le ${new Date(subscription.current_period_end).toLocaleDateString()}`
          }
        </div>

        {/* Bouton d'upgrade si nécessaire */}
        {(shouldShowWarning || isTrialExpired) && onUpgrade && (
          <Button 
            onClick={onUpgrade} 
            className="w-full" 
            variant={isTrialExpired ? "default" : "outline"}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {isTrialExpired ? 'Choisir un plan' : 'Mettre à niveau'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuotaDisplay;