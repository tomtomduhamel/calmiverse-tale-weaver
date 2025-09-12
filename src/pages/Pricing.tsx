import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { SubscriptionService } from '@/services/SubscriptionService';
import { APP_CONFIG } from '@/lib/config';
import { useState, useEffect } from 'react';
import { SubscriptionLimits } from '@/types/subscription';
import { supabase } from '@/integrations/supabase/client';

const Pricing: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [limits, setLimits] = useState<SubscriptionLimits[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const data = await SubscriptionService.getAllSubscriptionLimits();
        setLimits(data);
      } catch (error) {
        console.error('Error fetching subscription limits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, []);

  const handleUpgrade = async (tier: string) => {
    if (!user) {
      // Rediriger vers la page d'authentification
      window.location.href = '/auth';
      return;
    }

    // Pour l'instant, juste un message - la logique Stripe sera ajoutée plus tard
    alert(`Mise à niveau vers ${SubscriptionService.getTierDisplayName(tier as any)} bientôt disponible !`);
  };

  const getFeatureList = (tierLimits: SubscriptionLimits) => {
    const features = [
      `${tierLimits.stories_per_month} histoires par mois`,
      tierLimits.max_children ? `${tierLimits.max_children} enfants maximum` : 'Enfants illimités',
    ];

    if (tierLimits.has_story_series) features.push('Suites d\'histoires');
    if (tierLimits.has_background_music) features.push('Musique de fond');
    if (tierLimits.audio_generations_per_month > 0) {
      features.push(`${tierLimits.audio_generations_per_month} génération${tierLimits.audio_generations_per_month > 1 ? 's' : ''} audio/mois`);
    }
    if (tierLimits.has_priority_access) features.push('Accès prioritaire');
    if (tierLimits.has_community_access) features.push('Communauté Calmos');

    return features;
  };

  const isCurrentPlan = (tier: string) => {
    return subscription?.tier === tier;
  };

  const isPopular = (tier: string) => {
    return tier === 'calmix';
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement des plans...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choisissez votre plan Calmiverse</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Créez des histoires magiques pour vos enfants avec nos plans adaptés à vos besoins
        </p>
        <div className="flex justify-center items-center gap-4 mb-8">
          <span className="text-sm">Mensuel</span>
          <div className="bg-muted rounded-full p-1 text-sm">
            <div className="bg-background rounded-full px-3 py-1 shadow-sm">
              Économisez 20% avec l'abonnement annuel
            </div>
          </div>
          <span className="text-sm">Annuel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {limits.map((tierLimits) => (
          <Card 
            key={tierLimits.tier} 
            className={`relative ${isPopular(tierLimits.tier) ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {isPopular(tierLimits.tier) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Populaire
                </Badge>
              </div>
            )}
            
            {isCurrentPlan(tierLimits.tier) && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary">Plan actuel</Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">
                {SubscriptionService.getTierDisplayName(tierLimits.tier)}
              </CardTitle>
              <CardDescription className="text-sm">
                {SubscriptionService.getTierDescription(tierLimits.tier)}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold">
                  {tierLimits.monthly_price_usd}$
                  <span className="text-sm font-normal text-muted-foreground">/mois</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  ou {SubscriptionService.getAnnualPrice(tierLimits.monthly_price_usd).toFixed(2)}$/an
                </div>
              </div>

              <ul className="space-y-2 text-sm">
                {getFeatureList(tierLimits).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                variant={isCurrentPlan(tierLimits.tier) ? "outline" : "default"}
                disabled={isCurrentPlan(tierLimits.tier)}
                onClick={() => handleUpgrade(tierLimits.tier)}
              >
                {isCurrentPlan(tierLimits.tier) ? 'Plan actuel' : 'Choisir ce plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-muted rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Essai gratuit de 30 jours</h3>
          <p className="text-muted-foreground">
            Commencez avec le plan Calmini gratuitement pendant 30 jours. 
            Aucune carte de crédit requise pour commencer.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Tous les plans incluent un support client et des mises à jour régulières. 
          Vous pouvez changer de plan à tout moment.
        </p>
      </div>
    </div>
  );
};

export default Pricing;