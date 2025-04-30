
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import type { Child } from "@/types/child";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export const useSupabaseChildren = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  // Charger les enfants depuis Supabase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadChildren = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('authorId', user.id)
          .order('createdAt', { ascending: false });
        
        if (error) throw error;
        
        // Transformer les données pour correspondre au type Child
        const loadedChildren = data.map(child => ({
          id: child.id,
          name: child.name,
          birthDate: new Date(child.birthDate),
          interests: child.interests || [],
          gender: child.gender || 'unknown',
          authorId: child.authorId,
          createdAt: new Date(child.createdAt)
        })) as Child[];
        
        setChildren(loadedChildren);
      } catch (error) {
        console.error("Erreur lors du chargement des enfants:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les profils des enfants",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadChildren();
    
    // Configurer une souscription en temps réel pour les mises à jour
    const subscription = supabase
      .channel('children_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'children',
        filter: `authorId=eq.${user.id}`
      }, loadChildren)
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast]);

  // Ajouter un enfant
  const handleAddChild = useCallback(async (childData: Omit<Child, "id">) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log("Tentative de création d'un enfant avec les données:", childData);
      
      // Préparer les données pour Supabase
      const newChild = {
        name: childData.name,
        birthDate: childData.birthDate.toISOString(),
        interests: childData.interests || [],
        gender: childData.gender || 'unknown',
        authorId: user.id,
        createdAt: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('children')
        .insert(newChild)
        .select('id')
        .single();
      
      if (error) throw error;
      
      console.log("Enfant créé avec succès, ID:", data.id);
      return data.id;
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'enfant:", error);
      throw error;
    }
  }, [user]);

  // Mettre à jour un enfant
  const handleUpdateChild = useCallback(async (childId: string, updatedData: Partial<Child>) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      // Préparer les données pour Supabase
      const dataToUpdate: any = {};
      
      if (updatedData.name) dataToUpdate.name = updatedData.name;
      if (updatedData.birthDate) dataToUpdate.birthDate = updatedData.birthDate.toISOString();
      if (updatedData.interests) dataToUpdate.interests = updatedData.interests;
      if (updatedData.gender) dataToUpdate.gender = updatedData.gender;
      
      const { error } = await supabase
        .from('children')
        .update(dataToUpdate)
        .eq('id', childId)
        .eq('authorId', user.id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'enfant:", error);
      throw error;
    }
  }, [user]);

  // Supprimer un enfant
  const handleDeleteChild = useCallback(async (childId: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId)
        .eq('authorId', user.id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'enfant:", error);
      throw error;
    }
  }, [user]);

  return {
    children,
    loading,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
  };
};
