
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';

export const useSupabaseChildren = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const fetchChildren = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('authorid', user.id)
        .order('name');

      if (error) throw error;

      if (data) {
        const formattedChildren = data.map(item => ({
          ...item,
          id: item.id,
          authorId: item.authorid,
          birthDate: new Date(item.birthdate),
          createdAt: new Date(item.createdat),
          interests: item.interests || [],
          gender: item.gender || 'unknown'
        }));

        setChildren(formattedChildren);
      }
    } catch (err: any) {
      setError(err);
      console.error('Error fetching children:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les profils d\'enfants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const handleAddChild = useCallback(async (childData: Omit<Child, 'id'>): Promise<string> => {
    try {
      if (!user) throw new Error('You must be logged in to add a child');

      const { data, error } = await supabase
        .from('children')
        .insert([{
          name: childData.name,
          birthdate: childData.birthDate,
          authorid: user.id,
          gender: childData.gender || 'unknown',
          interests: childData.interests || [],
          createdat: new Date()
        }])
        .select();

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Profil de ${childData.name} créé avec succès`,
      });

      await fetchChildren();
      
      return data?.[0]?.id || '';
    } catch (err: any) {
      console.error('Error adding child:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le profil d\'enfant',
        variant: 'destructive',
      });
      throw err;
    }
  }, [user, fetchChildren, toast]);

  const handleUpdateChild = useCallback(async (childId: string, updates: Partial<Child>): Promise<string> => {
    try {
      if (!user) throw new Error('You must be logged in to update a child');

      const { data, error } = await supabase
        .from('children')
        .update({
          name: updates.name,
          birthdate: updates.birthDate,
          gender: updates.gender,
          interests: updates.interests,
        })
        .eq('id', childId)
        .eq('authorid', user.id)
        .select();

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Profil de ${updates.name} mis à jour avec succès`,
      });

      await fetchChildren();
      return childId;
    } catch (err: any) {
      console.error('Error updating child:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil d\'enfant',
        variant: 'destructive',
      });
      throw err;
    }
  }, [user, fetchChildren, toast]);

  const handleDeleteChild = useCallback(async (childId: string): Promise<void> => {
    try {
      if (!user) throw new Error('You must be logged in to delete a child');

      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId)
        .eq('authorid', user.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Profil d\'enfant supprimé avec succès',
      });

      await fetchChildren();
    } catch (err: any) {
      console.error('Error deleting child:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le profil d\'enfant',
        variant: 'destructive',
      });
    }
  }, [user, fetchChildren, toast]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  return {
    children,
    loading,
    error,
    fetchChildren,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
  };
};

export default useSupabaseChildren;
