import { stripStoryEmotionTags } from './storyContentFormatter';

export type VoiceCategorySlug = 
  | 'narrator'
  | 'narrator_family'
  | 'animal_land'
  | 'animal_flying'
  | 'animal_aquatic'
  | 'children'
  | 'child_boy'
  | 'child_girl'
  | 'magical_creatures'
  | string;

export const EMOTION_INSTRUCT_MAP: Record<string, string> = {
  warm: "Warm, soothing, gentle bedtime narrator for children.",
  whisper: "Soft, gentle whispering voice, quiet bedtime narrator.",
  excited: "Enthusiastic, cheerful, joyful storytelling voice for children.",
  mysterious: "Curious, gentle, mysterious bedtime storytelling voice.",
  calm: "Calm, peaceful, relaxed storytelling voice.",
  sleepy: "Very slow, soft, sleepy bedtime voice."
};

export interface VoiceCatalogItem {
  id: string;
  name: string;
  relation: string;
  category: string;
  category_name?: string | null;
  signedUrl: string | null;
  transcript?: string;
}

export interface RoleVoiceMapping {
  narrator?: string;
  narrator_family?: string;
  child_boy?: string;
  child_girl?: string;
  children?: string;
  animal_land?: string;
  animal_flying?: string;
  animal_aquatic?: string;
  magical_creatures?: string;
  [key: string]: string | undefined;
}

export interface AudioSegment {
  text: string;
  speakerType: 'narrator' | 'dialogue';
  roleCategory: VoiceCategorySlug;
  speakerName?: string;
  voiceId?: string;
  voiceRefUrl?: string;
  language: string;
  emotion?: string;
  instruct?: string;
}

/**
 * Détecte l'émotion et l'instruction vocale à partir de balises explicites ou d'heuristiques textuelles
 */
export const detectEmotionAndInstruct = (
  rawText: string,
  contextAround: string = '',
  fallbackInstruct?: string
): { emotion?: string; instruct?: string } => {
  const tagMatch = rawText.match(/\[(warm|whisper|excited|mysterious|calm|sleepy|instruct:\s*[^\]]+)\]/i);
  if (tagMatch) {
    const val = tagMatch[1].trim();
    if (val.toLowerCase().startsWith('instruct:')) {
      const customInstruct = val.substring('instruct:'.length).trim();
      return { emotion: 'custom', instruct: customInstruct };
    }
    const emotionKey = val.toLowerCase();
    return {
      emotion: emotionKey,
      instruct: EMOTION_INSTRUCT_MAP[emotionKey] || fallbackInstruct
    };
  }

  // Heuristiques sur verbes d'action et ponctuations
  const combined = (contextAround + ' ' + rawText).toLowerCase();
  
  if (/chuchot|murmur|tout bas|à voix basse|chut\b|discrètement|secret/i.test(combined)) {
    return { emotion: 'whisper', instruct: EMOTION_INSTRUCT_MAP.whisper };
  }
  if (/s'exclama|s'écria|cria|hurla|youpi|hourra|génial|sauta de joie|éclata de rire|riant/i.test(combined) || rawText.includes('!')) {
    return { emotion: 'excited', instruct: EMOTION_INSTRUCT_MAP.excited };
  }
  if (/bâill|s'endorm|fatigué|sommeil|paupières lourdes|ronfl|dodo/i.test(combined)) {
    return { emotion: 'sleepy', instruct: EMOTION_INSTRUCT_MAP.sleepy };
  }
  if (/mystère|bizarre|étrange|sombre|qui va là|curieux|inconnu/i.test(combined) || rawText.includes('?')) {
    return { emotion: 'mysterious', instruct: EMOTION_INSTRUCT_MAP.mysterious };
  }
  if (/doucement|paisible|calme|serein|repos/i.test(combined)) {
    return { emotion: 'calm', instruct: EMOTION_INSTRUCT_MAP.calm };
  }

  return { emotion: 'warm', instruct: fallbackInstruct || EMOTION_INSTRUCT_MAP.warm };
};

/**
 * Tente d'identifier la catégorie de rôle et le nom du personnage dans un dialogue
 */
export const detectCharacterCategoryAndName = (
  dialogueText: string,
  contextAround: string = ''
): { category: VoiceCategorySlug; detectedName?: string } => {
  const combined = (contextAround + ' ' + dialogueText).toLowerCase();

  // 1. Détection Monstres et créatures magiques
  if (/monstre|troll|géant|lutin|fée|robot|extraterrestre|sorcier|sorcière|gnome|dragon magique|créature/i.test(combined)) {
    let detectedName = 'Monstre / Créature magique';
    if (/robot/i.test(combined)) detectedName = 'Robot';
    else if (/fée/i.test(combined)) detectedName = 'Fée';
    else if (/troll/i.test(combined)) detectedName = 'Troll';
    else if (/lutin/i.test(combined)) detectedName = 'Lutin';
    else if (/monstre/i.test(combined)) detectedName = 'Monstre';
    return { category: 'magical_creatures', detectedName };
  }

  // 2. Détection Animaux volants et célestes
  if (/chouette|hibou|oiseau|aigle|papillon|dragon volant|faucon|pigeon|corbeau|oisillon|hirondelle/i.test(combined)) {
    let detectedName = 'Oiseau';
    if (/chouette|hibou/i.test(combined)) detectedName = 'Chouette';
    else if (/aigle/i.test(combined)) detectedName = 'Aigle';
    else if (/dragon/i.test(combined)) detectedName = 'Dragon';
    return { category: 'animal_flying', detectedName };
  }

  // 3. Détection Animaux marins et aquatiques
  if (/dauphin|baleine|poisson|requin|tortue de mer|pieuvre|sirène|phoque|crabe|étoile de mer|méduse/i.test(combined)) {
    let detectedName = 'Dauphin';
    if (/baleine/i.test(combined)) detectedName = 'Baleine';
    else if (/requin/i.test(combined)) detectedName = 'Requin';
    else if (/sirène/i.test(combined)) detectedName = 'Sirène';
    else if (/poisson/i.test(combined)) detectedName = 'Poisson';
    return { category: 'animal_aquatic', detectedName };
  }

  // 4. Détection Animaux terrestres
  if (/ours|ourson|chien|chiot|chat|chaton|lapin|renard|cerf|biche|lion|loup|peluche|doudou|écureuil|souris|hérisson/i.test(combined)) {
    let detectedName = 'Animal terrestre';
    if (/ours|ourson/i.test(combined)) detectedName = 'Ours';
    else if (/renard/i.test(combined)) detectedName = 'Renard';
    else if (/loup/i.test(combined)) detectedName = 'Loup';
    else if (/chien|chiot/i.test(combined)) detectedName = 'Chien';
    else if (/chat|chaton/i.test(combined)) detectedName = 'Chat';
    else if (/lapin/i.test(combined)) detectedName = 'Lapin';
    return { category: 'animal_land', detectedName };
  }

  // 5. Détection Enfants
  if (/fille|fillette|princesse|soeur|garçon|petit homme|prince|frère|enfant|bébé/i.test(combined)) {
    let detectedName = 'Enfant';
    if (/fille|fillette|princesse|soeur/i.test(combined)) detectedName = 'Petite Fille';
    else if (/garçon|petit homme|prince|frère/i.test(combined)) detectedName = 'Petit Garçon';
    return { category: 'children', detectedName };
  }

  return { category: 'children', detectedName: 'Personnage' };
};

/**
 * Résolution intelligente de la voix dans le catalogue de l'utilisateur
 */
export const resolveSmartVoice = (
  category: VoiceCategorySlug,
  detectedName: string | undefined,
  allUserVoices: VoiceCatalogItem[],
  fallbackNarratorVoice?: VoiceCatalogItem | null
): { voiceId?: string; voiceRefUrl?: string } => {
  if (!allUserVoices || allUserVoices.length === 0) {
    return {
      voiceId: fallbackNarratorVoice?.id,
      voiceRefUrl: fallbackNarratorVoice?.signedUrl || undefined
    };
  }

  // 1. Recherche par correspondance directe du nom ou de la relation
  if (detectedName) {
    const cleanTarget = detectedName.toLowerCase();
    const nameMatch = allUserVoices.find(v => {
      const vName = (v.name + ' ' + v.relation).toLowerCase();
      return vName.includes(cleanTarget) || cleanTarget.includes(v.relation.toLowerCase());
    });

    if (nameMatch?.signedUrl) {
      return { voiceId: nameMatch.id, voiceRefUrl: nameMatch.signedUrl };
    }
  }

  // 2. Recherche par catégorie exacte
  const categoryVoices = allUserVoices.filter(v => 
    (v.category === category || (category === 'children' && (v.category === 'child_boy' || v.category === 'child_girl'))) && 
    v.signedUrl
  );
  if (categoryVoices.length > 0) {
    return { voiceId: categoryVoices[0].id, voiceRefUrl: categoryVoices[0].signedUrl || undefined };
  }

  // 3. Fallback sur le narrateur principal
  return {
    voiceId: fallbackNarratorVoice?.id,
    voiceRefUrl: fallbackNarratorVoice?.signedUrl || undefined
  };
};

/**
 * Découpe un texte d'histoire en segments narrateur et dialogues avec attribution intelligente des voix
 */
export const parseStoryToAudioSegments = (
  content: string,
  allUserVoicesOrMapping: VoiceCatalogItem[] | RoleVoiceMapping = [],
  mainNarratorVoiceIdOrLang?: string,
  defaultLanguage: string = 'fr'
): AudioSegment[] => {
  if (!content || content.trim().length === 0) {
    return [];
  }

  // Compatibilité avec l'ancien format d'objet RoleVoiceMapping
  let allUserVoices: VoiceCatalogItem[] = [];
  let mainNarratorVoiceId: string | undefined;
  let language = defaultLanguage;

  if (Array.isArray(allUserVoicesOrMapping)) {
    allUserVoices = allUserVoicesOrMapping;
    mainNarratorVoiceId = mainNarratorVoiceIdOrLang;
  } else if (typeof allUserVoicesOrMapping === 'object') {
    // Transformer l'objet legacy en tableau
    const mapping = allUserVoicesOrMapping as RoleVoiceMapping;
    allUserVoices = Object.entries(mapping)
      .filter(([_, url]) => !!url)
      .map(([key, url], idx) => ({
        id: `legacy_${idx}`,
        name: key,
        relation: key,
        category: key === 'narrator' ? 'narrator_family' : key,
        signedUrl: url || null
      }));
    if (mainNarratorVoiceIdOrLang && mainNarratorVoiceIdOrLang.length === 2) {
      language = mainNarratorVoiceIdOrLang;
    }
  }

  const segments: AudioSegment[] = [];
  const dialogueRegex = /(«[^»]+»|"[^"]+"|^[—\-]\s*[^.\n]+)/gm;
  const paragraphs = content.split(/\n\s*\n/);

  const fallbackNarrator = allUserVoices.find(v => v.id === mainNarratorVoiceId) 
    || allUserVoices.find(v => v.category === 'narrator_family' || v.category === 'narrator')
    || allUserVoices[0] 
    || null;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // Détection de l'émotion globale du paragraphe
    const paraEmotion = detectEmotionAndInstruct(trimmed);

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const localRegex = new RegExp(dialogueRegex.source, 'gm');

    while ((match = localRegex.exec(trimmed)) !== null) {
      const matchIndex = match.index;
      
      // Texte du narrateur avant le dialogue
      if (matchIndex > lastIndex) {
        const rawNarratorText = trimmed.substring(lastIndex, matchIndex).trim();
        const cleanNarratorText = stripStoryEmotionTags(rawNarratorText);
        if (cleanNarratorText.length > 0) {
          const narratorEmotion = detectEmotionAndInstruct(rawNarratorText, '', paraEmotion.instruct);
          segments.push({
            text: cleanNarratorText,
            speakerType: 'narrator',
            roleCategory: 'narrator_family',
            voiceId: fallbackNarrator?.id,
            voiceRefUrl: fallbackNarrator?.signedUrl || undefined,
            language: language,
            emotion: narratorEmotion.emotion,
            instruct: narratorEmotion.instruct
          });
        }
      }

      // Texte du dialogue
      const rawDialogueMatch = match[0];
      const dialogueText = rawDialogueMatch.replace(/^[«"——-]\s*|\s*[»"]$/g, '').trim();
      const cleanDialogueText = stripStoryEmotionTags(dialogueText);

      if (cleanDialogueText.length > 0) {
        const contextAround = trimmed.substring(Math.max(0, matchIndex - 60), Math.min(trimmed.length, matchIndex + rawDialogueMatch.length + 60));
        const { category, detectedName } = detectCharacterCategoryAndName(cleanDialogueText, contextAround);
        const resolved = resolveSmartVoice(category, detectedName, allUserVoices, fallbackNarrator);
        const dialogueEmotion = detectEmotionAndInstruct(rawDialogueMatch, contextAround, paraEmotion.instruct);

        segments.push({
          text: cleanDialogueText,
          speakerType: 'dialogue',
          roleCategory: category,
          speakerName: detectedName,
          voiceId: resolved.voiceId,
          voiceRefUrl: resolved.voiceRefUrl,
          language: language,
          emotion: dialogueEmotion.emotion,
          instruct: dialogueEmotion.instruct
        });
      }

      lastIndex = localRegex.lastIndex;
    }

    // Texte restant dans le paragraphe
    if (lastIndex < trimmed.length) {
      const rawRemainingNarratorText = trimmed.substring(lastIndex).trim();
      const cleanRemainingNarratorText = stripStoryEmotionTags(rawRemainingNarratorText);
      if (cleanRemainingNarratorText.length > 0) {
        const remainingEmotion = detectEmotionAndInstruct(rawRemainingNarratorText, '', paraEmotion.instruct);
        segments.push({
          text: cleanRemainingNarratorText,
          speakerType: 'narrator',
          roleCategory: 'narrator_family',
          voiceId: fallbackNarrator?.id,
          voiceRefUrl: fallbackNarrator?.signedUrl || undefined,
          language: language,
          emotion: remainingEmotion.emotion,
          instruct: remainingEmotion.instruct
        });
      }
    }
  }

  return segments;
};
