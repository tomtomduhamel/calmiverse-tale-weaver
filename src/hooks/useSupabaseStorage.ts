
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const uploadFile = useCallback(async (
    bucketName: string,
    filePath: string,
    file: File,
    onProgress?: (progress: number) => void
  ) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      setUploading(true);
      setProgress(0);

      // Créer un gestionnaire de progression personnalisé
      const progressHandler = (event: ProgressEvent) => {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
        if (onProgress) onProgress(percent);
      };

      // Crée un XMLHttpRequest pour pouvoir suivre la progression
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', progressHandler);
      
      // Utilisez upload() sans l'option onUploadProgress
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      toast({
        title: "Succès",
        description: "Fichier téléchargé avec succès",
      });

      return {
        url: publicUrl,
        path: filePath
      };
    } catch (error: any) {
      console.error("Erreur lors du téléchargement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  }, [user, toast]);

  const deleteFile = useCallback(async (bucketName: string, filePath: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Fichier supprimé avec succès",
      });

      return true;
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress
  };
};

export default useSupabaseStorage;
