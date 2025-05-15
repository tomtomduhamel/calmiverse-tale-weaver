
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Child } from "@/types/child";
import type { Objective } from "@/types/story";

/**
 * Composant autonome et minimaliste pour la création d'histoires
 * Contourne les problèmes des systèmes complexes existants
 */
const MinimalStoryCreator: React.FC = () => {
  const navigate = useNavigate();
  
  // État local indépendant
  const [children, setChildren] = useState<Child[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Charger les enfants et les objectifs directement via Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Charger les profils d'enfants
        const { data: childrenData, error: childrenError } = await supabase
          .from("children")
          .select("*");
          
        if (childrenError) throw childrenError;
        
        // Mapper les données au format attendu par l'interface Child
        const mappedChildren = childrenData.map(child => ({
          id: child.id,
          authorId: child.authorid,
          name: child.name,
          birthDate: new Date(child.birthdate),
          interests: child.interests || [],
          gender: child.gender || 'unknown',
          createdAt: new Date(child.createdat)
        }));
        
        setChildren(mappedChildren);
        
        // Définir des objectifs par défaut
        setObjectives([
          { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
          { id: "focus", label: "Se concentrer", value: "focus" },
          { id: "relax", label: "Se relaxer", value: "relax" },
          { id: "fun", label: "S'amuser", value: "fun" },
        ]);
        
        // Sélectionner automatiquement le premier enfant si disponible
        if (mappedChildren.length > 0) {
          setSelectedChildrenIds([mappedChildren[0].id]);
        }
        
        // Sélectionner automatiquement le premier objectif
        setSelectedObjective("sleep");
        
      } catch (e: any) {
        console.error("Erreur lors du chargement des données:", e);
        setError("Impossible de charger les données nécessaires. Veuillez réessayer.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Gestionnaire de sélection d'enfant
  const handleChildToggle = (childId: string) => {
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      return isSelected ? prev.filter(id => id !== childId) : [...prev, childId];
    });
  };
  
  // Créer une histoire directement via Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validation minimale
    if (selectedChildrenIds.length === 0) {
      setError("Veuillez sélectionner au moins un enfant");
      return;
    }
    
    if (!selectedObjective) {
      setError("Veuillez sélectionner un objectif");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Récupérer les informations de session pour l'ID d'auteur
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        throw new Error("Vous devez être connecté pour créer une histoire");
      }
      
      // Récupérer les noms des enfants pour les stocker avec l'histoire
      const childrenNames = children
        .filter(child => selectedChildrenIds.includes(child.id))
        .map(child => child.name);
      
      // Créer une nouvelle histoire avec le statut "pending"
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .insert({
          title: "Histoire en cours de génération",
          authorid: userId,
          childrenids: selectedChildrenIds,
          childrennames: childrenNames,
          objective: selectedObjective,
          status: "pending",
          preview: "Génération en cours...",
          content: "",
          summary: "",
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .select("id")
        .single();
        
      if (storyError) throw storyError;
      
      // Appeler la fonction Supabase Edge pour générer l'histoire (en arrière-plan)
      try {
        const { error: funcError } = await supabase.functions.invoke("generateStory", {
          body: { storyId: storyData.id }
        });
        
        if (funcError) {
          console.warn("La fonction de génération a rencontré une erreur:", funcError);
          // Continuer malgré l'erreur car l'histoire est déjà créée
        }
      } catch (funcErr) {
        console.warn("Erreur lors de l'appel à la fonction:", funcErr);
        // Continuer car l'histoire est déjà créée
      }
      
      setSuccessMessage("Votre histoire a été créée avec succès! Redirection vers la bibliothèque...");
      
      // Rediriger vers la bibliothèque après une courte pause
      setTimeout(() => {
        navigate("/app");
      }, 1500);
      
    } catch (error: any) {
      console.error("Erreur lors de la création de l'histoire:", error);
      setError(error.message || "Une erreur est survenue lors de la création de l'histoire");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Afficher un loader pendant le chargement des données
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-center text-muted-foreground">
          Chargement des données nécessaires...
        </p>
      </div>
    );
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
        
        {/* Message d'erreur */}
        {error && (
          <div className="bg-destructive/10 border border-destructive p-4 rounded-lg text-destructive mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {/* Message de succès */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg text-green-700 dark:text-green-300 mb-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        
        {/* Sélection des enfants */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-medium">Pour qui est cette histoire ?</h2>
          
          {children.length > 0 ? (
            <div className="space-y-2">
              {children.map((child) => {
                const isSelected = selectedChildrenIds.includes(child.id);
                const age = new Date().getFullYear() - new Date(child.birthDate).getFullYear();
                
                return (
                  <div
                    key={child.id}
                    onClick={() => handleChildToggle(child.id)}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 hover:bg-primary/20" 
                        : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        isSelected 
                          ? "bg-primary border-primary text-white" 
                          : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
                      }`}>
                        {isSelected && (
                          <svg 
                            viewBox="0 0 24 24" 
                            width="16" 
                            height="16" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    <div className={`text-base font-medium leading-none transition-all ${
                      isSelected ? "font-semibold text-primary" : ""
                    }`}>
                      {child.name} ({age} ans)
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">
                Aucun profil enfant disponible. Vous devez créer un profil avant de générer une histoire.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/profiles")}
              >
                Créer un profil enfant
              </Button>
            </div>
          )}
        </div>
        
        {/* Sélection de l'objectif */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-medium">Je souhaite créer un moment de lecture qui va...</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {objectives.map((objective) => (
              <div
                key={objective.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border border-muted hover:bg-muted/30 dark:hover:bg-muted-dark/30 transition-colors cursor-pointer ${
                  selectedObjective === objective.value
                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                    : "bg-white dark:bg-gray-800"
                }`}
                onClick={() => setSelectedObjective(objective.value)}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedObjective === objective.value
                    ? "border-primary bg-primary"
                    : "border-gray-300 dark:border-gray-600"
                }`}>
                  {selectedObjective === objective.value && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div
                  className={`text-base font-medium cursor-pointer ${
                    selectedObjective === objective.value && "font-semibold text-primary"
                  }`}
                >
                  {objective.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bouton de soumission */}
        <Button
          type="submit"
          className="w-full sm:w-auto sm:px-8"
          size="lg"
          disabled={isSubmitting || children.length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Générer une histoire
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default MinimalStoryCreator;
