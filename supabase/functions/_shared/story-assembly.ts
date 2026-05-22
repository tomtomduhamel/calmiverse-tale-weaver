// Assemblage serveur du payload de génération d'histoire.
// SOURCE UNIQUE partagée entre la création manuelle (via assemble-story-payload)
// et la création automatique (routines, via due-story-routines).
// Porté fidèlement depuis le frontend (useN8nStoryFromTitle, useN8nFastStory,
// storyPromptUtils, promptVariables, useStoryVariation) pour garantir une qualité
// identique entre histoires manuelles et automatiques.

const READING_SPEED_WPM = 120;

export const estimateWordCountForDuration = (minutes: number): number => {
  const words = Math.round(minutes * READING_SPEED_WPM);
  return Math.min(Math.max(words, 400), 3000);
};

export function calculateAge(birthDate: string | Date): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export const replacePromptVariables = (
  template: string,
  variables: Record<string, string | number | undefined | null>,
): string => {
  if (!template) return "";
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, String(value));
    }
  });
  result = result.replace(/\{\{[^}]+\}\}/g, "");
  return result;
};

export const OBJECTIVE_DESCRIPTIONS: Record<string, string> = {
  sleep: "Aider à s'endormir de manière apaisante et régénératrice",
  focus: "Améliorer la concentration et l'attention",
  relax: "Favoriser la détente et la relaxation",
  fun: "S'amuser et passer un bon moment",
};

export const getVocabularyInstructions = (youngestAge: number): string => {
  if (youngestAge <= 3) {
    return "Utilise un vocabulaire très simple avec des mots familiers et quelques onomatopées.";
  } else if (youngestAge <= 5) {
    return "Utilise un vocabulaire simple et accessible. Évite les mots complexes.";
  } else if (youngestAge <= 7) {
    return "Utilise un vocabulaire adapté aux enfants d'âge scolaire. Introduis quelques mots nouveaux avec contexte.";
  } else {
    return "Utilise un vocabulaire plus riche et varié. Peux introduire des concepts plus complexes.";
  }
};

// --- Child mapping (DB row -> objet utilisé par l'assemblage) ---
export interface AssemblyChild {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  teddyName: string | null;
  teddyDescription: string | null;
  imaginaryWorld: string | null;
  petType: string | null;
  petTypeCustom: string | null;
}

export function mapChildRow(row: any): AssemblyChild {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    birthDate: row.birthdate,
    teddyName: row.teddyname ?? null,
    teddyDescription: row.teddydescription ?? null,
    imaginaryWorld: row.imaginaryworld ?? null,
    petType: row.pet_type ?? null,
    petTypeCustom: row.pet_type_custom ?? null,
  };
}

interface CharacterAnalysis {
  children: { child: AssemblyChild; age: number }[];
  pets: AssemblyChild[];
  youngestAge: number;
  oldestAge: number;
  averageAge: number;
}

export const analyzeCharacters = (children: AssemblyChild[]): CharacterAnalysis => {
  const childrenWithAges = children
    .filter((child) => child.gender !== "pet")
    .map((child) => ({ child, age: calculateAge(child.birthDate) }));

  const pets = children.filter((child) => child.gender === "pet");

  const ages = childrenWithAges.map((c) => c.age);
  const youngestAge = ages.length > 0 ? Math.min(...ages) : 0;
  const oldestAge = ages.length > 0 ? Math.max(...ages) : 0;
  const averageAge = ages.length > 0
    ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
    : 0;

  return { children: childrenWithAges, pets, youngestAge, oldestAge, averageAge };
};

export const generateCharacterContext = (analysis: CharacterAnalysis): string => {
  const { children, pets } = analysis;
  let context = "";

  if (children.length > 0) {
    context += "PERSONNAGES PRINCIPAUX :\n";
    children.forEach(({ child, age }) => {
      const genderLabel = child.gender === "boy" ? "garçon" : "fille";
      context += `- ${child.name} : ${genderLabel} de ${age} an${age > 1 ? "s" : ""}\n`;
    });
  }

  if (pets.length > 0) {
    context += "\nANIMAUX DE COMPAGNIE :\n";
    pets.forEach((pet) => {
      let petTypeLabel = "";
      if (pet.petType === "dog") petTypeLabel = "chien";
      else if (pet.petType === "cat") petTypeLabel = "chat";
      else if (pet.petType === "other" && pet.petTypeCustom) petTypeLabel = pet.petTypeCustom;
      else petTypeLabel = "animal de compagnie";

      context += `- ${pet.name} : ${petTypeLabel}`;
      if (pet.teddyDescription) context += ` (${pet.teddyDescription})`;
      context += "\n";
    });
  }

  return context;
};

const getVocabularyLevel = (youngestAge: number): string => {
  if (youngestAge <= 3) {
    return "Utilise un vocabulaire simple avec des mots familiers. Utilise quelques onomatopées, sans jamais en abuser pour ne pas rendre l'histoire difficile à lire et à comprendre.";
  } else if (youngestAge <= 5) {
    return "Utilise un vocabulaire simple et accessible. Évite les mots complexes.";
  } else if (youngestAge <= 7) {
    return "Utilise un vocabulaire adapté aux enfants d'âge scolaire. Introduis quelques mots nouveaux avec contexte.";
  } else {
    return "Utilise un vocabulaire plus riche et varié. Peux introduire des concepts plus complexes de manière adaptée aux enfants.";
  }
};

const generateGenderInstructions = (analysis: CharacterAnalysis): string => {
  const { children, pets } = analysis;
  const boys = children.filter((c) => c.child.gender === "boy");
  const girls = children.filter((c) => c.child.gender === "girl");
  let instructions = "";

  if (boys.length > 0 && girls.length === 0) {
    instructions += "- Intègre des éléments d'aventure, d'exploration et d'action adaptés aux garçons\n";
  } else if (girls.length > 0 && boys.length === 0) {
    instructions += "- Intègre des éléments créatifs, relationnels et émotionnels adaptés aux filles\n";
  } else if (boys.length > 0 && girls.length > 0) {
    instructions += "- Équilibre les éléments d'aventure et de créativité pour plaire aux garçons et aux filles\n";
    instructions += "- Favorise la coopération et l'amitié entre les personnages\n";
  }

  if (pets.length > 0) {
    instructions += "- Intègre les animaux de compagnie comme personnages importants avec leurs propres traits de caractère\n";
    instructions += "- Montre la relation spéciale entre les enfants et leurs animaux\n";
  }

  return instructions;
};

export const generateAdvancedStoryPrompt = (
  objective: string,
  children: AssemblyChild[],
  selectedTitle?: string,
  options?: { durationMinutes?: number; targetWordCount?: number },
): string => {
  const analysis = analyzeCharacters(children);
  const characterContext = generateCharacterContext(analysis);
  const vocabularyInstructions = getVocabularyLevel(analysis.youngestAge);
  const genderInstructions = generateGenderInstructions(analysis);

  const targetWords = options?.targetWordCount ??
    (options?.durationMinutes ? estimateWordCountForDuration(options.durationMinutes) : 1500);
  const startWords = Math.max(200, Math.round(targetWords * 0.25));
  const middleWords = Math.max(400, Math.round(targetWords * 0.5));
  const endWords = Math.max(200, Math.round(targetWords * 0.25));

  const allNames = [...analysis.children.map((c) => c.child.name), ...analysis.pets.map((p) => p.name)];
  const namesText = allNames.length === 1
    ? allNames[0]
    : `${allNames.slice(0, -1).join(", ")} et ${allNames[allNames.length - 1]}`;

  const objectivePrompts: Record<string, string> = {
    sleep: `Créer une histoire douce et apaisante pour aider ${namesText} à s'endormir. L'histoire doit être calme, réconfortante et se terminer de manière paisible. Utilisez un langage simple et des images relaxantes. L'histoire doit utiliser les techniques d'hypnose ericksonienne pour permettre un endormissement apaisé et régénérateur.`,
    focus: `Créer une histoire engageante qui aide ${namesText} à se concentrer. L'histoire doit captiver l'attention tout en étant éducative et stimulante intellectuellement. Intègre des défis et des mystères adaptés à leur âge.`,
    relax: `Créer une histoire relaxante pour aider ${namesText} à se détendre. L'histoire doit être apaisante, avec un rythme lent et des éléments qui favorisent la relaxation. Privilégie les paysages naturels et les moments de contemplation.`,
    fun: `Créer une histoire amusante et divertissante pour ${namesText}. L'histoire doit être joyeuse, pleine d'aventures et de moments ludiques qui feront sourire. Intègre de l'humour adapté à leur âge.`,
  };

  const basePrompt = objectivePrompts[objective] ||
    `Créer une histoire pour enfants personnalisée pour ${namesText} avec pour objectif: ${objective}.`;

  let titleInstruction = "";
  if (selectedTitle) {
    titleInstruction = `Le titre de l'histoire doit être : "${selectedTitle}". Assure-toi que l'histoire correspond bien à ce titre et développe le thème de manière créative et engageante.\n\n`;
  }

  const durationNote = options?.durationMinutes
    ? `- L'histoire doit pouvoir être lue en environ ${options.durationMinutes} minutes\n`
    : "";

  return `${basePrompt}

${titleInstruction}${characterContext}

ADAPTATION D'ÂGE ET VOCABULAIRE :
${vocabularyInstructions}
- Âge des enfants : de ${analysis.youngestAge} à ${analysis.oldestAge} ans (moyenne: ${analysis.averageAge} ans)
- Adapte la complexité narrative à l'âge le plus jeune pour que tous puissent suivre
- Si plusieurs âges, crée des niveaux de lecture multiples dans la même histoire

INSTRUCTIONS SPÉCIFIQUES AUX GENRES :
${genderInstructions}
- Évite tous stéréotypes de genre tout en respectant les préférences naturelles
- Valorise l'égalité et la complémentarité entre tous les personnages

INSTRUCTIONS POUR LA GÉNÉRATION :
- Personnaliser l'histoire avec tous les prénoms : ${namesText}
- Créer une histoire d'environ ${targetWords} mots décomposée ainsi : début (~${startWords} mots), développement (~${middleWords} mots), fin (~${endWords} mots)
- Structurer avec un début, un développement et une fin satisfaisante avec des sauts de lignes pour faciliter la lecture
- Inclure des éléments magiques ou imaginaires adaptés à l'enfance
- S'assurer que l'histoire respecte l'objectif: ${objective}
- Utiliser un ton bienveillant et positif sans utiliser trop de superlatifs
- Interdire tout contenu effrayant ou inapproprié
- Développer les relations entre les personnages selon leurs caractéristiques
${durationNote}
Générer maintenant l'histoire complète en français en respectant le nombre de mots demandés (environ ${targetWords} mots).`;
};

// --- Variation narrative (5 tables DB) ---
export interface StoryVariation {
  ageCognition: any | null;
  narrativeSchema: any | null;
  vakogFocus: any | null;
  symbolicUniverse: any | null;
  ericksonianTechnique: any | null;
}

const pickRandom = <T>(arr: T[]): T | null => {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

const findAgeCognition = (age: number, entries: any[]): any | null => {
  if (age <= 2) return entries.find((e) => e.range === "0-2 ans") || null;
  if (age <= 4) return entries.find((e) => e.range === "2-4 ans") || null;
  if (age <= 6) return entries.find((e) => e.range === "4-6 ans") || null;
  if (age <= 12) return entries.find((e) => e.range === "8-12 ans") || null;
  return entries.find((e) => e.range === "13+ ans") || null;
};

export async function selectVariation(
  supabase: any,
  youngestAge: number,
  objective?: string,
): Promise<StoryVariation> {
  const [ageRes, narrativeRes, vakogRes, symbolicRes, ericksonianRes] = await Promise.all([
    supabase.from("age_cognition").select("*").eq("is_active", true),
    supabase.from("narrative_schemas").select("*").eq("is_active", true),
    supabase.from("vakog_focus").select("*").eq("is_active", true),
    supabase.from("symbolic_universes").select("*").eq("is_active", true),
    supabase.from("ericksonian_techniques").select("*").eq("is_active", true),
  ]);

  const ageCognitions = ageRes.data || [];
  const narrativeSchemas = narrativeRes.data || [];
  const vakogFocuses = vakogRes.data || [];
  let symbolicUniverses = symbolicRes.data || [];
  let ericksonianTechniques = ericksonianRes.data || [];

  const ageCognition = findAgeCognition(youngestAge, ageCognitions);
  const narrativeSchema = pickRandom(narrativeSchemas);
  const vakogFocus = pickRandom(vakogFocuses);

  if (objective) {
    const matchedU = symbolicUniverses.filter((u: any) => (u.objective_affinity || []).includes(objective));
    if (matchedU.length > 0) symbolicUniverses = matchedU;
  }
  const symbolicUniverse = pickRandom(symbolicUniverses);

  if (objective) {
    const matchedT = ericksonianTechniques.filter((t: any) => (t.objective_affinity || []).includes(objective));
    if (matchedT.length > 0) ericksonianTechniques = matchedT;
  }
  const ericksonianTechnique = pickRandom(ericksonianTechniques);

  return { ageCognition, narrativeSchema, vakogFocus, symbolicUniverse, ericksonianTechnique };
}

// --- Prompts actifs ---
export async function fetchActivePrompts(supabase: any): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("v_active_prompt_templates")
    .select("key, active_content");
  const prompts: Record<string, string> = {};
  if (error || !data) return prompts;
  for (const row of data) {
    if (row.key && row.active_content) prompts[row.key] = row.active_content;
  }
  return prompts;
}

async function fetchUserEmail(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase.from("users").select("email").eq("id", userId).maybeSingle();
  return data?.email ?? null;
}

async function fetchChildren(supabase: any, childrenIds: string[], userId: string): Promise<AssemblyChild[]> {
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .in("id", childrenIds)
    .eq("authorid", userId);
  if (error || !data) return [];
  // Respecter l'ordre demandé
  const byId: Record<string, any> = {};
  for (const row of data) byId[row.id] = row;
  return childrenIds.filter((id) => byId[id]).map((id) => mapChildRow(byId[id]));
}

const buildNamesText = (analysis: CharacterAnalysis): string => {
  const allNames = [...analysis.children.map((c) => c.child.name), ...analysis.pets.map((p) => p.name)];
  return allNames.length === 1
    ? allNames[0]
    : `${allNames.slice(0, -1).join(", ")} et ${allNames[allNames.length - 1]}`;
};

function buildStoryPromptFromTemplate(
  template: string | undefined,
  params: { objective: string; selectedTitle: string; durationMinutes?: number },
  children: AssemblyChild[],
  targetWordCount: number | undefined,
  variation: StoryVariation,
): string {
  if (!template) {
    return generateAdvancedStoryPrompt(
      params.objective,
      children,
      params.selectedTitle,
      { durationMinutes: params.durationMinutes, targetWordCount },
    );
  }

  const analysis = analyzeCharacters(children);
  const characterContext = generateCharacterContext(analysis);
  const namesText = buildNamesText(analysis);

  const variables: Record<string, string | number | undefined> = {
    children_names: namesText,
    children_context: characterContext,
    objective: params.objective,
    objective_description: OBJECTIVE_DESCRIPTIONS[params.objective] || params.objective,
    vocabulary_level: getVocabularyInstructions(analysis.youngestAge),
    target_word_count: targetWordCount?.toString() || "1500",
    selected_title: params.selectedTitle,
    duration_minutes: params.durationMinutes?.toString() || "",
    youngest_age: analysis.youngestAge.toString(),
    oldest_age: analysis.oldestAge.toString(),
    average_age: analysis.averageAge.toString(),
    narrative_schema: variation.narrativeSchema?.type || "",
    narrative_mechanism: variation.narrativeSchema?.mechanism || "",
    vakog_focus: variation.vakogFocus?.sensory_type || "",
    vakog_keywords: (variation.vakogFocus?.sensory_keywords || []).join(", "),
    symbolic_universe: variation.symbolicUniverse?.name || "",
    symbolic_description: variation.symbolicUniverse?.description || "",
    symbolic_visual_style: variation.symbolicUniverse?.visual_style || "",
    ericksonian_technique: variation.ericksonianTechnique?.name || "",
    ericksonian_pattern: variation.ericksonianTechnique?.linguistic_pattern || "",
    age_characteristics: variation.ageCognition?.characteristics || "",
    age_preferred_supports: (variation.ageCognition?.preferred_supports || []).join(", "),
  };

  return replacePromptVariables(template, variables);
}

export interface GuidedParams {
  userId: string;
  objective: string;
  childrenIds: string[];
  selectedTitle: string;
  durationMinutes?: number | null;
  generateVideo?: boolean;
  titleGenerationCost?: any | null;
}

export async function buildGuidedStoryPayload(supabase: any, params: GuidedParams): Promise<any> {
  const children = await fetchChildren(supabase, params.childrenIds, params.userId);
  if (children.length === 0) {
    throw new Error("Aucun enfant trouvé pour cette routine/création");
  }

  const userEmail = await fetchUserEmail(supabase, params.userId);
  const prompts = await fetchActivePrompts(supabase);

  const childrenNames = children.map((c) => c.name);
  const childrenGenders = children.map((c) => c.gender);

  const enrichedChildrenData = children.map((child) => ({
    id: child.id,
    name: child.name,
    gender: child.gender,
    age: calculateAge(child.birthDate),
    teddyName: child.teddyName,
    teddyDescription: child.teddyDescription,
    imaginaryWorld: child.imaginaryWorld,
    petType: child.petType,
    petTypeCustom: child.petTypeCustom,
  }));

  const durationMinutes = params.durationMinutes ?? null;
  const targetWordCount = durationMinutes ? estimateWordCountForDuration(durationMinutes) : undefined;

  const analysis = analyzeCharacters(children);
  const variation = await selectVariation(supabase, analysis.youngestAge, params.objective);

  const promptKey = `story_prompt_${params.objective}`;
  const storyPromptTemplate = prompts[promptKey];

  const storyPrompt = buildStoryPromptFromTemplate(
    storyPromptTemplate,
    { objective: params.objective, selectedTitle: params.selectedTitle, durationMinutes: durationMinutes ?? undefined },
    children,
    targetWordCount,
    variation,
  );

  const promptSource = storyPromptTemplate ? `database-${params.objective}` : "fallback";

  return {
    action: "create_story_from_title",
    selectedTitle: params.selectedTitle,
    objective: params.objective,
    childrenIds: params.childrenIds,
    childrenNames,
    childrenGenders,
    childrenData: enrichedChildrenData,
    durationMinutes,
    targetWordCount: targetWordCount ?? undefined,
    userId: params.userId,
    userEmail,
    storyPrompt,
    imageGenerationPrompt: prompts.image_generation_prompt || null,
    videoGenerationPrompt: prompts.video_generation_prompt || null,
    promptSource,
    narrativeVariation: {
      schema: variation.narrativeSchema?.type || null,
      vakog: variation.vakogFocus?.sensory_type || null,
      universe: variation.symbolicUniverse?.name || null,
      technique: variation.ericksonianTechnique?.name || null,
      ageCognition: variation.ageCognition?.range || null,
    },
    titleGenerationCost: params.titleGenerationCost || null,
    generateVideo: params.generateVideo ?? false,
    timestamp: new Date().toISOString(),
    requestId: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}

// Libellés des thèmes "histoire rapide" (promptKey -> label) pour narrativeVariation.theme
export const FAST_STORY_LABELS: Record<string, string> = {
  fast_story_fear: "peur",
  fast_story_anxiety: "anxiété",
  fast_story_anger: "colère",
  fast_story_sadness: "tristesse",
  fast_story_stress: "stress",
  fast_story_agitation: "agitation",
  fast_story_guilt: "culpabilité",
  fast_story_pain: "douleur",
  fast_story_confidence: "confiance en soi",
  fast_story_serenity: "sérénité",
  fast_story_joy: "joie",
  fast_story_courage: "courage",
  fast_story_curiosity: "curiosité",
  fast_story_empathy: "empathie",
  fast_story_pride: "fierté",
  fast_story_focus_skill: "concentration",
  fast_story_creativity: "créativité",
  fast_story_autonomy: "autonomie",
  fast_story_situation_dark: "le coucher",
  fast_story_situation_school: "l'école",
  fast_story_situation_separation: "séparation",
  fast_story_situation_grief: "perte et deuil",
  fast_story_situation_conflict: "conflit et dispute",
  fast_story_situation_bedwetting: "énurésie",
  fast_story_situation_medical: "soins médicaux",
  fast_story_situation_screens: "addiction aux écrans",
};

export interface FastParams {
  userId: string;
  fastStoryPromptKey: string;
  durationMinutes: number;
  generateVideo?: boolean;
}

export async function buildFastStoryPayload(supabase: any, params: FastParams): Promise<any> {
  const userEmail = await fetchUserEmail(supabase, params.userId);
  const prompts = await fetchActivePrompts(supabase);

  const targetWordCount = estimateWordCountForDuration(params.durationMinutes);

  // Le frontend utilise un âge moyen de 6 ans pour la sélection narrative (pas d'enfant ciblé)
  const variation = await selectVariation(supabase, 6, params.fastStoryPromptKey);

  const storyPromptRaw = prompts[params.fastStoryPromptKey];
  const storyPrompt = storyPromptRaw
    ? replacePromptVariables(storyPromptRaw, {
      target_word_count: targetWordCount?.toString() || "1500",
      duration_minutes: params.durationMinutes.toString(),
      narrative_schema: variation.narrativeSchema?.type || "",
      narrative_mechanism: variation.narrativeSchema?.mechanism || "",
      vakog_focus: variation.vakogFocus?.sensory_type || "",
      vakog_keywords: (variation.vakogFocus?.sensory_keywords || []).join(", "),
      symbolic_universe: variation.symbolicUniverse?.name || "",
      symbolic_description: variation.symbolicUniverse?.description || "",
      symbolic_visual_style: variation.symbolicUniverse?.visual_style || "",
      ericksonian_technique: variation.ericksonianTechnique?.name || "",
      ericksonian_pattern: variation.ericksonianTechnique?.linguistic_pattern || "",
    })
    : `Génère une histoire courte (${targetWordCount} mots) pour un enfant d'environ 6 ans, avec un protagoniste surprise adapté au thème : ${params.fastStoryPromptKey}.`;

  return {
    action: "create_fast_story",
    is_fast_story: true,
    fast_story_prompt_key: params.fastStoryPromptKey,
    objective: "custom",
    durationMinutes: params.durationMinutes,
    targetWordCount,
    userId: params.userId,
    userEmail,
    storyPrompt,
    imageGenerationPrompt: prompts.image_generation_prompt || null,
    videoGenerationPrompt: params.generateVideo ? (prompts.video_generation_prompt || null) : null,
    generateVideo: params.generateVideo ?? false,
    narrativeVariation: {
      schema: variation.narrativeSchema?.type || null,
      vakog: variation.vakogFocus?.sensory_type || null,
      universe: variation.symbolicUniverse?.name || null,
      technique: variation.ericksonianTechnique?.name || null,
      theme: FAST_STORY_LABELS[params.fastStoryPromptKey] || null,
    },
    timestamp: new Date().toISOString(),
    requestId: `fast-story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}
