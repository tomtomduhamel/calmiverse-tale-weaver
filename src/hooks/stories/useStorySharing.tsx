import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateToken } from '@/utils/tokenUtils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface ShareResult {
  success: boolean;
  is_calmi_user?: boolean;
  share_id?: string;
  recipient_name?: string;
  recipient_email?: string;
  error?: string;
}

interface PendingShare {
  share_id: string;
  story_id: string;
  story_title: string;
  story_preview: string | null;
  story_children_names: string[];
  sender_id: string;
  sender_name: string;
  sender_email: string;
  message: string | null;
  created_at: string;
  expires_at: string;
}

export const useStorySharing = (storyId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sharingData, setSharingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  // Récupérer les données de partage existantes
  useEffect(() => {
    if (!storyId) return;

    const fetchSharingData = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('sharing')
          .eq('id', storyId)
          .single();

        if (error) throw error;
        setSharingData(data?.sharing || null);
      } catch (err) {
        console.error('Erreur lors de la récupération des données de partage:', err);
        setError('Impossible de récupérer les informations de partage');
      }
    };

    fetchSharingData();
  }, [storyId]);

  // Partager avec un utilisateur (Calmi ou externe)
  const shareWithUser = useCallback(async (email: string, message?: string): Promise<ShareResult> => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour partager une histoire",
        variant: "destructive",
      });
      return { success: false, error: "Non connecté" };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Appeler la fonction RPC pour partager
      const { data, error: rpcError } = await supabase
        .rpc('share_story_with_user', {
          p_story_id: storyId,
          p_recipient_email: email,
          p_message: message || null
        });

      if (rpcError) throw rpcError;

      const result = data as ShareResult;

      if (!result.success) {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de partager l'histoire",
          variant: "destructive",
        });
        return result;
      }

      if (result.is_calmi_user) {
        // Utilisateur Calmi - notification envoyée
        toast({
          title: "Invitation envoyée",
          description: `${result.recipient_name} recevra une notification pour accepter l'histoire`,
        });
      }

      return result;
    } catch (err: any) {
      console.error('Erreur lors du partage:', err);
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user, storyId, toast]);

  // Partager via email (méthode legacy pour les non-utilisateurs Calmi)
  const shareByEmail = async (email: string) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour partager une histoire",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const updatedSharing = {
        publicAccess: {
          enabled: true,
          token,
          expiresAt: expiresAt.toISOString()
        },
        sharedEmails: [{
          email,
          sharedAt: new Date().toISOString(),
          accessCount: 0
        }]
      };

      const { error: updateError } = await supabase
        .from('stories')
        .update({ sharing: updatedSharing })
        .eq('id', storyId);

      if (updateError) throw updateError;

      const shareUrl = `${window.location.origin}/shared/${token}?id=${storyId}`;
      
      toast({
        title: "Histoire partagée",
        description: `Un lien a été généré pour ${email}`,
      });

      setSharingData(updatedSharing);
      return shareUrl;
    } catch (err: any) {
      console.error('Erreur lors du partage par email:', err);
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Générer un lien de partage public
  const generatePublicLink = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour partager une histoire",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const updatedSharing = {
        publicAccess: {
          enabled: true,
          token,
          expiresAt: expiresAt.toISOString()
        }
      };

      const { error: updateError } = await supabase
        .from('stories')
        .update({ sharing: updatedSharing })
        .eq('id', storyId);

      if (updateError) throw updateError;

      const shareUrl = `${window.location.origin}/shared/${token}?id=${storyId}`;
      
      toast({
        title: "Lien de partage créé",
        description: "Le lien de partage a été copié dans le presse-papier",
      });

      await navigator.clipboard.writeText(shareUrl);

      setSharingData(updatedSharing);
      return shareUrl;
    } catch (err: any) {
      console.error('Erreur lors de la génération du lien public:', err);
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Désactiver le partage public
  const disablePublicAccess = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      let updatedSharing = sharingData || {};
      if (updatedSharing.publicAccess) {
        updatedSharing.publicAccess.enabled = false;
      } else {
        updatedSharing.publicAccess = { enabled: false };
      }

      const { error: updateError } = await supabase
        .from('stories')
        .update({ sharing: updatedSharing })
        .eq('id', storyId);

      if (updateError) throw updateError;
      
      toast({
        title: "Accès public désactivé",
        description: "Le lien de partage n'est plus accessible",
      });

      setSharingData(updatedSharing);
    } catch (err: any) {
      console.error('Erreur lors de la désactivation de l\'accès public:', err);
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    sharingData,
    error,
    shareWithUser,
    shareByEmail,
    generatePublicLink,
    disablePublicAccess,
    isPublicEnabled: sharingData?.publicAccess?.enabled || false
  };
};

// Hook séparé pour les partages en attente (utilisé dans la bibliothèque)
export const usePendingShares = () => {
  const [pendingShares, setPendingShares] = useState<PendingShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const fetchPendingShares = useCallback(async () => {
    if (!user) {
      setPendingShares([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_pending_story_shares');

      if (error) throw error;

      setPendingShares((data || []) as PendingShare[]);
    } catch (err) {
      console.error('[usePendingShares] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const acceptShare = useCallback(async (shareId: string, characterMapping?: Record<string, string>) => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase.rpc('accept_story_share', {
        p_share_id: shareId,
        p_character_mapping: characterMapping || {}
      });

      if (error) throw error;

      const result = data as { success: boolean; copied_story_id?: string; story_title?: string; error?: string };

      if (result.success) {
        toast({
          title: "Histoire acceptée",
          description: `"${result.story_title}" a été ajoutée à votre bibliothèque`,
        });
        
        // Refresh pending shares
        await fetchPendingShares();
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible d'accepter l'histoire",
          variant: "destructive",
        });
      }

      return result;
    } catch (err) {
      console.error('[usePendingShares] Accept error:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter l'histoire",
        variant: "destructive",
      });
      return { success: false };
    }
  }, [user, toast, fetchPendingShares]);

  const rejectShare = useCallback(async (shareId: string) => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase.rpc('reject_story_share', {
        p_share_id: shareId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (result.success) {
        toast({
          title: "Histoire refusée",
          description: "Le partage a été refusé",
        });
        
        // Refresh pending shares
        await fetchPendingShares();
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de refuser l'histoire",
          variant: "destructive",
        });
      }

      return result;
    } catch (err) {
      console.error('[usePendingShares] Reject error:', err);
      toast({
        title: "Erreur",
        description: "Impossible de refuser l'histoire",
        variant: "destructive",
      });
      return { success: false };
    }
  }, [user, toast, fetchPendingShares]);

  useEffect(() => {
    fetchPendingShares();
  }, [fetchPendingShares]);

  return {
    pendingShares,
    pendingCount: pendingShares.length,
    isLoading,
    acceptShare,
    rejectShare,
    refetch: fetchPendingShares
  };
};
