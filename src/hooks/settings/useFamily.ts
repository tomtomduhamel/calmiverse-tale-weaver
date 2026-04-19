import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export interface FamilyMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Family {
  id: string;
  name: string;
}

export const useFamily = () => {
  const { user } = useSupabaseAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadFamilyData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: familyData, error: fError } = await supabase
        .from('families')
        .select('*');
      
      if (fError) throw fError;
      setFamilies(familyData || []);

      if (familyData && familyData.length > 0) {
        const familyId = familyData[0].id;
        const { data: membersData, error: mError } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', familyId);
        
        if (mError) throw mError;
        setMembers(membersData || []);
        
        // CHeck existing invites
        const { data: invites } = await supabase
          .from('family_invites')
          .select('token')
          .eq('family_id', familyId)
          .single();
          
        if (invites) {
          setInviteToken(invites.token);
        }
      }
    } catch (error) {
      console.error('Failed to load family data', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  const generateInvite = async () => {
    if (families.length === 0 || !user) return null;
    const familyId = families[0].id;
    // Génère un code à 6 caractères alphanumériques
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { error } = await supabase
      .from('family_invites')
      .insert({
        family_id: familyId,
        token: token,
        created_by: user.id
      });
      
    if (!error) {
      setInviteToken(token);
      return token;
    }
    return null;
  };

  const joinFamily = async (token: string) => {
    const { data, error } = await supabase.rpc('join_family', { p_token: token });
    if (error) {
      throw new Error(error.message);
    }
    await loadFamilyData();
    return true;
  };

  return {
    families,
    members,
    inviteToken,
    isLoading,
    generateInvite,
    joinFamily,
    reload: loadFamilyData
  };
};
