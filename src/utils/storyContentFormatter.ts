
/**
 * Utilitaire pour formater et nettoyer le contenu d'histoire
 */

/**
 * Regex correspondant aux balises d'émotions audio (ex: [warm], [whisper], [excited], [mysterious], [calm], [sleepy], [instruct: ...])
 */
export const STORY_EMOTION_TAGS_REGEX = /\[(warm|whisper|excited|mysterious|calm|sleepy|instruct:[^\]]+|[a-zA-Z0-9_\-\s:]+)\]/gi;

/**
 * Supprime de manière transparente toutes les balises d'émotions audio d'un texte d'histoire
 * pour un affichage 100% propre dans les lecteurs, aperçus, emails et exports.
 * 
 * @param content - Le texte brut de l'histoire (pouvant contenir des balises [whisper], [excited], etc.)
 * @returns Le texte nettoyé sans aucune balise, avec espaces et sauts de ligne normalisés.
 */
export const stripStoryEmotionTags = (content: string | undefined | null): string => {
  if (!content) return '';

  return content
    // Supprimer les balises d'émotions
    .replace(STORY_EMOTION_TAGS_REGEX, '')
    // Nettoyer les espaces superflus en début de ligne
    .replace(/^[ \t]+/gm, '')
    // Nettoyer les espaces multiples consécutifs sur une même ligne
    .replace(/[ \t]{2,}/g, ' ')
    // Éviter l'accumulation excessive de sauts de ligne (max 2 sauts consécutifs)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Formate le contenu de l'histoire avec des balises HTML pour l'affichage dans les emails
 * @param content - Le contenu brut de l'histoire
 * @returns Le contenu formaté avec des balises HTML
 */
export const formatStoryContentForEmail = (content: string): string => {
  if (!content) return '';
  
  const cleanContent = stripStoryEmotionTags(content);
  
  // Séparer le contenu en paragraphes basés sur les doubles sauts de ligne
  const paragraphs = cleanContent.split(/\n\s*\n/);
  
  // Convertir chaque paragraphe en balise <p> et gérer les sauts de ligne simples
  const formattedParagraphs = paragraphs.map(paragraph => {
    // Remplacer les sauts de ligne simples par des <br>
    const formattedParagraph = paragraph.trim().replace(/\n/g, '<br>');
    return `<p style="margin-bottom: 16px; line-height: 1.6;">${formattedParagraph}</p>`;
  });
  
  return formattedParagraphs.join('');
};

