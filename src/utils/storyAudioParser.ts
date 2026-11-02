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
  // Émotions vives et expressives (contes & surjeu d'acteur type podcast animé)
  joy: "Cheerful, joyful, bright and lively storytelling voice for children.",
  happy: "Cheerful, joyful, bright and lively storytelling voice for children.",
  excited: "Enthusiastic, energetic, lively, animated and dynamic storytelling voice.",
  playful: "Playful, mischievous, dynamic and amusing storytelling voice.",
  angry: "Firm, indignant, dramatic, intense storytelling voice.",
  colere: "Firm, indignant, dramatic, intense storytelling voice.",
  sad: "Melancholic, gentle, tender, slightly sorrowful storytelling voice.",
  triste: "Melancholic, gentle, tender, slightly sorrowful storytelling voice.",
  scared: "Anxious, startled, breathless storytelling voice.",
  peur: "Anxious, startled, breathless storytelling voice.",
  // Ambiances de lecture et narration podcast captivante
  narrator: "Dynamic, warm, engaging, lively storytelling voice for children. Clear intonation, captivating rhythm, cheerful presence.",
  warm: "Dynamic, warm, engaging, lively storytelling voice for children. Clear intonation, captivating rhythm, cheerful presence.",
  whisper: "Soft, gentle whispering voice, quiet storytelling.",
  mysterious: "Curious, intriguing, captivating storytelling voice.",
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
  voiceRefPath?: string | null;
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
  voiceRefPath?: string;
  ref_text?: string;
  transcript?: string;
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
  const tagMatch = rawText.match(/\[(joy|happy|excited|playful|angry|colere|sad|triste|scared|peur|warm|whisper|mysterious|calm|sleepy|instruct:\s*[^\]]+)\]/i);
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

  // Heuristiques sur verbes d'action, expressions et ponctuations
  const combined = (contextAround + ' ' + rawText).toLowerCase();
  
  if (/colère|furieu|gronda|s['’]énerva|tempêta|rage|mécontent|indigné|scandale/i.test(combined)) {
    return { emotion: 'angry', instruct: EMOTION_INSTRUCT_MAP.angry };
  }
  if (/triste|sanglot|pleur|chagrin|déçu|larmes|désolé|peine|déchirant/i.test(combined)) {
    return { emotion: 'sad', instruct: EMOTION_INSTRUCT_MAP.sad };
  }
  if (/peur|panique|effray|trembl|terreur|angoisse|monstre|frémir/i.test(combined)) {
    return { emotion: 'scared', instruct: EMOTION_INSTRUCT_MAP.scared };
  }
  if (/s['’]exclama|youpi|hourra|génial|sauta de joie|éclata de rire|riant|joyeu|fête|chouette|rigol|drôle/i.test(combined)) {
    return { emotion: 'joy', instruct: EMOTION_INSTRUCT_MAP.joy };
  }
  if (/cria|hurla|bondit|élança|attrapez|sauvons|vite\b|attention|alerte|urgence/i.test(combined) || rawText.includes('!')) {
    return { emotion: 'excited', instruct: EMOTION_INSTRUCT_MAP.excited };
  }
  if (/chuchot|murmur|tout bas|à voix basse|chut\b|discrètement|secret/i.test(combined)) {
    return { emotion: 'whisper', instruct: EMOTION_INSTRUCT_MAP.whisper };
  }
  if (/bâill|s['’]endorm|fatigué|sommeil|paupières lourdes|ronfl|dodo/i.test(combined)) {
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

export interface DiscoveredCharacter {
  name: string;
  category: VoiceCategorySlug;
  voiceId?: string;
  baseType?: string;
}

/**
 * Analyse l'histoire pour indexer les personnages nommés et les mapper à leurs archétypes vocaux
 */
export const buildCharacterIndex = (
  content: string,
  userVoices: VoiceCatalogItem[] = []
): Map<string, DiscoveredCharacter> => {
  const index = new Map<string, DiscoveredCharacter>();

  // 1. Ajouter les voix explicites du catalogue utilisateur
  for (const v of userVoices) {
    if (v.name) {
      index.set(v.name.toLowerCase(), { name: v.name, category: v.category as VoiceCategorySlug, voiceId: v.id });
    }
    if (v.relation) {
      const cleanRel = v.relation.replace(/\(.*?\)/g, '').trim().toLowerCase();
      if (cleanRel) {
        index.set(cleanRel, { name: v.name, category: v.category as VoiceCategorySlug, voiceId: v.id });
      }
      const insideParen = v.relation.match(/\((.*?)\)/);
      if (insideParen && insideParen[1]) {
        index.set(insideParen[1].trim().toLowerCase(), { name: v.name, category: v.category as VoiceCategorySlug, voiceId: v.id });
      }
    }
  }

  // Alias standards de la famille
  if (!index.has('papa')) index.set('papa', { name: 'Papa', category: 'narrator_family' });
  if (!index.has('maman')) index.set('maman', { name: 'Maman', category: 'narrator_family' });
  if (!index.has('mamie')) index.set('mamie', { name: 'Mamie Onix', category: 'narrator_family' });
  if (!index.has('mamie onix')) index.set('mamie onix', { name: 'Mamie Onix', category: 'narrator_family' });
  if (!index.has('mamy')) index.set('mamy', { name: 'Mamie Onix', category: 'narrator_family' });
  if (!index.has('papi')) index.set('papi', { name: 'Papi', category: 'narrator_family' });
  if (!index.has('papy')) index.set('papy', { name: 'Papi', category: 'narrator_family' });

  // 2. Découverte des personnages nommés dans le récit (ex: "un ours brun nommé Biscotin")
  const patterns = [
    /\b(?:un|une|le|la|l['’])\s*(ours|ourson|chien|chiot|chat|chaton|lapin|renard|loup|écureuil|hérisson)\b(?:\s+[a-zà-ÿ]+){0,2}\s+(?:nommé|nommée|appelé|appelée)\s+([A-ZÀ-ÿ][a-zà-ÿ]+)/gi,
    /\b(?:un|une|le|la|l['’])\s*(oiseau|chouette|hibou|aigle|papillon|corbeau)\b(?:\s+[a-zà-ÿ]+){0,2}\s+(?:nommé|nommée|appelé|appelée)\s+([A-ZÀ-ÿ][a-zà-ÿ]+)/gi,
    /\b(?:un|une|le|la|l['’])\s*(dauphin|baleine|poisson|requin|tortue)\b(?:\s+[a-zà-ÿ]+){0,2}\s+(?:nommé|nommée|appelé|appelée)\s+([A-ZÀ-ÿ][a-zà-ÿ]+)/gi,
    /\b(?:un|une|le|la|l['’])\s*(monstre|dragon|robot|lutin|fée|sorcier|sorcière)\b(?:\s+[a-zà-ÿ]+){0,2}\s+(?:nommé|nommée|appelé|appelée)\s+([A-ZÀ-ÿ][a-zà-ÿ]+)/gi,
    /\bl['’](ours|ourson|oiseau|aigle)\s+([A-ZÀ-ÿ][a-zà-ÿ]+)/gi
  ];

  for (const pat of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pat.exec(content)) !== null) {
      const type = m[1].toLowerCase();
      const charName = m[2].trim();
      let category: VoiceCategorySlug = 'children';
      if (/ours|chien|chat|lapin|renard|loup|écureuil|hérisson/.test(type)) category = 'animal_land';
      else if (/oiseau|chouette|hibou|aigle|papillon|corbeau/.test(type)) category = 'animal_flying';
      else if (/dauphin|baleine|poisson|requin|tortue/.test(type)) category = 'animal_aquatic';
      else if (/monstre|dragon|robot|lutin|fée|sorcier/.test(type)) category = 'magical_creatures';

      index.set(charName.toLowerCase(), { name: charName, category, baseType: type });
    }
  }

  return index;
};

/**
 * Extrait le nom du locuteur à partir des incises narratives précédant ou suivant le dialogue
 */
export const extractSpeakerFromContext = (
  contextBefore: string,
  contextAfter: string,
  characterIndex: Map<string, DiscoveredCharacter>,
  allUserVoices: VoiceCatalogItem[]
): string | undefined => {
  // 1. Tag explicite de dialogue : [Papa]: ou [Mamie Onix]
  const tagBefore = contextBefore.match(/\[([A-Za-zÀ-ÿ0-9\s_-]+)\]\s*:?\s*$/);
  if (tagBefore) return tagBefore[1].trim();

  // 2. Verbe incise précédent : "Gustave s’exclame en riant :" ou "Papa crie :" ou "Biscotin grogne :"
  const preVerb = contextBefore.match(/([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)?)\s+(?:dit|demande|s['’](?:exclame|écrie|étonne|inquiète|amuse|élance|agite)|répond|ajoute|appelle|grogne|souffle|chuchote|crie|hurle|piaille|roucoule|rugit|soupire|insiste|reprend|pense|lance|rétorque|sourit)\b[^:«"]*:\s*$/i);
  if (preVerb) return preVerb[1].trim();

  // 2b. Sujet de la phrase précédant immédiatement le dialogue : e.g. "Joseph s'accroupit pour regarder les roues."
  const preSubject = contextBefore.match(/([A-ZÀ-ÿ][a-zà-ÿ]+)\s+[a-zà-ÿ'’\s]+[.!?…]\s*$/i);
  if (preSubject) {
    const candidate = preSubject[1].trim();
    if (characterIndex.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // 3. Présentation précédente : "C’est Mamie Onix qui encourage"
  const prePres = contextBefore.match(/(?:C['’]est|Voici)\s+([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)?)\s+qui\b/i);
  if (prePres) return prePres[1].trim();

  // 4. Verbe incise suivant : "», dit Papa" ou "», lance coach Bison" ou "» grogne Biscotin."
  const postIncise = contextAfter.match(/^\s*[,;—\-\.]?\s*(?:dit|demande|s['’](?:exclame|écrie|étonne|inquiète|amuse)|répond|ajoute|appelle|grogne|souffle|chuchote|crie|hurle|piaille|roucoule|rugit|soupire|insiste|reprend|pense|lance|rétorque|sourit)\s+(?:le\s+|la\s+|l['’]|un\s+|une\s+)?([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)?)/i);
  if (postIncise) return postIncise[1].trim();

  // 4b. Verbe incise avec pronom : "», dit-il en souriant" ou "», répondit-elle"
  const pronounIncise = contextAfter.match(/^\s*[,;—\-\.]?\s*(?:dit|demande|lance|répond|souffle|sourit|ajoute|chuchote|crie|s['’]exclame|s['’]écrie)-(il|elle|on)\b/i);
  if (pronounIncise) {
    const pronoun = pronounIncise[1].toLowerCase();
    // Chercher le sujet de la phrase précédente dans contextBefore
    const lastPreSubject = contextBefore.match(/(?:le\s+|la\s+|l['’]|un\s+|une\s+)?([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)?)\s+[a-zà-ÿ'’\s,]+[.!?…]\s*$/i);
    if (lastPreSubject) {
      return lastPreSubject[1].trim();
    }
    return pronoun === 'elle' ? 'Personnage Féminin' : 'Personnage Masculin';
  }

  // 5. Présentation suivante : "» C’est Mamie Onix qui encourage"
  const postPres = contextAfter.match(/^\s*(?:[—\-]\s*)?(?:C['’]est|Voici)\s+([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)?)\s+qui\b/i);
  if (postPres) return postPres[1].trim();

  // 6. Présence du nom d'un personnage connu dans le contexte immédiat
  const combined = (contextBefore + ' ' + contextAfter).toLowerCase();
  for (const [key, info] of characterIndex.entries()) {
    const reg = new RegExp(`\\b${key}\\b`, 'i');
    if (reg.test(combined)) {
      return info.name;
    }
  }

  return undefined;
};

/**
 * Tente d'identifier la catégorie de rôle et le nom du personnage dans un dialogue
 */
export const detectCharacterCategoryAndName = (
  dialogueText: string,
  contextAround: string = '',
  speakerName?: string,
  characterIndex?: Map<string, DiscoveredCharacter>
): { category: VoiceCategorySlug; detectedName?: string; baseType?: string } => {
  // 1. Si le locuteur a été extrait et existe dans l'index
  if (speakerName && characterIndex) {
    const sKey = speakerName.toLowerCase();
    if (characterIndex.has(sKey)) {
      const charInfo = characterIndex.get(sKey)!;
      return { category: charInfo.category, detectedName: charInfo.name, baseType: charInfo.baseType };
    }
  }

  const combined = (contextAround + ' ' + dialogueText).toLowerCase();

  // 2. Adultes & membres de la famille
  if (/\b(papa|père|pere|daddy|father)\b/i.test(combined)) {
    return { category: 'narrator_family', detectedName: 'Papa' };
  }
  if (/\b(maman|mère|mere|mommy|mother)\b/i.test(combined)) {
    return { category: 'narrator_family', detectedName: 'Maman' };
  }
  if (/\b(mamie|mamy|onix|grand-mère|grand-maman|grand-mere)\b/i.test(combined)) {
    return { category: 'narrator_family', detectedName: 'Mamie Onix' };
  }
  if (/\b(papi|papy|grand-père|grand-pere)\b/i.test(combined)) {
    return { category: 'narrator_family', detectedName: 'Papi' };
  }
  if (/\b(monsieur|m\.|chef|docteur|capitaine|maître|maitre|voisin|marchand|boulanger|policier|pompier|roi|fermier|jardinier|coach|entraîneur|entraineur|professeur|prof|directeur|arbitre)\b/i.test(combined) || (speakerName && /\b(monsieur|chef|capitaine|roi|coach|bison)\b/i.test(speakerName))) {
    return { category: 'narrator_family', detectedName: speakerName || 'Monsieur' };
  }
  if (/\b(madame|mme|maîtresse|maitresse|voisine|marchande|boulangère|reine|fermière|coach|entraîneuse|professeure|directrice)\b/i.test(combined) || (speakerName && /\b(madame|reine|maîtresse)\b/i.test(speakerName))) {
    return { category: 'narrator_family', detectedName: speakerName || 'Madame' };
  }

  // 3. Détection Monstres et créatures magiques
  if (/\b(monstre|troll|géant|lutin|fée|robot|extraterrestre|sorcier|sorcière|gnome|dragon magique|créature)\b/i.test(combined)) {
    let detectedName = 'Monstre / Créature magique';
    if (/\brobot\b/i.test(combined)) detectedName = 'Robot';
    else if (/\bfée\b/i.test(combined)) detectedName = 'Fée';
    else if (/\btroll\b/i.test(combined)) detectedName = 'Troll';
    else if (/\blutin\b/i.test(combined)) detectedName = 'Lutin';
    else if (/\bmonstre\b/i.test(combined)) detectedName = 'Monstre';
    return { category: 'magical_creatures', detectedName };
  }

  // 4. Détection Animaux volants et célestes
  if (/\b(chouette|hibou|oiseau|aigle|papillon|dragon volant|faucon|pigeon|corbeau|oisillon|hirondelle)\b/i.test(combined)) {
    let detectedName = 'Oiseau';
    if (/\b(chouette|hibou)\b/i.test(combined)) detectedName = 'Chouette';
    else if (/\baigle\b/i.test(combined)) detectedName = 'Aigle';
    return { category: 'animal_flying', detectedName };
  }

  // 5. Détection Animaux marins et aquatiques
  if (/\b(dauphin|baleine|poisson|requin|tortue de mer|pieuvre|sirène|phoque|crabe|étoile de mer|méduse)\b/i.test(combined)) {
    let detectedName = 'Dauphin';
    if (/\bbaleine\b/i.test(combined)) detectedName = 'Baleine';
    else if (/\brequin\b/i.test(combined)) detectedName = 'Requin';
    return { category: 'animal_aquatic', detectedName };
  }

  // 6. Détection Animaux terrestres (avec délimiteurs \b stricts pour éviter les faux positifs comme "toujours")
  if (/\b(ours|ourson|chien|chiot|chat|chaton|lapin|renard|cerf|biche|lion|loup|peluche|doudou|écureuil|souris|hérisson)\b/i.test(combined)) {
    let detectedName = 'Animal terrestre';
    if (/\b(ours|ourson)\b/i.test(combined)) detectedName = 'Ours';
    else if (/\brenard\b/i.test(combined)) detectedName = 'Renard';
    else if (/\bloup\b/i.test(combined)) detectedName = 'Loup';
    else if (/\b(chien|chiot)\b/i.test(combined)) detectedName = 'Chien';
    else if (/\b(chat|chaton)\b/i.test(combined)) detectedName = 'Chat';
    else if (/\blapin\b/i.test(combined)) detectedName = 'Lapin';
    return { category: 'animal_land', detectedName };
  }

  // 7. Détection Enfants
  if (/\b(fille|fillette|princesse|soeur|garçon|petit homme|prince|frère|enfant|bébé)\b/i.test(combined)) {
    let detectedName = 'Enfant';
    if (/\b(fille|fillette|princesse|soeur)\b/i.test(combined)) detectedName = 'Petite Fille';
    else if (/\b(garçon|petit homme|prince|frère)\b/i.test(combined)) detectedName = 'Petit Garçon';
    return { category: 'children', detectedName };
  }

  return { category: 'children', detectedName: speakerName || 'Personnage' };
};

/**
 * Résolution intelligente de la voix dans le catalogue de l'utilisateur
 */
export const resolveSmartVoice = (
  category: VoiceCategorySlug,
  detectedName: string | undefined,
  allUserVoices: VoiceCatalogItem[],
  fallbackNarratorVoice?: VoiceCatalogItem | null,
  baseType?: string
): { voiceId?: string; voiceRefUrl?: string; voiceRefPath?: string; transcript?: string } => {
  if (!allUserVoices || allUserVoices.length === 0) {
    return {
      voiceId: fallbackNarratorVoice?.id,
      voiceRefUrl: fallbackNarratorVoice?.signedUrl || undefined,
      voiceRefPath: fallbackNarratorVoice?.voiceRefPath || undefined,
      transcript: fallbackNarratorVoice?.transcript || undefined
    };
  }

  // 1. Recherche par correspondance directe du nom ou de la relation
  if (detectedName) {
    const cleanTarget = detectedName.toLowerCase();
    const nameMatch = allUserVoices.find(v => {
      const vName = (v.name + ' ' + v.relation).toLowerCase();
      return vName.includes(cleanTarget) || cleanTarget.includes(v.name.toLowerCase()) || cleanTarget.includes(v.relation.toLowerCase());
    });

    if (nameMatch?.signedUrl) {
      return {
        voiceId: nameMatch.id,
        voiceRefUrl: nameMatch.signedUrl,
        voiceRefPath: nameMatch.voiceRefPath || undefined,
        transcript: nameMatch.transcript || undefined
      };
    }
  }

  // 2. Recherche par type animal de base découvert (ex: Biscotin -> ours -> Voix Ours)
  if (baseType) {
    const bMatch = allUserVoices.find(v => {
      const vText = (v.name + ' ' + v.relation).toLowerCase();
      return vText.includes(baseType.toLowerCase());
    });
    if (bMatch?.signedUrl) {
      return {
        voiceId: bMatch.id,
        voiceRefUrl: bMatch.signedUrl,
        voiceRefPath: bMatch.voiceRefPath || undefined,
        transcript: bMatch.transcript || undefined
      };
    }
  }

  // 3. Recherche par catégorie avec filtrage strict de cohérence de genre (anti-inversion Papa/Mamie/Garçon/Fille)
  const stripAccents = (str: string): string =>
    (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const cleanDetected = stripAccents(detectedName || '');
  const isFemaleCharacter = cleanDetected ? /\b(mamie|mamy|maman|mere|madame|mme|reine|femme|fille|fillette|soeur|princesse|onix|zoe|lea|chloe|emma|camille|jade|louise|alice|lola|manon|sarah|eva|rose|mia|lina|ambre|mila|anna|lucie|juliette|ines|jeanne|clara|lena|maelys|victoire|agathe|maya|lise|solene)\b/.test(cleanDetected) : false;
  const isMaleCharacter = cleanDetected ? /\b(papa|pere|papi|papy|monsieur|m\.|roi|homme|chef|garcon|frere|prince|sami|lucas|hugo|leo|gabriel|jules|arthur|louis|raphael|noah|adam|mael|paul|nathan|tom|sacha|theo|ethan|timeo|nolhan|bastien|maxime|coach|bison|entraineur|professeur|directeur)\b/.test(cleanDetected) : false;

  const categoryVoices = allUserVoices.filter(v => {
    if (!v.signedUrl) return false;
    
    if (category === 'children') {
      const vClean = stripAccents(v.name + ' ' + (v.relation || ''));
      const isVoiceFemale = v.category === 'child_girl' || /\b(fille|fillette|soeur|princesse)\b/.test(vClean);
      const isVoiceMale = v.category === 'child_boy' || /\b(garcon|frere|prince)\b/.test(vClean);
      if (isFemaleCharacter && isVoiceMale && !isVoiceFemale) return false;
      if (isMaleCharacter && isVoiceFemale && !isVoiceMale) return false;
      return v.category === 'children' || v.category === 'child_boy' || v.category === 'child_girl';
    }

    if (category === 'narrator_family') {
      if (v.category !== 'narrator_family') return false;
      const vClean = stripAccents(v.name + ' ' + (v.relation || ''));
      const isVoiceFemale = /\b(mamie|mamy|maman|mere|onix|madame|femme)\b/.test(vClean);
      const isVoiceMale = /\b(papa|pere|papi|papy|monsieur|homme|coach|bison|entraineur)\b/.test(vClean);
      if (isFemaleCharacter && isVoiceMale && !isVoiceFemale) return false;
      if (isMaleCharacter && isVoiceFemale && !isVoiceMale) return false;
      return true;
    }

    return v.category === category;
  });
  if (categoryVoices.length > 0) {
    return {
      voiceId: categoryVoices[0].id,
      voiceRefUrl: categoryVoices[0].signedUrl || undefined,
      voiceRefPath: categoryVoices[0].voiceRefPath || undefined,
      transcript: categoryVoices[0].transcript || undefined
    };
  }

  // 4. Si une voix de narrateur (ex: parent) avec référence audio est disponible, fallback dessus
  if (fallbackNarratorVoice?.signedUrl) {
    return {
      voiceId: fallbackNarratorVoice.id,
      voiceRefUrl: fallbackNarratorVoice.signedUrl,
      voiceRefPath: fallbackNarratorVoice.voiceRefPath || undefined,
      transcript: fallbackNarratorVoice.transcript || undefined
    };
  }

  // 5. Attribution automatique d'une voix de synthèse typée selon le profil si aucun clone n'est disponible
  const TYPED_CHARACTER_VOICES: Record<string, { voiceId: string; instruct?: string }> = {
    magical_creatures: { voiceId: 'standard-french-male', instruct: "Deep, mysterious, gentle creature voice" },
    animal_flying: { voiceId: 'standard-french-female-alt', instruct: "Light, airy, cheerful soaring voice" },
    animal_aquatic: { voiceId: 'standard-french-female-alt', instruct: "Calm, fluid, peaceful ocean voice" },
    animal_land: { voiceId: 'standard-french-male', instruct: "Warm, grounded, playful forest animal voice" },
    children: { voiceId: 'standard-french-female', instruct: "Enthusiastic, bright, joyful child voice" }
  };

  const typed = TYPED_CHARACTER_VOICES[category];
  if (typed) {
    return {
      voiceId: typed.voiceId,
      voiceRefUrl: undefined
    };
  }

  // 6. Fallback ultime sur le narrateur principal
  return {
    voiceId: fallbackNarratorVoice?.id,
    voiceRefUrl: fallbackNarratorVoice?.signedUrl || undefined,
    voiceRefPath: fallbackNarratorVoice?.voiceRefPath || undefined,
    transcript: fallbackNarratorVoice?.transcript || undefined
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

  // Indexation globale des personnages de l'histoire et du catalogue
  const characterIndex = buildCharacterIndex(content, allUserVoices);

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
    let lastSpeakerInPara: string | undefined = undefined;

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
            voiceRefPath: fallbackNarrator?.voiceRefPath || undefined,
            ref_text: fallbackNarrator?.transcript || undefined,
            transcript: fallbackNarrator?.transcript || undefined,
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
        const contextBefore = trimmed.substring(Math.max(0, matchIndex - 80), matchIndex);
        const contextAfter = trimmed.substring(matchIndex + rawDialogueMatch.length, Math.min(trimmed.length, matchIndex + rawDialogueMatch.length + 80));
        const contextAround = contextBefore + ' ' + contextAfter;

        let speaker = extractSpeakerFromContext(contextBefore, contextAfter, characterIndex, allUserVoices);
        if (!speaker && lastSpeakerInPara) {
          speaker = lastSpeakerInPara;
        }
        if (speaker) {
          lastSpeakerInPara = speaker;
        }

        const { category, detectedName, baseType } = detectCharacterCategoryAndName(cleanDialogueText, contextAround, speaker, characterIndex);
        const resolved = resolveSmartVoice(category, detectedName, allUserVoices, fallbackNarrator, baseType);
        const dialogueEmotion = detectEmotionAndInstruct(rawDialogueMatch, contextAround, paraEmotion.instruct);

        segments.push({
          text: cleanDialogueText,
          speakerType: 'dialogue',
          roleCategory: category,
          speakerName: detectedName || speaker,
          voiceId: resolved.voiceId,
          voiceRefUrl: resolved.voiceRefUrl,
          voiceRefPath: resolved.voiceRefPath,
          ref_text: resolved.transcript,
          transcript: resolved.transcript,
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
          voiceRefPath: fallbackNarrator?.voiceRefPath || undefined,
          ref_text: fallbackNarrator?.transcript || undefined,
          transcript: fallbackNarrator?.transcript || undefined,
          language: language,
          emotion: remainingEmotion.emotion,
          instruct: remainingEmotion.instruct
        });
      }
    }
  }

  // Optimisation majeure : Fusion des segments consécutifs du même locuteur
  const mergedSegments: AudioSegment[] = [];
  for (const seg of segments) {
    if (mergedSegments.length === 0) {
      mergedSegments.push({ ...seg });
      continue;
    }
    const prev = mergedSegments[mergedSegments.length - 1];
    const sameVoice = (prev.voiceRefUrl && prev.voiceRefUrl === seg.voiceRefUrl) ||
                      (prev.voiceId && prev.voiceId === seg.voiceId) ||
                      (prev.speakerType === 'narrator' && seg.speakerType === 'narrator');

    if (sameVoice && (prev.text.length + seg.text.length < 1200)) {
      prev.text = `${prev.text}\n\n${seg.text}`;
    } else {
      mergedSegments.push({ ...seg });
    }
  }

  return mergedSegments;
};
