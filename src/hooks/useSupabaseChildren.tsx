import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import type { Child } from "@/types/child";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export const useSupabaseChildren = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const loadChildren = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log("[useSupabaseChildren] Chargement des enfants pour l'utilisateur:", user.id);
      setLoading(true);
      
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('authorid', user.id);
      
      if (childrenError) throw childrenError;

      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('id, childrenids')
        .eq('authorid', user.id);
      
      if (storiesError) throw storiesError;

      const storiesCountMap: Record<string, number> = {};
      childrenData.forEach(child => {
        storiesCountMap[child.id] = storiesData?.filter(story => 
          story.childrenids?.includes(child.id)
        ).length || 0;
      });
      
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
        .sort((a, b) => b.storiesCount - a.storiesCount);
      
      console.log("[useSupabaseChildren] Enfants chargés:", loadedChildren.length);
      setChildren(loadedChildren);
      setError(null);
    } catch (error: any) {
      console.error("[useSupabaseChildren] Erreur:", error);
      setError("Impossible de charger les profils des enfants");
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  const retryLoadChildren = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeoutReached(false);
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    const childrenTimeout = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Timeout de chargement des enfants atteint (8s)");
        setLoading(false);
        setTimeoutReached(true);
        setError("Timeout de chargement - veuillez réessayer");
      }
    }, 8000);

    if (!user) {
      setLoading(false);
      clearTimeout(childrenTimeout);
      return;
    }

    loadChildren();
    
    const channel = supabase
      .channel('children_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'children',
        filter: `authorid=eq.${user.id}`
      }, () => {
        loadChildren();
      })
      .subscribe();
    
    return () => {
      clearTimeout(childrenTimeout);
      supabase.removeChannel(channel);
    };
  }, [user, loadChildren]);

  const handleAddChild = useCallback(async (childData: Omit<Child, "id">) => {
    if (!user) throw new Error("Utilisateur non connecté");

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
      
    if (error) throw error;
    
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
    
    setChildren(prevChildren => [newChild, ...prevChildren]);
    return data.id;
  }, [user]);

  const handleUpdateChild = useCallback(async (childId: string, updatedData: Partial<Child>) => {
    if (!user) throw new Error("Utilisateur non connecté");

    const supabaseData: Record<string, any> = {};
    if (updatedData.name !== undefined) supabaseData.name = updatedData.name;
    if (updatedData.birthDate !== undefined) supabaseData.birthdate = updatedData.birthDate.toISOString();
    if (updatedData.interests !== undefined) supabaseData.interests = updatedData.interests;
    if (updatedData.gender !== undefined) supabaseData.gender = updatedData.gender;
    if (updatedData.teddyName !== undefined) supabaseData.teddyname = updatedData.teddyName;
    if (updatedData.teddyDescription !== undefined) supabaseData.teddydescription = updatedData.teddyDescription;
    if (updatedData.teddyPhotos !== undefined) supabaseData.teddyphotos = updatedData.teddyPhotos;
    if (updatedData.imaginaryWorld !== undefined) supabaseData.imaginaryworld = updatedData.imaginaryWorld;
    
    const { error } = await supabase
      .from('children')
      .update(supabaseData)
      .eq('id', childId)
      .eq('authorid', user.id);
      
    if (error) throw error;
    
    setChildren(prevChildren => 
      prevChildren.map(child => 
        child.id === childId ? { ...child, ...updatedData } : child
      )
    );
  }, [user]);

  const handleDeleteChild = useCallback(async (childId: string) => {
    if (!user) throw new Error("Utilisateur non connecté");

    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId)
      .eq('authorid', user.id);
      
    if (error) throw error;
    
    setChildren(prevChildren => prevChildren.filter(child => child.id !== childId));
  }, [user]);

  return {
    children,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
    loading,
    error,
    timeoutReached,
    retryLoadChildren,
    refreshChildren: loadChildren
  };
};

export default useSupabaseChildren;