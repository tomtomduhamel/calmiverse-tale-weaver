
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";
import type { Objective } from "@/types/story";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DirectStoryFormProps {
  children: Child[];
  onCreateChild: () => void;
  objectives: Objective[];
  selectedChildrenIds: string[];
  selectedObjective: string;
  isSubmitting: boolean;
  formError: string | null;
  onChildSelect: (childId: string) => void;
  onObjectiveSelect: (objective: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Composant de formulaire direct pour la création d'histoires
 * Version simplifiée qui reçoit toutes les props nécessaires
 */
const DirectStoryForm: React.FC<DirectStoryFormProps> = ({
  children,
  onCreateChild,
  objectives,
  selectedChildrenIds,
  selectedObjective,
  isSubmitting,
  formError,
  onChildSelect,
  onObjectiveSelect,
  onSubmit
}) => {
  const { toast } = useToast();
  
  console.log("[DirectStoryForm] Rendu avec:", {
    childrenCount: children?.length || 0,
    selectedChildrenIds,
    selectedObjective,
    isSubmitting,
    formError
  });

  // Vérifier si le bouton doit être désactivé
  const isButtonDisabled = isSubmitting || selectedChildrenIds.length === 0 || !selectedObjective;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Créer une nouvelle histoire
          </CardTitle>
          <CardDescription>
            Personnalisez une histoire magique pour vos enfants
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Affichage des erreurs */}
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            {/* Section de sélection des enfants */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pour qui est cette histoire ?</h3>
              
              {children && children.length > 0 ? (
                <ScrollArea className="h-48 border rounded-md p-4">
                  <div className="space-y-2">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChildrenIds.includes(child.id)
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => onChildSelect(child.id)}
                        data-child-id={child.id}
                        data-selected={selectedChildrenIds.includes(child.id) ? "true" : "false"}
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
                        <div className="flex-1">
                          <div className="font-medium">{child.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date().getFullYear() - new Date(child.birthDate).getFullYear()} ans
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    Aucun profil enfant trouvé. Créez-en un pour commencer !
                  </p>
                </div>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={onCreateChild}
                className="w-full"
              >
                Créer un profil enfant
              </Button>
            </div>
            
            {/* Section de sélection de l'objectif */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quel est l'objectif de cette histoire ?</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {objectives.map((objective) => (
                  <div
                    key={objective.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedObjective === objective.value
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50 border-border"
                    }`}
                    onClick={() => onObjectiveSelect(objective.value)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedObjective === objective.value
                          ? "bg-primary border-primary"
                          : "border-gray-300"
                      }`}>
                        {selectedObjective === objective.value && (
                          <div className="w-full h-full rounded-full bg-primary"></div>
                        )}
                      </div>
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
    </div>
  );
};

export default DirectStoryForm;
