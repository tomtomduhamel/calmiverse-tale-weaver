import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, X, RefreshCw } from "lucide-react";
import { useN8nStoryCreation } from "@/hooks/stories/useN8nStoryCreation";
import { useN8nFormState } from "@/hooks/stories/n8n/useN8nFormState";
import N8nChildrenSelector from "./N8nChildrenSelector";
import N8nObjectiveSelector from "./N8nObjectiveSelector";
import type { Child } from "@/types/child";
interface N8nStoryCreatorProps {
  children: Child[];
  onStoryCreated?: (storyId: string) => void;
}
const N8nStoryCreator: React.FC<N8nStoryCreatorProps> = ({
  children,
  onStoryCreated
}) => {
  const {
    createStoryWithN8n,
    isGenerating,
    cancelStoryCreation
  } = useN8nStoryCreation();
  const {
    selectedChildrenIds,
    selectedObjective,
    setSelectedObjective,
    handleChildSelect,
    resetForm,
    isFormValid,
    hasChildren
  } = useN8nFormState({
    children
  });

  // Debug initial au rendu
  console.log('[N8nStoryCreator] Rendu avec props:', {
    childrenReceived: !!children,
    childrenType: typeof children,
    childrenIsArray: Array.isArray(children),
    childrenCount: children?.length || 0,
    childrenData: children?.map(c => ({
      id: c.id,
      name: c.name
    })) || [],
    onStoryCreatedDefined: !!onStoryCreated,
    timestamp: new Date().toISOString()
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChildrenIds.length === 0) {
      console.error("[N8nStoryCreator] Aucun enfant sélectionné");
      return;
    }
    if (!selectedObjective) {
      console.error("[N8nStoryCreator] Aucun objectif sélectionné");
      return;
    }
    try {
      console.log("[N8nStoryCreator] Soumission avec:", {
        selectedChildrenIds,
        selectedObjective,
        childrenData: children?.filter(c => selectedChildrenIds.includes(c.id)) || []
      });
      const result = await createStoryWithN8n({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      }, children);
      if (result && onStoryCreated) {
        onStoryCreated(result.storyId || 'n8n-pending');
      }
      resetForm();
    } catch (error) {
      console.error('Erreur création histoire n8n:', error);
    }
  };

  const handleCancel = () => {
    console.log("[N8nStoryCreator] Annulation de la création d'histoire");
    cancelStoryCreation();
    resetForm();
  };

  const handleRestart = () => {
    console.log("[N8nStoryCreator] Redémarrage du formulaire");
    resetForm();
  };
  return <Card className="border-primary/20 bg-white/80 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary-dark">
          <Sparkles className="h-5 w-5" />
          Créer votre histoire personnalisée
          
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isGenerating ? (
            <>
              <N8nChildrenSelector children={children} selectedChildrenIds={selectedChildrenIds} onChildSelect={handleChildSelect} hasChildren={hasChildren} />

              <N8nObjectiveSelector selectedObjective={selectedObjective} onObjectiveSelect={setSelectedObjective} />

              <Button type="submit" disabled={!isFormValid || !hasChildren} className="w-full bg-primary hover:bg-primary/90 text-white" size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Créer mon histoire
              </Button>
            </>
          ) : (
            <div className="space-y-6">
              {/* Message d'attente */}
              <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                <div className="flex justify-center mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Création de votre histoire en cours...
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200 mb-4">
                  Notre IA travaille sur votre histoire personnalisée. Cela peut prendre quelques minutes.
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-300">
                  ✨ Génération du contenu adapté à l'âge des enfants<br/>
                  📖 Personnalisation selon leurs préférences<br/>
                  🎨 Finalisation de l'histoire
                </div>
              </div>

              {/* Boutons d'action pendant l'attente */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler la création
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRestart}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Nouvelle histoire
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Informations pour l'utilisateur - uniquement si pas en génération */}
        {!isGenerating && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">✨ Comment ça marche ?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Sélectionnez un ou plusieurs enfants</li>
                <li>Choisissez l'objectif de l'histoire</li>
                <li>Notre IA génère une histoire unique et personnalisée</li>
                <li>L'histoire apparaîtra dans votre bibliothèque</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>;
};
export default N8nStoryCreator;