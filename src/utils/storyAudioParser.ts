/**
 * Utilitaire de découpage de texte d'histoire en segments multi-voix pour la synthèse audio (TTS)
 */

export type CharacterRoleCategory = 
  | 'narrator' 
  | 'child_boy' 
  | 'child_girl' 
  | 'animal_land' 
  | 'animal_flying' 
  | 'animal_aquatic'
  | 'other';

export interface AudioSegment {
  text: string;
  speakerType: 'narrator' | 'dialogue';
  roleCategory: CharacterRoleCategory;
  speakerName?: string;
  voiceRefUrl?: string;
  language: string;
}

export interface RoleVoiceMapping {
  narrator?: string;
  child_boy?: string;
  child_girl?: string;
  animal_land?: string;
  animal_flying?: string;
  animal_aquatic?: string;
}

/**
 * Tente d'identifier le rôle du locuteur dans une phrase de dialogue à partir de mots-clés
 */
const detectRoleCategory = (text: string, contextBefore: string = ''): CharacterRoleCategory => {
  const combined = (contextBefore + ' ' + text).toLowerCase();

  // Détection volants
  if (/chouette|hibou|oiseau|aigle|papillon|dragon volant|faucon|pigeon|voler|aile/i.test(combined)) {
    return 'animal_flying';
  }
  // Détection aquatiques
  if (/dauphin|baleine|poisson|requin|tortue de mer|pieuvre|sirène|nage|eau|mer|océan/i.test(combined)) {
    return 'animal_aquatic';
  }
  // Détection terrestres
  if (/ours|chien|chat|lapin|renard|cerf|lion|loup|peluche|doudou|écureuil/i.test(combined)) {
    return 'animal_land';
  }
  // Détection fille
  if (/fille|fillette|princesse|soeur|elle chuchota|elle dit|s'exclama-t-elle/i.test(combined)) {
    return 'child_girl';
  }
  // Détection garçon
  if (/garçon|petit homme|prince|frère|il chuchota|il dit|s'exclama-t-il/i.test(combined)) {
    return 'child_boy';
  }

  return 'child_boy'; // Défaut pour dialogue
};

/**
 * Découpe un texte d'histoire en segments narrateur et dialogues avec attribution de rôles vocaux
 * @param content Le texte brut de l'histoire
 * @param voiceMapping Mappage des URLs de référence vocale par catégorie de rôle
 * @param defaultLanguage La langue par défaut ('fr')
 * @returns Tableau de segments structurés prêts pour la synthèse multi-voix
 */
export const parseStoryToAudioSegments = (
  content: string,
  voiceMapping: RoleVoiceMapping = {},
  defaultLanguage: string = 'fr'
): AudioSegment[] => {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const segments: AudioSegment[] = [];
  const dialogueRegex = /(«[^»]+»|"[^"]+"|^[—\-]\s*[^.\n]+)/gm;
  const paragraphs = content.split(/\n\s*\n/);

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const localRegex = new RegExp(dialogueRegex.source, 'gm');

    while ((match = localRegex.exec(trimmed)) !== null) {
      const matchIndex = match.index;
      
      // Texte du narrateur avant le dialogue
      if (matchIndex > lastIndex) {
        const narratorText = trimmed.substring(lastIndex, matchIndex).trim();
        if (narratorText.length > 0) {
          segments.push({
            text: narratorText,
            speakerType: 'narrator',
            roleCategory: 'narrator',
            voiceRefUrl: voiceMapping.narrator,
            language: defaultLanguage
          });
        }
      }

      // Texte du dialogue
      const dialogueText = match[0].replace(/^[«"——-]\s*|\s*[»"]$/g, '').trim();
      if (dialogueText.length > 0) {
        const contextBefore = trimmed.substring(Math.max(0, matchIndex - 50), matchIndex);
        const role = detectRoleCategory(dialogueText, contextBefore);
        
        segments.push({
          text: dialogueText,
          speakerType: 'dialogue',
          roleCategory: role,
          voiceRefUrl: voiceMapping[role] || voiceMapping.narrator,
          language: defaultLanguage
        });
      }

      lastIndex = localRegex.lastIndex;
    }

    // Texte restant dans le paragraphe
    if (lastIndex < trimmed.length) {
      const remainingNarratorText = trimmed.substring(lastIndex).trim();
      if (remainingNarratorText.length > 0) {
        segments.push({
          text: remainingNarratorText,
          speakerType: 'narrator',
          roleCategory: 'narrator',
          voiceRefUrl: voiceMapping.narrator,
          language: defaultLanguage
        });
      }
    }
  }

  return segments;
};
