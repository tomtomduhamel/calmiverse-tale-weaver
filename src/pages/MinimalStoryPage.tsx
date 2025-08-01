import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useAppNavigation } from "@/hooks/navigation/useAppNavigation";
import { useSearchParams } from "react-router-dom";
import MinimalStoryCreator from "@/components/story/MinimalStoryCreator";

/**
 * Page simplifiée pour la création d'histoires
 * Utilise le composant autonome MinimalStoryCreator
 * Navigation corrigée avec useAppNavigation
 */
const MinimalStoryPage: React.FC = () => {
  const { navigateToLibrary } = useAppNavigation();
  const [searchParams] = useSearchParams();
  const preSelectedChildId = searchParams.get('childId') || undefined;
  return <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
      <div className="flex items-center justify-center mb-4">
        
        <h1 className="text-2xl font-bold">Création d'histoire pour vos enfants</h1>
      </div>
      
      
      
      <MinimalStoryCreator preSelectedChildId={preSelectedChildId} />
    </div>;
};
export default MinimalStoryPage;