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

  // Charger les enfants depuis Supabase avec comptage des histoires
  const loadChildren = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log("[useSupabaseChildren] Chargement des enfants pour l'utilisateur:", user.id);
      setLoading(true);
      
      // Charger les enfants
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('authorid', user.id);
      
      if (childrenError) throw childrenError;

      // Charger les histoires pour calculer la popularité
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('id, childrenids')
        .eq('authorid', user.id);
      
      if (storiesError) throw storiesError;

      // Calculer le nombre d'histoires par enfant
      const storiesCountMap: Record<string, number> = {};
      childrenData.forEach(child => {
        storiesCountMap[child.id] = storiesData?.filter(story => 
          story.childrenids?.includes(child.id)
        ).length || 0;
      });
      
      // Transformer et trier les données par popularité (nombre d'histoires)
      const loadedChildren = childrenData
        .map(child => ({
          id: child.id,
          name: child.name,
          birthDate: new Date(child.birthdate),
          interests: child.interests || [],
          gender: child.gender || 'unknown',
          authorId: child.authorid,
          teddyName: child.teddyname || '',
          teddyDescription: child.teddydescription || '',
          teddyPhotos: child.teddyphotos || [],
          imaginaryWorld: child.imaginaryworld || '',
          createdAt: new Date(child.createdat),
          storiesCount: storiesCountMap[child.id] || 0
        })) as (Child & { storiesCount: number })[]
        .sort((a, b) => b.storiesCount - a.storiesCount); // Tri par popularité décroissante
      
      console.log("[useSupabaseChildren] Enfants chargés et triés par popularité:", loadedChildren.length, loadedChildren);
      setChildren(loadedChildren);
    } catch (error: any) {
      console.error("[useSupabaseChildren] Erreur lors du chargement des enfants:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les profils des enfants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  // Effet pour le chargement initial et la configuration des abonnements en temps réel
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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
        console.log("[useSupabaseChildren] Changement détecté dans la table children:", payload);
        loadChildren();
      })
      .subscribe((status) => {
        console.log("[useSupabaseChildren] Statut de l'abonnement realtime:", status);
      });
    
    return () => {
      console.log("[useSupabaseChildren] Nettoyage - suppression du canal realtime");
      supabase.removeChannel(channel);
    };
  }, [user, loadChildren]);

  const handleAddChild = useCallback(async (childData: Omit<Child, "id">) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log("[useSupabaseChildren] Tentative de création d'un enfant avec les données:", childData);
      
      // Mapper les données avec les noms de colonnes corrects (en minuscule)
      const { data, error } = await supabase
        .from('children')
        .insert({
          name: childData.name,
          birthdate: childData.birthDate.toISOString(),
          interests: childData.interests || [],
          gender: childData.gender || 'unknown',
          authorid: user.id,
          teddyname: childData.teddyName || '',
          teddydescription: childData.teddyDescription || '',
          teddyphotos: childData.teddyPhotos || [],
          imaginaryworld: childData.imaginaryWorld || '',
          createdat: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error("[useSupabaseChildren] Erreur Supabase lors de l'ajout:", error);
        throw error;
      }
      
      console.log("[useSupabaseChildren] Enfant créé avec succès, ID:", data.id, "Données:", data);
      
      // Actualiser immédiatement l'état local pour une réponse instantanée de l'UI
      // en transformant les données reçues de Supabase au format Child
      const newChild: Child = {
        id: data.id,
        name: data.name,
        birthDate: new Date(data.birthdate),
        interests: data.interests || [],
        gender: data.gender || 'unknown',
        authorId: data.authorid,
        teddyName: data.teddyname || '',
        teddyDescription: data.teddydescription || '',
        teddyPhotos: data.teddyphotos || [],
        imaginaryWorld: data.imaginaryworld || '',
        createdAt: new Date(data.createdat)
      };
      
      // Mettre à jour l'état local pour une réponse immédiate
      setChildren(prevChildren => [newChild, ...prevChildren]);
      
      return data.id;
    } catch (error: any) {
      console.error("[useSupabaseChildren] Erreur lors de l'ajout de l'enfant:", error);
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
      if (updatedData.teddyName !== undefined) supabaseData.teddyname = updatedData.teddyName;
      if (updatedData.teddyDescription !== undefined) supabaseData.teddydescription = updatedData.teddyDescription;
      if (updatedData.teddyPhotos !== undefined) supabaseData.teddyphotos = updatedData.teddyPhotos;
      if (updatedData.imaginaryWorld !== undefined) supabaseData.imaginaryworld = updatedData.imaginaryWorld;
      
      console.log("Mise à jour des données enfant:", childId, supabaseData);
      
      const { error } = await supabase
        .from('children')
        .update(supabaseData)
        .eq('id', childId)
        .eq('authorid', user.id);
        
      if (error) throw error;
      
      // Mettre à jour l'état local pour une réponse immédiate de l'UI
      setChildren(prevChildren => 
        prevChildren.map(child => 
          child.id === childId 
            ? { ...child, ...updatedData } 
            : child
        )
      );
      
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
      
      // Mettre à jour l'état local
      setChildren(prevChildren => prevChildren.filter(child => child.id !== childId));
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
    loading,
    refreshChildren: loadChildren // Exposer la fonction de rafraîchissement
  };
};

export default useSupabaseChildren;
