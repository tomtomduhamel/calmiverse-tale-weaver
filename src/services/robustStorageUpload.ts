
import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const robustStorageUpload = {
  /**
   * Upload un fichier vers Supabase Storage avec retry automatique
   */
  async uploadFile(
    blob: Blob, 
    filename: string, 
    bucketName: string = 'epub-files'
  ): Promise<UploadResult> {
    console.log('📤 [RobustUpload] Début upload vers Storage:', filename);
    
    const maxAttempts = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📤 [RobustUpload] Tentative ${attempt}/${maxAttempts}`);
        
        // Créer un nom de fichier unique avec timestamp
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}-${filename}`;
        
        // Upload vers Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(uniqueFilename, blob, {
            cacheControl: '3600',
            upsert: false // Toujours créer un nouveau fichier
          });

        if (error) {
          throw new Error(`Erreur Storage: ${error.message}`);
        }

        if (!data?.path) {
          throw new Error('Aucun path retourné par Storage');
        }

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        if (!urlData?.publicUrl) {
          throw new Error('Impossible d\'obtenir l\'URL publique');
        }

        console.log('✅ [RobustUpload] Upload réussi:', urlData.publicUrl);
        
        return {
          success: true,
          url: urlData.publicUrl
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ [RobustUpload] Tentative ${attempt} échouée:`, lastError.message);
        
        if (attempt < maxAttempts) {
          // Délai exponentiel entre les tentatives
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ [RobustUpload] Attente ${delay}ms avant nouvelle tentative`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('❌ [RobustUpload] Échec après toutes les tentatives:', lastError?.message);
    
    return {
      success: false,
      error: lastError?.message || 'Erreur d\'upload inconnue'
    };
  },

  /**
   * Vérifie si le bucket existe et le crée si nécessaire
   */
  async ensureBucketExists(bucketName: string = 'epub-files'): Promise<boolean> {
    try {
      console.log('🪣 [RobustUpload] Vérification du bucket:', bucketName);
      
      // Lister les buckets pour vérifier l'existence
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ [RobustUpload] Erreur listage buckets:', error);
        return false;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (bucketExists) {
        console.log('✅ [RobustUpload] Bucket existe déjà');
        return true;
      }
      
      console.log('📁 [RobustUpload] Création du bucket:', bucketName);
      
      // Créer le bucket s'il n'existe pas
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true, // Bucket public pour accès facile aux EPUBs
        allowedMimeTypes: ['application/epub+zip'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB max
      });
      
      if (createError) {
        console.error('❌ [RobustUpload] Erreur création bucket:', createError);
        return false;
      }
      
      console.log('✅ [RobustUpload] Bucket créé avec succès');
      return true;
      
    } catch (error) {
      console.error('❌ [RobustUpload] Erreur vérification bucket:', error);
      return false;
    }
  }
};
