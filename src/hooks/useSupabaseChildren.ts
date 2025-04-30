
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
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
          .eq('authorid', user.id)
          .order('createdat', { ascending: false });
        
        if (error) throw error;
        
        // Transformer les données pour correspondre au type Child
        const loadedChildren = data.map(child => ({
          id: child.id,
          name: child.name,
          birthDate: new Date(child.birthdate),
          interests: child.interests || [],
          gender: child.gender || 'unknown',
          authorId: child.authorid,
          createdAt: new Date(child.createdat)
        })) as Child[];
        
        setChildren(loadedChildren);
      } catch (error: any) {
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
    const channel = supabase
      .channel('children_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'children',
        filter: `authorid=eq.${user.id}`
      }, (payload) => {
        loadChildren();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const handleAddChild = useCallback(async (childData: Omit<Child, "id">) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log("Tentative de création d'un enfant avec les données:", childData);
      
      const { data, error } = await supabase
        .from('children')
        .insert({
          name: childData.name,
          birthdate: childData.birthDate.toISOString(),
          interests: childData.interests || [],
          gender: childData.gender || 'unknown',
          authorid: user.id,
          createdat: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      console.log("Enfant créé avec succès, ID:", data.id);
      return data.id;
    } catch (error: any) {
      console.error("Erreur lors de l'ajout de l'enfant:", error);
      throw error;
    }
  }, [user]);

  const handleUpdateChild = useCallback(async (childId: string, updatedData: Partial<Child>) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      // Transformer les données pour correspondre au schéma Supabase
      const supabaseData: Record<string, any> = {};
      
      if (updatedData.name !== undefined) supabaseData.name = updatedData.name;
      if (updatedData.birthDate !== undefined) supabaseData.birthdate = updatedData.birthDate.toISOString();
      if (updatedData.interests !== undefined) supabaseData.interests = updatedData.interests;
      if (updatedData.gender !== undefined) supabaseData.gender = updatedData.gender;
      
      const { error } = await supabase
        .from('children')
        .update(supabaseData)
        .eq('id', childId)
        .eq('authorid', user.id);
        
      if (error) throw error;
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'enfant:", error);
      throw error;
    }
  }, [user]);

  const handleDeleteChild = useCallback(async (childId: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId)
        .eq('authorid', user.id);
        
      if (error) throw error;
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'enfant:", error);
      throw error;
    }
  }, [user]);

  return {
    children,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
    loading
  };
};

export default useSupabaseChildren;
