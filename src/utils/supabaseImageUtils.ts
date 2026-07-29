/**
 * Utilitaire pour gérer les URLs des images Supabase
 */

/**
 * Option d'optimisation de rendu Supabase
 */
export interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  transform?: boolean;
}

/**
 * Génère l'URL publique d'une image stockée dans le bucket storyimages
 * @param imagePath Le chemin de l'image (ex: "story-id.jpeg")
 * @param options Options optionnelles de redimensionnement et compression
 * @returns L'URL publique de l'image ou null si pas d'image
 */
export const getStoryImageUrl = (
  imagePath?: string | null,
  options?: ImageOptimizationOptions
): string | null => {
  if (!imagePath) {
    return null;
  }
  
  const supabaseUrl = 'https://ioeihnoxvtpxtqhxklpw.supabase.co';
  
  // Vérifier si le chemin contient déjà le préfixe "storyimages/"
  const cleanPath = imagePath.startsWith('storyimages/') 
    ? imagePath.substring('storyimages/'.length)
    : imagePath;
  
  // Si des options de transformation sont spécifiées, utiliser l'endpoint /render/image/public
  if (options?.transform || options?.width || options?.quality) {
    const params = new URLSearchParams();
    if (options.width) params.append('width', options.width.toString());
    params.append('quality', (options.quality || 80).toString());
    params.append('format', 'origin'); // préserve webp ou convertit si nécessaire
    
    return `${supabaseUrl}/storage/v1/render/image/public/storyimages/${cleanPath}?${params.toString()}`;
  }
  
  const imageUrl = `${supabaseUrl}/storage/v1/object/public/storyimages/${cleanPath}`;
  
  return imageUrl;
};

/**
 * Génère l'URL publique d'une vidéo stockée dans le bucket storyvideos
 * @param videoPath Le chemin de la vidéo (ex: "story-id.mp4")
 * @returns L'URL publique de la vidéo ou null si pas de vidéo
 */
export const getStoryVideoUrl = (videoPath?: string | null): string | null => {
  if (!videoPath) {
    return null;
  }
  
  const supabaseUrl = 'https://ioeihnoxvtpxtqhxklpw.supabase.co';
  
  // Vérifier si le chemin contient déjà le préfixe "storyvideos/"
  let cleanPath = videoPath.startsWith('storyvideos/') 
    ? videoPath.substring('storyvideos/'.length)
    : videoPath;
  
  // S'assurer que le nom de fichier a la bonne extension (souvent omise en BDD par erreur)
  if (!cleanPath.endsWith('.mp4') && !cleanPath.includes('.')) {
      cleanPath += '.mp4';
  }
  
  const videoUrl = `${supabaseUrl}/storage/v1/object/public/storyvideos/${cleanPath}`;
  
  return videoUrl;
};

/**
 * Récupère l'image comme blob pour l'intégration dans les EPUB
 * @param imagePath Le chemin de l'image
 * @returns Promise<Blob | null>
 */
export const fetchStoryImageBlob = async (imagePath?: string | null): Promise<Blob | null> => {
  if (!imagePath) return null;
  
  try {
    const imageUrl = getStoryImageUrl(imagePath);
    if (!imageUrl) return null;
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Impossible de récupérer l'image: ${response.status}`);
      return null;
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image:', error);
    return null;
  }
};