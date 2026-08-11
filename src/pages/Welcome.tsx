import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  Moon, 
  Heart, 
  Brain, 
  Rocket, 
  ArrowRight, 
  Check, 
  Loader2,
  Smile,
  User
} from 'lucide-react';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useSupabaseChildren } from '@/hooks/useSupabaseChildren';
import { useTitleGeneration } from '@/contexts/TitleGenerationContext';
import { analytics } from '@/utils/analytics';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ChildGender } from '@/types/child';

const AGE_RANGES = [
  { label: '2-3 ans', years: 2.5 },
  { label: '4-5 ans', years: 4.5 },
  { label: '6-7 ans', years: 6.5 },
  { label: '8-9 ans', years: 8.5 },
  { label: '10+ ans', years: 11 },
];

const OBJECTIVES = [
  {
    id: 'sleep',
    title: 'Sommeil paisible',
    desc: 'Rituel du coucher doux et apaisant',
    icon: Moon,
    color: 'from-indigo-500/20 to-purple-500/20 text-indigo-500 border-indigo-200/50 dark:border-indigo-800/50',
  },
  {
    id: 'relax',
    title: 'Apaiser les émotions',
    desc: 'Calmer les colères, peurs ou la fatigue',
    icon: Heart,
    color: 'from-rose-500/20 to-orange-500/20 text-rose-500 border-rose-200/50 dark:border-rose-800/50',
  },
  {
    id: 'focus',
    title: 'Se concentrer',
    desc: 'Canaliser l’attention et se poser',
    icon: Brain,
    color: 'from-amber-500/20 to-yellow-500/20 text-amber-500 border-amber-200/50 dark:border-amber-800/50',
  },
  {
    id: 'fun',
    title: 'Aventure & Magie',
    desc: 'Un conte captivant plein d’imagination',
    icon: Rocket,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-200/50 dark:border-emerald-800/50',
  },
];

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { markCompleted } = useOnboardingStatus();
  const { children, handleAddChild } = useSupabaseChildren();
  const { updateSelectedChildren, updateSelectedObjective } = useTitleGeneration();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire Enfant Express
  const [childName, setChildName] = useState('');
  const [selectedAgeRange, setSelectedAgeRange] = useState<number | null>(4.5);
  const [gender, setGender] = useState<ChildGender>('boy');
  const [teddyOrInterest, setTeddyOrInterest] = useState('');
  const [createdChildId, setCreatedChildId] = useState<string | null>(null);

  // Étape 1 : Création express du profil enfant
  const handleCreateChildStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) {
      toast({
        title: "Prénom requis",
        description: "Veuillez renseigner le prénom de l'enfant.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calcul d'une date de naissance cohérente selon la tranche choisie
      const yearsAgo = selectedAgeRange ?? 4.5;
      const birthDate = new Date();
      birthDate.setMonth(birthDate.getMonth() - Math.round(yearsAgo * 12));

      const newChildId = await handleAddChild({
        name: childName.trim(),
        birthDate,
        gender,
        interests: teddyOrInterest.trim() ? [teddyOrInterest.trim()] : [],
        teddyName: teddyOrInterest.trim() || undefined,
        teddyDescription: '',
        teddyPhotos: [],
        imaginaryWorld: '',
      });

      setCreatedChildId(newChildId);
      updateSelectedChildren([newChildId]);
      
      analytics.track('onboarding_child_created', { childId: newChildId }, user?.id);
      
      // Passer à l'étape 2 (choix de l'objectif)
      setStep(2);
    } catch (err: any) {
      console.error('[Welcome Onboarding] Erreur création enfant:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le profil pour le moment. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Étape 2 : Choix de l'objectif et lancement direct
  const handleSelectObjective = async (objectiveId: string) => {
    setIsSubmitting(true);
    try {
      updateSelectedObjective(objectiveId);
      
      const childId = createdChildId || (children.length > 0 ? children[0].id : undefined);
      if (childId) {
        updateSelectedChildren([childId]);
      }

      await markCompleted();
      analytics.track('onboarding_completed', { 
        objective: objectiveId,
        childId
      }, user?.id);

      toast({
        title: "C'est parti !",
        description: "Génération de vos idées d'histoires en cours...",
      });

      // Redirection directe vers le générateur de titres
      navigate('/app/create-story-titles', { replace: true });
    } catch (err: any) {
      console.error('[Welcome Onboarding] Erreur finalisation:', err);
      navigate('/app/create-story/step-1', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    await markCompleted();
    analytics.track('onboarding_skipped', {}, user?.id);
    navigate('/app', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div aria-hidden className="absolute -top-32 -left-32 w-96 h-96 bg-primary-soft/20 rounded-full blur-3xl animate-drift" />
      <div aria-hidden className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/25 rounded-full blur-3xl animate-drift" style={{ animationDelay: '2s' }} />

      <Card className="w-full max-w-xl shadow-floating border-primary-soft/20 bg-card/90 backdrop-blur-xl rounded-3xl relative z-10 animate-fade-in overflow-hidden">
        {/* Barre de progression discrète */}
        <div className="h-1.5 w-full bg-muted/60">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-calm"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Étape {step} sur 2 · Configuration express
            </div>
            
            <h1 className="font-display italic text-2xl sm:text-3xl text-foreground tracking-tight">
              {step === 1 
                ? "Pour qui créons-nous des histoires ?" 
                : `Quelle est l'histoire pour ${childName || 'votre enfant'} ?`
              }
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {step === 1 
                ? "Quelques détails suffisent pour donner vie à un univers sur-mesure."
                : "Choisissez un objectif pour générer vos 3 premiers titres magiques en quelques secondes."
              }
            </p>
          </div>

          {/* ÉTAPE 1 : Formulaire Enfant Express */}
          {step === 1 && (
            <form onSubmit={handleCreateChildStep} className="space-y-5 animate-fade-in">
              {/* Prénom */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Prénom de l'enfant <span className="text-primary">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ex : Léo, Emma, Jules..."
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                  autoFocus
                  disabled={isSubmitting}
                  className="h-11 text-base bg-background/80"
                />
              </div>

              {/* Tranche d'âge en 1 clic */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Âge
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {AGE_RANGES.map((age) => (
                    <button
                      key={age.label}
                      type="button"
                      onClick={() => setSelectedAgeRange(age.years)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                        selectedAgeRange === age.years
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]'
                          : 'bg-background/60 hover:bg-muted text-muted-foreground border-border/70'
                      }`}
                    >
                      {age.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre / Profil */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Genre
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'boy', label: 'Garçon' },
                    { key: 'girl', label: 'Fille' },
                    { key: 'unknown', label: 'Autre / Neutre' },
                  ].map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setGender(g.key as ChildGender)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium transition-all border ${
                        gender === g.key
                          ? 'bg-primary/15 text-primary border-primary font-semibold'
                          : 'bg-background/60 text-muted-foreground border-border/70 hover:bg-muted'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doudou ou passion (Facultatif) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Doudou ou passion favorite</span>
                  <span className="text-[11px] font-normal text-muted-foreground">Optionnel</span>
                </label>
                <Input
                  type="text"
                  placeholder="Ex : Son doudou lapin bleu, les dinosaures, l'espace..."
                  value={teddyOrInterest}
                  onChange={(e) => setTeddyOrInterest(e.target.value)}
                  disabled={isSubmitting}
                  className="h-10 text-sm bg-background/80"
                />
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2 text-base font-semibold shadow-glow-primary hover:shadow-floating transition-all h-12"
                  disabled={isSubmitting || !childName.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création du profil...
                    </>
                  ) : (
                    <>
                      Continuer vers la première histoire
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                  >
                    Passer et explorer l'application
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ÉTAPE 2 : Choix de l'intention en 1 clic */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OBJECTIVES.map((obj) => {
                  const Icon = obj.icon;
                  return (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => handleSelectObjective(obj.id)}
                      disabled={isSubmitting}
                      className={`p-4 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-floating bg-gradient-to-br ${obj.color} group relative overflow-hidden`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-background/80 shadow-sm shrink-0">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {obj.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {obj.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Modifier le profil de {childName}
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Explorer sans choisir
                </button>
              </div>
            </div>
          )}

          {/* Réassurance discrète */}
          <div className="pt-2">
            <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground/80">
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                Essai 30 jours
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                Profil modifiable à tout moment
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                100% sécurisé
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Welcome;
