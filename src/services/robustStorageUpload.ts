
import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  bucketUsed?: string;
  cleanFilename?: string; // Nom de fichier propre pour affichage
}

export const robustStorageUpload = {
  /**
   * Upload un fichier vers Supabase Storage avec retry automatique et fallback de bucket
   */
  async uploadFile(
    blob: Blob, 
    filename: string, 
    preferredBucket: string = 'epub-files'
  ): Promise<UploadResult> {
    console.log('📤 [RobustUpload] Début upload vers Storage:', filename);
    
    const maxAttempts = 3;
    const fallbackBuckets = ['epub-files', 'story-files']; // Liste des buckets à essayer
    let lastError: Error | null = null;

    // Assurer que le bucket préféré est en premier
    const bucketsToTry = [preferredBucket, ...fallbackBuckets.filter(b => b !== preferredBucket)];

    for (const bucketName of bucketsToTry) {
      console.log(`🪣 [RobustUpload] Tentative avec bucket: ${bucketName}`);
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`📤 [RobustUpload] Bucket ${bucketName} - Tentative ${attempt}/${maxAttempts}`);
          
          // Créer un nom de fichier unique avec timestamp pour le stockage interne
          const timestamp = Date.now();
          const uniqueFilename = `${timestamp}-${filename.replace(/\s+/g, '_')}`;
          
          // Upload vers Supabase Storage
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(uniqueFilename, blob, {
              cacheControl: '3600',
              upsert: false // Toujours créer un nouveau fichier
            });

          if (error) {
            // Erreur spécifique au bucket
            if (error.message.includes('Bucket not found') || error.message.includes('bucket does not exist')) {
              console.warn(`⚠️ [RobustUpload] Bucket ${bucketName} introuvable, tentative suivante...`);
              break; // Passer au bucket suivant
            }
            throw new Error(`Erreur Storage (${bucketName}): ${error.message}`);
          }

          if (!data?.path) {
            throw new Error(`Aucun path retourné par Storage (${bucketName})`);
          }

          // Store the file path for signed URL generation
          const filePath = data.path;

          // Generate a signed URL for immediate use
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, 3600); // 1 hour

          if (signedUrlError || !signedUrlData?.signedUrl) {
            throw new Error(`Impossible d'obtenir l'URL signée (${bucketName})`);
          }

          console.log(`✅ [RobustUpload] Upload réussi avec bucket ${bucketName}`);
          
          return {
            success: true,
            url: signedUrlData.signedUrl,
            bucketUsed: bucketName,
            cleanFilename: filename
          };

        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`⚠️ [RobustUpload] Bucket ${bucketName} - Tentative ${attempt} échouée:`, lastError.message);
          
          if (attempt < maxAttempts) {
            // Délai exponentiel entre les tentatives
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ [RobustUpload] Attente ${delay}ms avant nouvelle tentative`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }

    console.error('❌ [RobustUpload] Échec après toutes les tentatives avec tous les buckets:', lastError?.message);
    
    return {
      success: false,
      error: lastError?.message || 'Erreur d\'upload inconnue après tentatives avec tous les buckets disponibles'
    };
  },

  /**
   * Vérifie si un bucket existe
   */
  async checkBucketExists(bucketName: string): Promise<boolean> {
    try {
      console.log('🔍 [RobustUpload] Vérification existence bucket:', bucketName);
      
      // Lister les buckets pour vérifier l'existence
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ [RobustUpload] Erreur listage buckets:', error);
        return false;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      console.log(`📋 [RobustUpload] Bucket ${bucketName} existe:`, bucketExists);
      
      return bucketExists;
    } catch (error) {
      console.error('❌ [RobustUpload] Erreur vérification bucket:', error);
      return false;
    }
  },

  /**
   * Obtient la liste des buckets disponibles pour l'upload
   */
  async getAvailableBuckets(): Promise<string[]> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error || !buckets) {
        console.error('❌ [RobustUpload] Erreur récupération buckets:', error);
        return ['epub-files']; // Fallback par défaut
      }
      
      const availableBuckets = buckets
        .filter(bucket => ['epub-files', 'story-files'].includes(bucket.name))
        .map(bucket => bucket.name);
      
      console.log('📋 [RobustUpload] Buckets disponibles:', availableBuckets);
      return availableBuckets.length > 0 ? availableBuckets : ['epub-files'];
    } catch (error) {
      console.error('❌ [RobustUpload] Erreur listage buckets:', error);
      return ['epub-files'];
    }
  },

  /**
   * Sélectionne automatiquement le meilleur bucket disponible
   */
  async selectBestBucket(): Promise<string> {
    const availableBuckets = await this.getAvailableBuckets();
    
    // Priorité : epub-files > story-files > premier disponible
    if (availableBuckets.includes('epub-files')) {
      return 'epub-files';
    } else if (availableBuckets.includes('story-files')) {
      return 'story-files';
    } else {
      return availableBuckets[0] || 'epub-files';
    }
  }
};
