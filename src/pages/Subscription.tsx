import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, CreditCard, Settings, TrendingUp, User } from 'lucide-react';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { SubscriptionService } from '@/services/SubscriptionService';
import QuotaDisplay from '@/components/subscription/QuotaDisplay';
import TierBadge from '@/components/subscription/TierBadge';
import { useNavigate } from 'react-router-dom';

const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, limits, loading } = useSubscription();

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleManageBilling = () => {
    // Sera implémenté plus tard avec Stripe
    alert('Gestion de la facturation bientôt disponible !');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">Chargement de votre abonnement...</div>
      </div>
    );
  }

  if (!subscription || !limits) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Aucun abonnement trouvé.</p>
            <Button onClick={() => navigate('/pricing')} className="mt-4">
              Voir les plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilRenewal = SubscriptionService.getDaysUntilRenewal(subscription.current_period_end);
  const isTrialExpired = SubscriptionService.isTrialExpired(subscription);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mon abonnement</h1>
          <p className="text-muted-foreground">
            Gérez votre abonnement et consultez votre utilisation
          </p>
        </div>
        <Button onClick={handleUpgrade} variant="outline">
          <TrendingUp className="w-4 h-4 mr-2" />
          Voir tous les plans
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations de l'abonnement */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Plan actuel
                </CardTitle>
                <TierBadge tier={subscription.tier} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {SubscriptionService.getTierDisplayName(subscription.tier)}
                </h3>
                <p className="text-muted-foreground">
                  {SubscriptionService.getTierDescription(subscription.tier)}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Prix mensuel</span>
                  <p className="font-semibold">{limits.monthly_price_usd}$ / mois</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Statut</span>
                  <p className="font-semibold">
                    <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                      {subscription.status === 'trial' ? 'Essai gratuit' : 
                       subscription.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {subscription.status === 'trial' ? 'Fin de l\'essai' : 'Prochain renouvellement'}
                  </span>
                  <p className="font-semibold">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                    {daysUntilRenewal > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({daysUntilRenewal} jour{daysUntilRenewal > 1 ? 's' : ''})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type de facturation</span>
                  <p className="font-semibold">
                    {subscription.is_annual ? 'Annuel' : 'Mensuel'}
                    {subscription.is_annual && (
                      <Badge variant="secondary" className="ml-2">-20%</Badge>
                    )}
                  </p>
                </div>
              </div>

              {isTrialExpired && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-destructive font-medium">
                    Votre période d'essai a expiré. Choisissez un plan pour continuer à utiliser Calmiverse.
                  </p>
                  <Button onClick={handleUpgrade} className="mt-2">
                    Choisir un plan
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleUpgrade} variant="outline" className="flex-1">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Changer de plan
                </Button>
                {subscription.status === 'active' && (
                  <Button onClick={handleManageBilling} variant="outline" className="flex-1">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Gérer la facturation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fonctionnalités incluses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Fonctionnalités incluses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-primary" />
                  {limits.stories_per_month} histoires par mois
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-primary" />
                  {limits.max_children ? `${limits.max_children} enfants maximum` : 'Enfants illimités'}
                </div>
                {limits.has_story_series && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-primary" />
                    Suites d'histoires
                  </div>
                )}
                {limits.has_background_music && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-primary" />
                    Musique de fond
                  </div>
                )}
                {limits.audio_generations_per_month > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-primary" />
                    {limits.audio_generations_per_month} génération{limits.audio_generations_per_month > 1 ? 's' : ''} audio/mois
                  </div>
                )}
                {limits.has_priority_access && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-primary" />
                    Accès prioritaire
                  </div>
                )}
                {limits.has_community_access && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-primary" />
                    Communauté Calmos
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Utilisation */}
        <div>
          <QuotaDisplay onUpgrade={handleUpgrade} />
        </div>
      </div>
    </div>
  );
};

export default Subscription;