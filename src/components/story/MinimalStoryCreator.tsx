
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useMinimalStoryCreator from "@/hooks/stories/useMinimalStoryCreator";
import ChildrenSelector from "@/components/story/minimal/ChildrenSelector";
import ObjectivesSelector from "@/components/story/minimal/ObjectivesSelector";
import StatusMessages from "@/components/story/minimal/StatusMessages";
import LoadingState from "@/components/story/minimal/LoadingState";
import SubmitButton from "@/components/story/minimal/SubmitButton";

/**
 * Composant autonome et minimaliste pour la création d'histoires
 * Contourne les problèmes des systèmes complexes existants
 */
const MinimalStoryCreator: React.FC = () => {
  const navigate = useNavigate();
  const {
    children,
    objectives,
    selectedChildrenIds,
    selectedObjective,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    setSelectedObjective,
    handleChildToggle,
    handleSubmit
  } = useMinimalStoryCreator();
  
  // Afficher un loader pendant le chargement des données
  if (isLoading) {
    return <LoadingState />;
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Créer une histoire (Mode simplifié)</h1>
          <p className="text-muted-foreground">
            Version minimaliste pour contourner les problèmes techniques
          </p>
        </div>
        
        <StatusMessages error={error} successMessage={successMessage} />
        
        {/* Sélection des enfants */}
        <div className="space-y-4 mb-6">
          <ChildrenSelector
            children={children}
            selectedChildrenIds={selectedChildrenIds}
            onChildToggle={handleChildToggle}
            error={error}
          />
          
          {children.length === 0 && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/profiles")}
            >
              Créer un profil enfant
            </Button>
          )}
        </div>
        
        {/* Sélection de l'objectif */}
        <div className="space-y-4 mb-8">
          <ObjectivesSelector
            objectives={objectives}
            selectedObjective={selectedObjective}
            onObjectiveSelect={setSelectedObjective}
            error={error}
          />
        </div>
        
        {/* Bouton de soumission */}
        <SubmitButton 
          isSubmitting={isSubmitting} 
          disabled={children.length === 0} 
        />
      </form>
    </div>
  );
};

export default MinimalStoryCreator;
