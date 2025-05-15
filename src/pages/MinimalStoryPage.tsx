
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MinimalStoryCreator from "@/components/story/MinimalStoryCreator";

/**
 * Page simplifiée pour la création d'histoires
 * Utilise le composant autonome MinimalStoryCreator
 */
const MinimalStoryPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
        <h1 className="text-2xl font-bold">Création d'histoire simplifiée</h1>
      </div>
      
      <div className="bg-muted/10 p-3 rounded-lg border border-muted mb-6">
        <p className="text-sm text-muted-foreground">
          Cette page utilise une approche simplifiée pour contourner les problèmes techniques de création d'histoire.
          Elle communique directement avec la base de données pour plus de robustesse.
        </p>
      </div>
      
      <MinimalStoryCreator />
    </div>
  );
};

export default MinimalStoryPage;
