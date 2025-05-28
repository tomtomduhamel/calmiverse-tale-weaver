
/**
 * Utilitaire pour formater le contenu d'histoire avec des balises HTML
 */

/**
 * Formate le contenu de l'histoire avec des balises HTML pour l'affichage dans les emails
 * @param content - Le contenu brut de l'histoire
 * @returns Le contenu formaté avec des balises HTML
 */
export const formatStoryContentForEmail = (content: string): string => {
  if (!content) return '';
  
  // Séparer le contenu en paragraphes basés sur les doubles sauts de ligne
  const paragraphs = content.split(/\n\s*\n/);
  
  // Convertir chaque paragraphe en balise <p> et gérer les sauts de ligne simples
  const formattedParagraphs = paragraphs.map(paragraph => {
    // Remplacer les sauts de ligne simples par des <br>
    const formattedParagraph = paragraph.trim().replace(/\n/g, '<br>');
    return `<p style="margin-bottom: 16px; line-height: 1.6;">${formattedParagraph}</p>`;
  });
  
  return formattedParagraphs.join('');
};
