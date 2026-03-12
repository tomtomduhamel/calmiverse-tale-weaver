import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Users, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useTitleGeneration } from '@/contexts/TitleGenerationContext';
import { useN8nStoryFromTitle } from '@/hooks/stories/useN8nStoryFromTitle';
import { useRealtimeStoryMonitor } from '@/hooks/stories/useRealtimeStoryMonitor';
import { useQuotaChecker } from '@/hooks/subscription/useQuotaChecker';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import TitleSelector from './TitleSelector';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import type { Child } from '@/types/child';
import type { StoryDurationMinutes } from '@/types/story';

interface TitleBasedStoryCreatorProps {
  children: Child[];
  onStoryCreated: (storyId: string) => void;
  preSelectedChildId?: string;
}

const TitleBasedStoryCreator: React.FC<TitleBasedStoryCreatorProps> = ({
  children,
  onStoryCreated,
  preSelectedChildId
}) => {
  // 🔍 Log IMMÉDIAT au début du composant pour debug
  console.log('[TitleBasedStoryCreator] === DÉBUT RENDU ===', {
    childrenReceived: children?.length,
    preSelectedChildId
  });

  const navigate = useNavigate();

  // Utiliser le contexte global
  const {
    currentStep,
    selectedChildrenIds,
    selectedObjective,
    generatedTitles,
    selectedTitle,
    selectedDuration,
    regenerationUsed,
    titleGenerationCost,
    generationInterrupted,
    updateCurrentStep,
    updateSelectedChildren,
    updateSelectedObjective,
    updateGeneratedTitles,
    updateSelectedTitle,
    updateSelectedDuration,
    incrementRegeneration,
    updateTitleGenerationCost,
    setIsGeneratingTitles,
    clearGenerationInterrupted,
    clearPersistedState,
    hasPersistedSession,
    forceSave,
    // N8n logic from context
    generateTitles,
    generateAdditionalTitles,
    clearTitles,
    isGeneratingTitles,
    canRegenerate
  } = useTitleGeneration();

  const { toast } = useToast();
  const { validateAction, incrementUsage } = useQuotaChecker();
  const { subscription } = useSubscription();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState<string>('');
  const [isStartingCreation, setIsStartingCreation] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const {
    createStoryFromTitle,
    isCreatingStory
  } = useN8nStoryFromTitle();

  // Utiliser le monitoring en temps réel
  const {
    isMonitoring,
    startMonitoring
  } = useRealtimeStoryMonitor({
    onStoryCreated: story => {
      console.log('[TitleBasedStoryCreator] Histoire détectée par Realtime:', story.id);
      onStoryCreated(story.id);
    },
    onTimeout: () => {
      console.log('[TitleBasedStoryCreator] Timeout du monitoring');
      onStoryCreated('timeout');
    },
    timeoutMs: 120000
  });

  // Guards synchrones
  const isSubmittingRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const autoGenerateTriggered = useRef(false);
  const lastGenerationTimeRef = useRef<number>(0);
  const GENERATION_COOLDOWN_MS = 5000;
  const autoRetryCount = useRef(0);
  const MAX_AUTO_RETRIES = 2;
  const generationParamsRef = useRef({ selectedChildrenIds, selectedObjective, children });

  // Mettre à jour la ref quand les données changent
  useEffect(() => {
    generationParamsRef.current = { selectedChildrenIds, selectedObjective, children };
  }, [selectedChildrenIds, selectedObjective, children]);

  // Effect pour gérer l'auto-génération des titres
  useEffect(() => {
    // Vérifications préliminaires
    // NOTE: On considère que ce composant est monté UNIQUEMENT quand on devrait gérer les titres

    if (generationInterrupted) {
      console.log('[TitleBasedStoryCreator] Génération interrompue détectée');
      return;
    }

    if (autoGenerateTriggered.current || isGeneratingRef.current || isGeneratingTitles || generatedTitles.length > 0) {
      return;
    }

    const { selectedChildrenIds: ids, selectedObjective: obj, children: childrenList } = generationParamsRef.current;

    if (ids.length === 0 || !obj) {
      console.log('[TitleBasedStoryCreator] Données insuffisantes pour auto-génération');
      return;
    }

    // Lancer la génération
    autoGenerateTriggered.current = true;
    isGeneratingRef.current = true;
    lastGenerationTimeRef.current = Date.now();
    setIsGeneratingTitles(true);
    forceSave();

    console.log('[TitleBasedStoryCreator] Auto-génération des titres...');
    const selectedChildrenForGen = childrenList.filter(child => ids.includes(child.id));

    generateTitles({
      objective: obj,
      childrenIds: ids,
      childrenNames: selectedChildrenForGen.map(c => c.name),
      childrenGenders: selectedChildrenForGen.map(c => c.gender)
    }).then(titles => {
      if (titles && titles.length > 0) {
        updateCurrentStep('titles');
        setGenerationError(null);
      }
    }).catch(error => {
      console.error('[TitleBasedStoryCreator] Erreur auto-génération:', error);
      setGenerationError(error.message || "Impossible de générer les titres. Veuillez vérifier votre connexion.");
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer les titres",
        variant: "destructive"
      });
    }).finally(() => {
      setIsGeneratingTitles(false);
      setTimeout(() => {
        isGeneratingRef.current = false;
      }, 1000);
    });
  }, [generatedTitles.length, isGeneratingTitles, generationInterrupted, generateTitles, updateCurrentStep, setIsGeneratingTitles, forceSave, toast, generationError]);

  // Regénérer des titres
  const handleRegenerateTitles = useCallback(async () => {
    if (!selectedObjective || selectedChildrenIds.length === 0) return;
    try {
      const selectedChildrenForTitles = children.filter(child => selectedChildrenIds.includes(child.id));
      await generateAdditionalTitles({
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames: selectedChildrenForTitles.map(c => c.name),
        childrenGenders: selectedChildrenForTitles.map(c => c.gender)
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de regénérer les titres",
        variant: "destructive"
      });
    }
  }, [selectedObjective, selectedChildrenIds, children, generateAdditionalTitles, toast]);

  // Handler pour relancer après interruption
  const handleRetryAfterInterruption = useCallback(() => {
    clearGenerationInterrupted();
    setGenerationError(null);
    autoGenerateTriggered.current = false;
  }, [clearGenerationInterrupted]);

  // Handler pour relancer après erreur de réseau ("Failed to fetch" etc)
  const handleRetryAfterError = useCallback(() => {
    setGenerationError(null);
    autoGenerateTriggered.current = false;
  }, []);

  // Création finale de l'histoire
  const handleCreateStory = useCallback(async (titleToUse: string, durationMinutes: StoryDurationMinutes) => {
    if (isSubmittingRef.current || isCreatingStory) {
      console.log('[TitleBasedStoryCreator] Création déjà en cours, clic ignoré.');
      return;
    }

    isSubmittingRef.current = true;
    setIsStartingCreation(true);

    try {
      const validation = await validateAction('create_story');

      if (!validation.allowed) {
        toast({
          title: "Limite atteinte",
          description: validation.reason || "Quota atteint",
          variant: "destructive"
        });
        setQuotaMessage(validation.reason || 'Limite atteinte');
        setShowUpgradePrompt(true);
        isSubmittingRef.current = false;
        setIsStartingCreation(false);
        return;
      }

      const selectedChildrenForStory = children.filter(child => selectedChildrenIds.includes(child.id));
      const childrenNames = selectedChildrenForStory.map(child => child.name);

      updateSelectedTitle(titleToUse);
      updateSelectedDuration(durationMinutes);
      updateCurrentStep('creating');

      const cleanupMonitoring = startMonitoring();

      await createStoryFromTitle({
        selectedTitle: titleToUse,
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames,
        childrenGenders: selectedChildrenForStory.map(child => child.gender),
        children: selectedChildrenForStory,
        durationMinutes,
        titleGenerationCost,
      });

      await incrementUsage('story');

      toast({
        title: "✨ Création lancée !",
        description: "Vous recevrez une notification quand votre histoire sera prête."
      });

      clearPersistedState();
      onStoryCreated('library');
    } catch (error: any) {
      console.error('[TitleBasedStoryCreator] Erreur création:', error);
      updateCurrentStep('titles');
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'histoire",
        variant: "destructive"
      });
    } finally {
      isSubmittingRef.current = false;
      setIsStartingCreation(false);
    }
  }, [selectedObjective, selectedChildrenIds, children, createStoryFromTitle, startMonitoring, updateSelectedTitle, updateSelectedDuration, updateCurrentStep, validateAction, incrementUsage, toast, titleGenerationCost]);

  const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));

  // --- RENDU ---

  // Cas 1: Interruption
  if (generationInterrupted) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <RefreshCw className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">⏸️ Génération interrompue</h3>
            <p className="text-muted-foreground">Voulez-vous reprendre ?</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate('/create-story/step-1')}>
            Revenir au début
          </Button>
          <Button onClick={handleRetryAfterInterruption}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reprendre
          </Button>
        </div>
      </div>
    );
  }

  // Cas 2: Génération en cours (et pas de titres)
  if (isGeneratingTitles && generatedTitles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">✨ Calmi crée vos titres...</h3>
            <p className="text-muted-foreground">
              Cela prend quelques secondes. Vous pouvez changer d'application, la génération continuera.
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => {
            clearTitles();
            setIsGeneratingTitles(false);
            autoGenerateTriggered.current = false;
            navigate('/create-story/step-2');
          }}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  // Cas 3: Erreur de génération
  if (generationError && generatedTitles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center w-full">
            <Alert variant="destructive" className="max-w-md text-left">
              <AlertDescription>
                {generationError === "Failed to fetch" 
                  ? "Un problème de connexion est survenu (Failed to fetch). Assurez-vous d'être connecté à internet." 
                  : generationError}
              </AlertDescription>
            </Alert>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Oups, la génération a échoué</h3>
            <p className="text-muted-foreground">Nous n'avons pas pu générer les titres d'histoire.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate('/create-story/step-2')}>
            Retour aux objectifs
          </Button>
          <Button onClick={handleRetryAfterError}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer maintenant
          </Button>
        </div>
      </div>
    );
  }

  // Cas 3: Affichage des titres (ou état initial vide en attente de génération)
  return (
    <>
      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        currentTier={subscription?.tier || 'calmini'}
        reason="stories"
        message={quotaMessage}
        onUpgrade={() => navigate('/pricing')}
        onCancel={() => setShowUpgradePrompt(false)}
      />

      <div className="space-y-6">
        {/* Si on a des titres, on affiche le sélecteur, sinon rien (le loader devrait être actif) */}
        {generatedTitles.length > 0 ? (
          <TitleSelector
            titles={generatedTitles}
            onSelectTitle={handleCreateStory}
            onRegenerateTitles={canRegenerate ? handleRegenerateTitles : undefined}
            canRegenerate={canRegenerate}
            isCreatingStory={isCreatingStory || isStartingCreation}
            isRegenerating={isGeneratingTitles}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Préparation de la génération...
          </div>
        )}

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => navigate('/create-story/step-2')}>
            Retour au choix de l'objectif
          </Button>
        </div>
      </div>
    </>
  );
};

export default TitleBasedStoryCreator;