
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStoryGeneration } from "@/hooks/stories/useStoryGeneration";
import type { Child } from "@/types/child";
import type { Objective } from "@/types/story";
import { toast } from "@/hooks/use-toast";

export const useMinimalStoryCreator = (preSelectedChildId?: string) => {
  const navigate = useNavigate();
  const { generateStory } = useStoryGeneration();
  
  // État local pour le formulaire
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
        
        // Sélectionner automatiquement l'enfant pré-sélectionné ou le premier enfant si disponible
        if (preSelectedChildId && mappedChildren.some(child => child.id === preSelectedChildId)) {
          setSelectedChildrenIds([preSelectedChildId]);
        } else if (mappedChildren.length > 0) {
          setSelectedChildrenIds([mappedChildren[0].id]);
        }
        
        // Sélectionner automatiquement le premier objectif
        setSelectedObjective("sleep");
        
      } catch (e: any) {
        console.error("Erreur lors du chargement des données:", e);
        setError("Impossible de charger les données nécessaires. Veuillez réessayer.");
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données nécessaires",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [preSelectedChildId]);
  
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
      const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
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
      
      // Appeler la fonction Supabase Edge pour générer l'histoire
      try {
        console.log("Appel de la fonction generateStory avec:", {
          storyId: storyData.id,
          objective: selectedObjective,
          childrenNames: childrenNames
        });
        
        const { error: funcError } = await generateStory(
          storyData.id,
          selectedObjective,
          childrenNames
        );
        
        if (funcError) {
          console.warn("La fonction de génération a rencontré une erreur:", funcError);
          toast({
            title: "Avertissement",
            description: "L'histoire a été créée mais la génération a rencontré un problème. Elle sera générée en arrière-plan.",
            variant: "default"
          });
        }
      } catch (funcErr) {
        console.warn("Erreur lors de l'appel à la fonction:", funcErr);
        toast({
          title: "Avertissement",
          description: "L'histoire a été créée mais la génération démarrera en arrière-plan.",
          variant: "default"
        });
      }
      
      setSuccessMessage("Votre histoire a été créée avec succès! Redirection vers la bibliothèque...");
      toast({
        title: "Succès",
        description: "Votre histoire a été créée avec succès!",
        variant: "default"
      });
      
      // Rediriger vers la bibliothèque après une courte pause
      setTimeout(() => {
        navigate("/app");
      }, 1500);
      
    } catch (error: any) {
      console.error("Erreur lors de la création de l'histoire:", error);
      setError(error.message || "Une erreur est survenue lors de la création de l'histoire");
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
};

export default useMinimalStoryCreator;
