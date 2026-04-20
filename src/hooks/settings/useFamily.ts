import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export interface FamilyMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  displayName?: string;
  email?: string;
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
        // On cherche la famille dont l'utilisateur est le propriétaire
        const ownedFamily = familyData.find((f: any) => {
          // On le déterminera via family_members ci-dessous
          return true; // placeholder, on filtre après
        });
        const familyId = familyData[0].id; // fallback initial

        // Récupérer les memberships pour trouver la famille "owned"
        const { data: myMemberships } = await supabase
          .from('family_members')
          .select('family_id, role')
          .eq('user_id', user.id);

        const ownerMembership = myMemberships?.find(m => m.role === 'owner');
        const primaryFamilyId = ownerMembership?.family_id || familyId;
        const { data: membersData, error: mError } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', primaryFamilyId);
        
        if (mError) throw mError;

        // Enrichir avec les infos de profil depuis la table 'users'
        const enrichedMembers = await Promise.all(
          (membersData || []).map(async (member) => {
            const { data: userInfo } = await supabase
              .from('users')
              .select('firstname, lastname, email')
              .eq('id', member.user_id)
              .maybeSingle();

            const firstName = userInfo?.firstname || '';
            const lastName = userInfo?.lastname || '';
            const fullName = [firstName, lastName].filter(Boolean).join(' ');

            return {
              ...member,
              displayName: fullName || userInfo?.email || null,
              email: userInfo?.email || null,
            };
          })
        );
        setMembers(enrichedMembers);
        
        // Chercher le token d'invitation existant (maybeSingle évite le crash si absent)
        const { data: invites } = await supabase
          .from('family_invites')
          .select('token')
          .eq('family_id', primaryFamilyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
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

  const generateInvite = async (): Promise<string | null> => {
    if (families.length === 0 || !user) return null;

    // Toujours générer l'invite pour la famille dont l'utilisateur est owner
    const { data: myMemberships } = await supabase
      .from('family_members')
      .select('family_id, role')
      .eq('user_id', user.id);

    const ownerMembership = myMemberships?.find(m => m.role === 'owner');
    const familyId = ownerMembership?.family_id || families[0].id;

    // Supprimer les anciens tokens pour éviter les doublons
    await supabase
      .from('family_invites')
      .delete()
      .eq('family_id', familyId)
      .eq('created_by', user.id);

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
    console.error('Failed to insert invite token');
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
