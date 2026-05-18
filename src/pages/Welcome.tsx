import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Wand2, ArrowRight, Check } from 'lucide-react';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { analytics } from '@/utils/analytics';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { markCompleted } = useOnboardingStatus();
  const { user } = useSupabaseAuth();

  const finish = async (nextPath: string) => {
    await markCompleted();
    analytics.track('onboarding_completed', { path: nextPath }, user?.id);
    navigate(nextPath, { replace: true });
  };

  const steps = [
    {
      icon: Sparkles,
      title: 'Bienvenue dans Calmi',
      body: "Des histoires sur-mesure pour aider votre enfant à s'endormir, se concentrer, gérer ses émotions ou simplement s'amuser. On vous guide en 3 minutes.",
      cta: 'Commencer',
      action: () => setStep(1),
    },
    {
      icon: Users,
      title: 'Créez un profil enfant',
      body: "Le prénom, l'âge et quelques centres d'intérêt suffisent pour que chaque histoire devienne unique. Vous pourrez ajouter d'autres profils plus tard.",
      cta: 'Créer un profil enfant',
      action: () => finish('/app/children'),
      secondaryCta: 'Plus tard',
      secondaryAction: () => setStep(2),
    },
    {
      icon: Wand2,
      title: 'Créez votre première histoire',
      body: 'Choisissez une intention (dormir, se calmer, se concentrer, s\'amuser) et laissez la magie opérer. Votre histoire est prête en moins de 60 secondes.',
      cta: 'Créer ma première histoire',
      action: () => finish('/app/create-story/step-1'),
      secondaryCta: 'Explorer l\'app',
      secondaryAction: () => finish('/app'),
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-floating">
        <CardContent className="p-8">
          {/* progress dots */}
          <div className="flex justify-center gap-2 mb-6" aria-label="Progression">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/50' : 'w-4 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display italic text-3xl mb-3">{current.title}</h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">{current.body}</p>

            <div className="flex flex-col gap-2">
              <Button size="lg" className="w-full gap-2" onClick={current.action}>
                {current.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {current.secondaryCta && (
                <Button variant="ghost" onClick={current.secondaryAction}>
                  {current.secondaryCta}
                </Button>
              )}
              {step === 0 && (
                <button
                  type="button"
                  onClick={() => finish('/app')}
                  className="text-xs text-muted-foreground hover:text-foreground mt-2"
                >
                  Passer l'introduction
                </button>
              )}
            </div>
          </div>

          {/* trust line */}
          {step === 0 && (
            <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
              {[
                'Essai gratuit 30 jours, sans carte requise',
                'Données chiffrées, conformes RGPD',
                'Annulation en 1 clic à tout moment',
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Welcome;
