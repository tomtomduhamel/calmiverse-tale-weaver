import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAppNavigation } from "@/hooks/navigation/useAppNavigation";
import MinimalStoryCreator from "@/components/story/MinimalStoryCreator";

/**
 * Page simplifiée pour la création d'histoires
 * Utilise le composant autonome MinimalStoryCreator
 * Navigation corrigée avec useAppNavigation
 */
const MinimalStoryPage: React.FC = () => {
  const {
    navigateToLibrary
  } = useAppNavigation();
  return <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
      <div className="flex items-center justify-center mb-4">
        
        <h1 className="text-2xl font-bold">Création d'histoire pour vos enfants</h1>
      </div>
      
      <div className="bg-muted/10 p-3 rounded-lg border border-muted mb-6">
        
      </div>
      
      <MinimalStoryCreator />
    </div>;
};
export default MinimalStoryPage;