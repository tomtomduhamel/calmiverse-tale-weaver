import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { SubscriptionService } from '@/services/SubscriptionService';
import { analytics } from '@/utils/analytics';

const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { subscription, refreshSubscription, loading: subLoading } = useSubscription();
  const { completed: onboardingCompleted } = useOnboardingStatus();
  const [attempts, setAttempts] = useState(0);
  const [ready, setReady] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  // Si pas connecté, rediriger
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Polling de l'abonnement pendant 15s, le temps que le webhook Stripe écrive
  useEffect(() => {
    if (!user || ready) return;
    if (subscription?.status === 'active') {
      setReady(true);
      return;
    }
    if (attempts >= 10) {
      setReady(true); // on arrête, on affiche quand même la page
      return;
    }
    const t = setTimeout(() => {
      refreshSubscription();
      setAttempts((a) => a + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [user, subscription, attempts, ready, refreshSubscription]);

  const isPending = !ready && !subLoading;

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-floating">
        <CardContent className="p-8 text-center">
          {isPending ? (
            <>
              <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="font-display italic text-2xl mb-2">Activation de votre abonnement…</h1>
              <p className="text-sm text-muted-foreground">
                Cela prend généralement quelques secondes.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-9 w-9 text-primary" />
              </div>
              <h1 className="font-display italic text-3xl mb-2">Merci !</h1>
              <p className="text-muted-foreground mb-6">
                Votre abonnement{' '}
                <span className="font-semibold text-foreground">
                  {subscription ? SubscriptionService.getTierDisplayName(subscription.tier) : 'Calmi'}
                </span>{' '}
                est activé. Bienvenue dans Calmi 🎉
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => navigate('/app/create-story/step-1')}
                >
                  Créer ma première histoire
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => navigate('/app/subscription')}>
                  Voir mon abonnement
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;
