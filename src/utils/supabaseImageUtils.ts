/**
 * Utilitaire pour gérer les URLs des images Supabase
 */

/**
 * Génère l'URL publique d'une image stockée dans le bucket storyimages
 * @param imagePath Le chemin de l'image (ex: "story-id.jpeg")
 * @returns L'URL publique de l'image ou null si pas d'image
 */
export const getStoryImageUrl = (imagePath?: string | null): string | null => {
  if (!imagePath) {
    
    return null;
  }
  
  const supabaseUrl = 'https://ioeihnoxvtpxtqhxklpw.supabase.co';
  
  // Vérifier si le chemin contient déjà le préfixe "storyimages/"
  const cleanPath = imagePath.startsWith('storyimages/') 
    ? imagePath.substring('storyimages/'.length)
    : imagePath;
  
  const imageUrl = `${supabaseUrl}/storage/v1/object/public/storyimages/${cleanPath}`;
  
  return imageUrl;
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