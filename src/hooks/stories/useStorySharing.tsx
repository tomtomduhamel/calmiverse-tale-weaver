
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateToken } from '@/utils/tokenUtils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

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

  // Partager via email
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
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

      // Mise à jour des données de partage
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

      // Mettre à jour les données de partage dans Supabase
      const { error: updateError } = await supabase
        .from('stories')
        .update({ sharing: updatedSharing })
        .eq('id', storyId);

      if (updateError) throw updateError;

      // Préparer les données pour l'envoi d'email
      const shareUrl = `${window.location.origin}/shared-story?id=${storyId}&token=${token}`;
      
      // Pour l'instant, nous affichons simplement une notification
      // Dans une version future, nous pourrons implémenter un webhook pour l'envoi d'emails
      toast({
        title: "Histoire partagée",
        description: `Un lien a été généré pour ${email}. URL: ${shareUrl}`,
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
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

      // Mise à jour des données de partage
      const updatedSharing = {
        publicAccess: {
          enabled: true,
          token,
          expiresAt: expiresAt.toISOString()
        }
      };

      // Mettre à jour les données de partage dans Supabase
      const { error: updateError } = await supabase
        .from('stories')
        .update({ sharing: updatedSharing })
        .eq('id', storyId);

      if (updateError) throw updateError;

      // Générer l'URL de partage
      const shareUrl = `${window.location.origin}/shared-story?id=${storyId}&token=${token}`;
      
      toast({
        title: "Lien de partage créé",
        description: "Le lien de partage a été copié dans le presse-papier",
      });

      // Copier automatiquement l'URL dans le presse-papier
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
      // Mise à jour des données de partage
      let updatedSharing = sharingData || {};
      if (updatedSharing.publicAccess) {
        updatedSharing.publicAccess.enabled = false;
      } else {
        updatedSharing.publicAccess = { enabled: false };
      }

      // Mettre à jour les données de partage dans Supabase
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
    shareByEmail,
    generatePublicLink,
    disablePublicAccess,
    isPublicEnabled: sharingData?.publicAccess?.enabled || false
  };
};
