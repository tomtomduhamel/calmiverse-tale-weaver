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
  focus: "Améliorer la concentration, la curiosité et l'esprit de déduction",
  relax: "Favoriser la détente, la sérénité et le lâcher-prise",
  fun: "S'amuser, rire et passer un moment plein d'énergie joyeuse",
};

export const getVocabularyInstructions = (youngestAge: number): string => {
  const onomatopoeiaRule = "- RÈGLE DES ONOMATOPÉES : Maximum 3 onomatopées dans TOUTE l'histoire (ex: Hop !, Plouf !, Chut...).";
  const metaphorRule = "- RÈGLE ZÉRO MÉTAPHORE SUPERFLUE : Maximum 1 à 2 comparaisons physiques simples dans toute l'histoire (ex: 'un ballon gros comme une pastèque'). INTERDICTION FORMELLE des comparaisons poétiques lentes ('comme du miel', 'comme une onde', 'comme une offrande', 'comme un pli dans le ciel'). Raconter l'action avec des verbes directs et vivants.";
  const blacklistRule = "- LISTE NOIRE STRICTE (MOTS PROSCRITS) : Ne JAMAIS utiliser les mots suivants : 'irisé', 'nacre', 'nacré', 'diaphane', 'béatitude', 'onde', 'offrande', 'cérémonieux', 'cérémonieuse', 'murmure machinal', 'alcôve', 'zéphyr', 'lueur feutrée', 'contemplation', 'indicible'.";

  if (youngestAge <= 3) {
    return `- VOCABULAIRE TOUT-PETITS (0-3 ans) : Phrases très courtes (Sujet + Verbe + Complément). Mots simples et concrets du quotidien direct (doudou, chat, pomme, bain, dodo, ballon). Interdiction totale du vocabulaire abstrait ou littéraire.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else if (youngestAge <= 5) {
    return `- VOCABULAIRE MATERNELLE (4-6 ans) : Vocabulaire simple, vivant, concret et chaleureux. Verbes d'action directs (courir, grimper, cacher, rire, attraper). Aucun terme pompeux ou complexe.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else if (youngestAge <= 7) {
    return `- VOCABULAIRE PRIMAIRE (7-8 ans) : Vocabulaire adapté à l'école primaire. Maximum 2 à 3 mots enrichissants immédiatement compréhensibles en contexte. Syntaxe claire et vivante.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else if (youngestAge <= 12) {
    return `- VOCABULAIRE JUNIOR (8-12 ans) : Vocabulaire riche mais fluide et accessible. Dialogues rythmés, esprit vif, sans tournures artificiellement vieillottes.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else {
    return `- VOCABULAIRE ADO (13+ ans) : Vocabulaire précis et dynamique. Dialogues modernes avec autodérision bienveillante et maturité, sans infantilisation.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
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
    context += "PERSONNAGES PRINCIPAUX (HÉROS ACTIFS DU RÉCIT) :\n";
    children.forEach(({ child, age }) => {
      const genderLabel = child.gender === "boy" ? "garçon" : "fille";
      context += `- ${child.name} : ${genderLabel} de ${age} an${age > 1 ? "s" : ""}\n`;
    });
  }

  if (pets.length > 0) {
    context += "\nANIMAUX DE COMPAGNIE (COMPLICES ACTIFS) :\n";
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
  const vocabularyInstructions = getVocabularyInstructions(analysis.youngestAge);
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

  const comedyByAge = analysis.youngestAge <= 3
    ? "Comique visuel et physique simple, animaux maladroits, petits coucous-cachés."
    : analysis.youngestAge <= 6
    ? "Quiproquos loufoques, bêtises innocentes, doudou gaffeur, inversion des rôles où l'enfant guide l'adulte/l'animal."
    : analysis.youngestAge <= 10
    ? "Aventures rythmées, chasses aux trésors déjantées, comique de répétition et chutes inattendues."
    : "Dialogues piquants, ironie bienveillante, autodérision et situations absurdes.";

  const objectivePrompts: Record<string, string> = {
    sleep: `Créer une histoire douce, enveloppante et progressive pour accompagner paisiblement ${namesText} vers le sommeil.
DYNAMIQUE SOMMEIL : Utiliser les techniques de descente hypnotique progressive (ralentissement progressif du rythme, métaphores de cocon moelleux et paupières agréablement lourdes). L'histoire s'achève sur un endormissement calme et réparateur.`,
    focus: `Créer une histoire stimulante et palpitante qui entraîne la concentration et l'observation de ${namesText}.
DYNAMIQUE FOCUS : Intègre une énigme claire dès le départ, des indices visuels concrets à repérer, et un suspense haletant où les enfants déduisent la solution. Ton alerte, clair et passionnant.`,
    relax: `Créer une histoire apaisante et bienveillante pour offrir un moment de détente et de sérénité à ${namesText}.
DYNAMIQUE DÉTENTE : Contemplation douce, paysages chaleureux et respiration agréable sans obligation de s'endormir.`,
    fun: `Créer une histoire très drôle, dynamique et joyeuse pour ${namesText}.
DYNAMIQUE S'AMUSER (ÉNERGIE HAUTE & RIRE) :
- L'histoire doit faire rire, donner de l'énergie et mettre le sourire aux lèvres !
- RESSORT COMIQUE ADAPTÉ À L'ÂGE : ${comedyByAge}
- INTERDICTION FORMELLE : Ne jamais utiliser de ton lénifiant, de lenteur monotone, de métaphores poétiques ou d'invitation au sommeil. L'histoire doit être vivante, concrète et pétillante.`,
  };

  const basePrompt = objectivePrompts[objective] ||
    `Créer une histoire pour enfants personnalisée pour ${namesText} avec pour objectif: ${objective}.`;

  let titleInstruction = "";
  if (selectedTitle) {
    titleInstruction = `TITRE SÉLECTIONNÉ : "${selectedTitle}". Développe une intrigue surprenante et dynamique autour de ce titre.\n\n`;
  }

  const durationNote = options?.durationMinutes
    ? `- L'histoire doit pouvoir être lue en environ ${options.durationMinutes} minutes\n`
    : "";

  return `MODÈLE NARRATIF EN 2 TEMPS :
1. Temps 1 (Accroche sensorielle - 30-45s) : Capte immédiatement l'attention par un détail sensoriel curieux, un bruit rigolo ou une surprise pour déconnecter des pensées parasites et ancrer ${namesText} dans le moment présent.
2. Temps 2 (Trame Narrative de Cause à Effet à 100%) : Déploie une intrigue continue et vivante.

${basePrompt}

${titleInstruction}${characterContext}

TRAME NARRATIVE DE CAUSE À EFFET CONTINUE (INDISPENSABLE POUR LA CAPTATION) :
- 1. MINI-ENJEU CLAIR DÈS LE DÉPART : Pose un défi ou problème tangible dès la première minute (ex: objet en fuite, compte à rebours, bêtise à réparer avant un événement).
- 2. ENFANTS ACTEURS & DÉCIDEURS : ${namesText} prennent les initiatives, élaborent les ruses et résolvent le problème. Ils ne sont jamais spectateurs passifs.
- 3. RÈGLE DU "ET DONC... / MAIS ALORS..." : Chaque action des enfants doit provoquer un rebondissement ou une surprise qui mène à la scène suivante. Pas de déambulation descriptive statique.
- 4. DIALOGUES VIVANTS : Insérer de vraies répliques spontanées d'enfants.

CALIBRAGE DU VOCABULAIRE & RÈGLE DU CONCRET :
${vocabularyInstructions}
- Âge des enfants : de ${analysis.youngestAge} à ${analysis.oldestAge} ans (moyenne: ${analysis.averageAge} ans)
- INTERDICTION FORMELLE DES TICS HYPNOTIQUES PASSIFS : Si l'objectif n'est pas le sommeil, proscrire les phrases du type 'en laissant leurs épaules s'abaisser', 'peut-être en inspirant', 'le monde s'apaise comme une respiration lente'.

STRUCTURE NARRATIVE (~${targetWords} mots) :
- Début (~${startWords} mots) : Accroche immédiate et découverte du défi/problème.
- Péripéties (~${middleWords} mots) : Actions rythmées de cause à effet, dialogues vivants et progression de l'objectif.
- Dénouement (~${endWords} mots) : Résolution satisfaisante par les enfants (rire et énergie pour fun, énigme résolue pour focus, élan d'action/fierté pour les émotions de jour, sommeil paisible uniquement pour sleep).
- Structure avec des sauts de lignes pour faciliter la lecture à voix haute.
- Interdire tout contenu effrayant ou angoissant.
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
  let narrativeSchemas = narrativeRes.data || [];
  let vakogFocuses = vakogRes.data || [];
  let symbolicUniverses = symbolicRes.data || [];
  let ericksonianTechniques = ericksonianRes.data || [];

  const ageCognition = findAgeCognition(youngestAge, ageCognitions);

  if (objective) {
    const matchedSchemas = narrativeSchemas.filter((s: any) => (s.objective_affinity || []).includes(objective));
    if (matchedSchemas.length > 0) narrativeSchemas = matchedSchemas;

    const matchedVakog = vakogFocuses.filter((v: any) => (v.objective_affinity || []).includes(objective));
    if (matchedVakog.length > 0) vakogFocuses = matchedVakog;

    const matchedU = symbolicUniverses.filter((u: any) => (u.objective_affinity || []).includes(objective));
    if (matchedU.length > 0) symbolicUniverses = matchedU;

    const matchedT = ericksonianTechniques.filter((t: any) => (t.objective_affinity || []).includes(objective));
    if (matchedT.length > 0) ericksonianTechniques = matchedT;
  }

  const narrativeSchema = pickRandom(narrativeSchemas);
  const vakogFocus = pickRandom(vakogFocuses);
  const symbolicUniverse = pickRandom(symbolicUniverses);
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

  // Récupérer les dernières histoires pour éviter les répétitions
  const { data: recentStories } = await supabase
    .from("stories")
    .select("title, summary")
    .eq("authorid", params.userId)
    .eq("status", "completed")
    .order("createdat", { ascending: false })
    .limit(5);

  let storyPrompt = buildStoryPromptFromTemplate(
    storyPromptTemplate,
    { objective: params.objective, selectedTitle: params.selectedTitle, durationMinutes: durationMinutes ?? undefined },
    children,
    targetWordCount,
    variation,
  );

  if (recentStories && recentStories.length > 0) {
    const historyList = recentStories
      .map((s: any, idx: number) => `- "${s.title}" : ${s.summary || "Pas de résumé."}`)
      .join("\n");
    storyPrompt += `\n\n⚠️ CONTEXTE CRITIQUE - ÉVITER LES RÉPÉTITIONS :
Voici les titres et résumés des dernières histoires générées pour cet utilisateur. Tu dois ABSOLUMENT créer un scénario, des rebondissements, des personnages secondaires et un univers narratif différents de ceux-ci.
INTERDICTIONS STRICTES DE REDONDANCE :
- Ne pas réutiliser le même type de décor principal (ex: si la forêt a été utilisée, choisir un atelier miniature, un milieu urbain insolite, une cuisine féerique, des fonds marins, etc.).
- Ne pas réutiliser le même type d'animal-compagnon ou le même mentor.
- Varier le moteur de l'intrigue et les ressorts comiques/d'aventure.
Historique récent :
${historyList}`;
  }

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

  // Récupérer les dernières histoires pour éviter les répétitions
  const { data: recentStories } = await supabase
    .from("stories")
    .select("title, summary")
    .eq("authorid", params.userId)
    .eq("status", "completed")
    .order("createdat", { ascending: false })
    .limit(5);

  let storyPrompt = storyPromptRaw
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

  if (recentStories && recentStories.length > 0) {
    const historyList = recentStories
      .map((s: any, idx: number) => `- "${s.title}" : ${s.summary || "Pas de résumé."}`)
      .join("\n");
    storyPrompt += `\n\n⚠️ CONTEXTE CRITIQUE - ÉVITER LES RÉPÉTITIONS :
Voici les titres et résumés des dernières histoires générées pour cet utilisateur. Tu dois ABSOLUMENT créer un scénario, des rebondissements, des personnages secondaires et un univers narratif différents de ceux-ci.
INTERDICTIONS STRICTES DE REDONDANCE :
- Varier le décor principal, les acolytes et le type de résolution.
Historique récent :
${historyList}`;
  }

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
