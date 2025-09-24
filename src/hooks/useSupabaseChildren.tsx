import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Child } from "@/types/child";
import { useToast } from "@/hooks/use-toast";

// PHASE 2: Cache et persistance locale pour éviter les rechargements
const CHILDREN_CACHE_KEY = 'calmi_children_cache';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

interface CacheData {
  children: (Child & { storiesCount: number })[];
  timestamp: number;
}

const getChildrenFromCache = (): (Child & { storiesCount: number })[] | null => {
  try {
    const cached = localStorage.getItem(CHILDREN_CACHE_KEY);
    if (!cached) return null;
    
    const { children, timestamp }: CacheData = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp > CACHE_EXPIRY_TIME) {
      localStorage.removeItem(CHILDREN_CACHE_KEY);
      return null;
    }
    
    console.log("[useSupabaseChildren] Données récupérées du cache:", children.length);
    return children;
  } catch (error) {
    console.error("[useSupabaseChildren] Erreur lecture cache:", error);
    return null;
  }
};

const saveChildrenToCache = (children: (Child & { storiesCount: number })[]) => {
  try {
    const cacheData: CacheData = {
      children,
      timestamp: Date.now()
    };
    localStorage.setItem(CHILDREN_CACHE_KEY, JSON.stringify(cacheData));
    console.log("[useSupabaseChildren] Données sauvées en cache:", children.length);
  } catch (error) {
    console.error("[useSupabaseChildren] Erreur sauvegarde cache:", error);
  }
};

export const useSupabaseChildren = () => {
  const [children, setChildren] = useState<(Child & { storiesCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const { toast } = useToast();

  // PHASE 2: Chargement indépendant et avec cache
  const loadChildren = useCallback(async (useCache = true) => {
    try {
      console.log("[useSupabaseChildren] Début du chargement des enfants");
      
      // PHASE 2: Essayer le cache d'abord
      if (useCache) {
        const cachedChildren = getChildrenFromCache();
        if (cachedChildren) {
          setChildren(cachedChildren);
          setLoading(false);
          setError(null);
          
          // Continuer le chargement en arrière-plan pour mise à jour
          console.log("[useSupabaseChildren] Cache utilisé, mise à jour en arrière-plan...");
        }
      }
      
      // PHASE 2: Chargement indépendant avec session directe
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log("[useSupabaseChildren] Pas de session utilisateur");
        setChildren([]);
        setLoading(false);
        setError(null);
        return;
      }
      
      // Chargement des enfants avec leurs compteurs d'histoires
      console.log("[useSupabaseChildren] Récupération des enfants depuis Supabase");
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('authorid', session.user.id)
        .order('createdat', { ascending: false });

      if (childrenError) {
        throw new Error(`Erreur lors de la récupération des enfants: ${childrenError.message}`);
      }

      // Chargement en parallèle des compteurs d'histoires
      const storiesCountPromises = (childrenData || []).map(async (child) => {
        const { count } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .eq('authorid', session.user.id)
          .contains('childrenids', [child.id]);
        return { childId: child.id, count: count || 0 };
      });

      const storiesCountResults = await Promise.all(storiesCountPromises);
      const storiesCountMap = storiesCountResults.reduce((acc, { childId, count }) => {
        acc[childId] = count;
        return acc;
      }, {} as Record<string, number>);
      
      const mappedChildren = (childrenData || []).map(child => ({
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
      })) as (Child & { storiesCount: number })[];
      
      const loadedChildren = mappedChildren.sort((a, b) => b.storiesCount - a.storiesCount);
      
      console.log("[useSupabaseChildren] Enfants chargés:", loadedChildren.length);
      setChildren(loadedChildren);
      setLoading(false);
      setError(null);
      
      // PHASE 2: Sauvegarder en cache
      saveChildrenToCache(loadedChildren);
      
    } catch (err: any) {
      console.error("[useSupabaseChildren] Erreur:", err);
      const errorMessage = err.message || 'Erreur lors du chargement des enfants';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  // PHASE 2: Retry avec option de forcer le rechargement sans cache
  const retryLoadChildren = useCallback(() => {
    console.log("[useSupabaseChildren] Retry du chargement sans cache");
    setLoading(true);
    setError(null);
    setTimeoutReached(false);
    loadChildren(false); // Force reload sans cache
  }, [loadChildren]);

  // PHASE 2: Chargement initial optimisé avec timeout réduit
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // PHASE 2: Timeout réduit à 8 secondes pour children
    timeoutId = setTimeout(() => {
      if (loading && !error) {
        console.warn("⚠️ Timeout children (8s) - passage en mode dégradé");
        setTimeoutReached(true);
        setLoading(false);
        
        // PHASE 3: Si pas de cache, afficher mode création rapide
        const cachedChildren = getChildrenFromCache();
        if (!cachedChildren || cachedChildren.length === 0) {
          console.log("[useSupabaseChildren] Mode création rapide activé");
        }
      }
    }, 8000);

    // Démarrage du chargement
    loadChildren();
    
    // PHASE 2: Subscription en temps réel uniquement si session disponible
    let subscription: any = null;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        subscription = supabase
          .channel('children_changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'children',
              filter: `authorid=eq.${session.user.id}`
            }, 
            (payload) => {
              console.log("[useSupabaseChildren] Changement détecté:", payload);
              // Recharger les données après un court délai
              setTimeout(() => loadChildren(false), 1000);
            }
          )
          .subscribe();
      }
    });

    return () => {
      clearTimeout(timeoutId);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [loadChildren]);

  // CRUD Operations avec optimistic updates
  const handleAddChild = useCallback(async (childData: Omit<Child, "id">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Utilisateur non connecté");

    const { data, error } = await supabase
      .from('children')
      .insert({
        name: childData.name,
        birthdate: childData.birthDate.toISOString(),
        interests: childData.interests || [],
        gender: childData.gender || 'unknown',
        authorid: session.user.id,
        teddyname: childData.teddyName || '',
        teddydescription: childData.teddyDescription || '',
        teddyphotos: childData.teddyPhotos || [],
        imaginaryworld: childData.imaginaryWorld || '',
        createdat: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    const newChild: Child & { storiesCount: number } = {
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
      createdAt: new Date(data.createdat),
      storiesCount: 0
    };
    
    setChildren(prevChildren => [newChild, ...prevChildren]);
    
    // Update cache
    const updatedChildren = [newChild, ...children];
    saveChildrenToCache(updatedChildren);
    
    return data.id;
  }, [children]);

  const handleUpdateChild = useCallback(async (childId: string, updatedData: Partial<Child>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Utilisateur non connecté");

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
      .eq('authorid', session.user.id);
      
    if (error) throw error;
    
    setChildren(prevChildren => 
      prevChildren.map(child => 
        child.id === childId ? { ...child, ...updatedData } : child
      )
    );

    // Update cache
    const updatedChildren = children.map(child => 
      child.id === childId ? { ...child, ...updatedData } : child
    );
    saveChildrenToCache(updatedChildren);
  }, [children]);

  const handleDeleteChild = useCallback(async (childId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Utilisateur non connecté");

    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId)
      .eq('authorid', session.user.id);
      
    if (error) throw error;
    
    setChildren(prevChildren => prevChildren.filter(child => child.id !== childId));

    // Update cache
    const updatedChildren = children.filter(child => child.id !== childId);
    saveChildrenToCache(updatedChildren);
  }, [children]);

  return {
    children,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
    loading,
    error,
    timeoutReached,
    retryLoadChildren,
    refreshChildren: () => loadChildren(false) // Force refresh without cache
  };
};

export default useSupabaseChildren;