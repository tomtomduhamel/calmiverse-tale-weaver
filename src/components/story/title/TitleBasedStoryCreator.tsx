
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import { useN8nTitleGeneration } from "@/hooks/stories/useN8nTitleGeneration";
import { useN8nStoryFromTitle } from "@/hooks/stories/useN8nStoryFromTitle";
import { useN8nFormState } from "@/hooks/stories/n8n/useN8nFormState";
import N8nChildrenSelector from "../n8n/N8nChildrenSelector";
import N8nObjectiveSelector from "../n8n/N8nObjectiveSelector";
import TitleSelector from "./TitleSelector";
import type { Child } from "@/types/child";

interface TitleBasedStoryCreatorProps {
  children: Child[];
  onStoryCreated?: (storyId: string) => void;
}

const TitleBasedStoryCreator: React.FC<TitleBasedStoryCreatorProps> = ({
  children,
  onStoryCreated
}) => {
  const [currentStep, setCurrentStep] = useState<'form' | 'titles' | 'creating'>('form');
  
  const { generateTitles, generatedTitles, isGeneratingTitles, clearTitles } = useN8nTitleGeneration();
  const { createStoryFromTitle, isCreatingStory } = useN8nStoryFromTitle();
  
  const {
    selectedChildrenIds,
    selectedObjective,
    setSelectedObjective,
    handleChildSelect,
    resetForm,
    isFormValid,
    hasChildren
  } = useN8nFormState({ children });

  const handleGenerateTitles = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || !hasChildren) {
      return;
    }

    try {
      const childrenNames = children
        .filter(child => selectedChildrenIds.includes(child.id))
        .map(child => child.name);

      await generateTitles({
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames
      });

      setCurrentStep('titles');
    } catch (error) {
      console.error('Erreur génération titres:', error);
    }
  };

  const handleSelectTitle = async (selectedTitle: string) => {
    try {
      setCurrentStep('creating');

      const childrenNames = children
        .filter(child => selectedChildrenIds.includes(child.id))
        .map(child => child.name);

      const storyId = await createStoryFromTitle({
        selectedTitle,
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames
      });

      if (onStoryCreated) {
        onStoryCreated(storyId);
      }

      // Reset après succès
      resetForm();
      clearTitles();
      setCurrentStep('form');
    } catch (error) {
      console.error('Erreur création histoire:', error);
      setCurrentStep('titles'); // Retour à la sélection de titres
    }
  };

  const handleStartOver = () => {
    resetForm();
    clearTitles();
    setCurrentStep('form');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'form':
        return (
          <form onSubmit={handleGenerateTitles} className="space-y-4">
            <N8nChildrenSelector
              children={children}
              selectedChildrenIds={selectedChildrenIds}
              onChildSelect={handleChildSelect}
              hasChildren={hasChildren}
            />

            <N8nObjectiveSelector
              selectedObjective={selectedObjective}
              onObjectiveSelect={setSelectedObjective}
            />

            <Button 
              type="submit" 
              disabled={!isFormValid || isGeneratingTitles || !hasChildren}
              className="w-full bg-primary hover:bg-primary/90 text-white"
              size="lg"
            >
              {isGeneratingTitles ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération des titres...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer 3 titres
                </>
              )}
            </Button>
          </form>
        );

      case 'titles':
        return (
          <div className="space-y-4">
            <TitleSelector
              titles={generatedTitles}
              onSelectTitle={handleSelectTitle}
              isCreatingStory={isCreatingStory}
            />
            
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleStartOver}
                disabled={isCreatingStory}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Recommencer
              </Button>
            </div>
          </div>
        );

      case 'creating':
      default:
        return (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Création de votre histoire...</h3>
            <p className="text-muted-foreground">
              Nous préparons votre histoire personnalisée, veuillez patienter.
            </p>
          </div>
        );
    }
  };

  return (
    <Card className="border-primary/20 bg-white/80 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary-dark">
          <Sparkles className="h-5 w-5" />
          Créer avec sélection de titres
          <Badge variant="secondary" className="ml-2">Nouveau</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choisissez d'abord vos paramètres, puis sélectionnez parmi 3 titres générés
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderStep()}

        {/* Informations pour l'utilisateur */}
        {currentStep === 'form' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">✨ Comment ça marche ?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Sélectionnez un ou plusieurs enfants</li>
                <li>Choisissez l'objectif de l'histoire</li>
                <li>Nous générons 3 titres d'histoires personnalisés</li>
                <li>Choisissez votre titre préféré</li>
                <li>L'histoire complète est créée automatiquement</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TitleBasedStoryCreator;
