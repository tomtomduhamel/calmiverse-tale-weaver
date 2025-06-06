
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";
import type { Objective } from "@/types/story";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface StoryFormV2Props {
  children: Child[];
  objectives: Objective[];
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  onStoryCreated: (story: Story) => void;
  onCreateChild?: () => void;
}

/**
 * Version 2 du formulaire d'histoire - plus simple et directe
 */
const StoryFormV2: React.FC<StoryFormV2Props> = ({
  children,
  objectives,
  onSubmit,
  onStoryCreated,
  onCreateChild
}) => {
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Sélection/désélection d'enfant
  const handleChildSelect = (childId: string) => {
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      return isSelected 
        ? prev.filter(id => id !== childId)
        : [...prev, childId];
    });
  };
  
  // Validation du formulaire
  const validateForm = () => {
    if (selectedChildrenIds.length === 0) {
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant" };
    }
    
    if (!selectedObjective) {
      return { isValid: false, error: "Veuillez sélectionner un objectif" };
    }
    
    return { isValid: true, error: null };
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const validation = validateForm();
    if (!validation.isValid) {
      setFormError(validation.error);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      const storyId = await onSubmit({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      if (storyId && onStoryCreated) {
        const tempStory: Story = {
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: selectedChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          content: "", // CORRECTION: utiliser 'content' au lieu de 'story_text'
          story_summary: "",
          objective: selectedObjective
        };
        
        onStoryCreated(tempStory);
      }
      
      // Réinitialiser le formulaire
      setSelectedChildrenIds([]);
      setSelectedObjective("");
      
      toast({
        title: "Histoire créée",
        description: "Votre histoire est en cours de génération",
      });
      
    } catch (error: any) {
      setFormError(error?.message || "Erreur lors de la création");
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la création",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isButtonDisabled = isSubmitting || selectedChildrenIds.length === 0 || !selectedObjective;
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">
          Créer une nouvelle histoire
        </CardTitle>
        <CardDescription>
          Personnalisez une histoire magique pour vos enfants
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erreurs */}
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          {/* Sélection des enfants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pour qui est cette histoire ?</h3>
            
            {children.length > 0 ? (
              <div className="space-y-2">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChildrenIds.includes(child.id)
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleChildSelect(child.id)}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedChildrenIds.includes(child.id)
                        ? "bg-primary border-primary"
                        : "border-gray-300"
                    }`}>
                      {selectedChildrenIds.includes(child.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{child.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date().getFullYear() - new Date(child.birthDate).getFullYear()} ans
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  Aucun profil enfant trouvé
                </p>
              </div>
            )}
            
            {onCreateChild && (
              <Button
                type="button"
                variant="outline"
                onClick={onCreateChild}
                className="w-full"
              >
                Créer un profil enfant
              </Button>
            )}
          </div>
          
          {/* Sélection de l'objectif */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quel est l'objectif ?</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {objectives.map((objective) => (
                <div
                  key={objective.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedObjective === objective.value
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedObjective(objective.value)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedObjective === objective.value
                        ? "bg-primary border-primary"
                        : "border-gray-300"
                    }`} />
                    <span className="font-medium">{objective.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bouton de soumission */}
          <Button
            type="submit"
            className="w-full py-6 text-lg"
            disabled={isButtonDisabled}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Générer l'histoire
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StoryFormV2;
