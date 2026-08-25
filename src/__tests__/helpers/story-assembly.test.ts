// @vitest-environment node
import { describe, it, expect } from "vitest";
import { 
  buildGuidedStoryPayload, 
  buildFastStoryPayload, 
  getVocabularyInstructions, 
  generateAdvancedStoryPrompt,
  selectVariation,
  AssemblyChild 
} from "../../../supabase/functions/_shared/story-assembly";

// Helper to create a mock chainable Supabase client
const createChain = (result: any) => {
  const chain: any = {
    select: () => chain,
    in: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: () => chain,
    then: (resolve: any) => Promise.resolve(result).then(resolve),
    catch: (reject: any) => Promise.resolve(result).catch(reject),
  };
  return chain;
};

const createMockSupabase = (recentStories: any[] = [], customTables: Record<string, any> = {}) => {
  return {
    from: (table: string) => {
      if (customTables[table]) {
        return createChain({ data: customTables[table], error: null });
      }
      if (table === "children") {
        return createChain({
          data: [
            {
              id: "child-1",
              name: "Léa",
              gender: "girl",
              birthdate: "2019-05-15",
              teddyname: "Teddy",
              teddydescription: "Un ours brun",
              imaginaryworld: "La forêt",
              pet_type: null,
              pet_type_custom: null,
            }
          ],
          error: null
        });
      }
      if (table === "users") {
        return createChain({ data: { email: "parent@example.com" }, error: null });
      }
      if (table === "v_active_prompt_templates") {
        return createChain({
          data: [
            { key: "story_prompt_sleep", active_content: "Raconte une histoire pour {{children_names}}. {{children_context}}" },
            { key: "story_prompt_fun", active_content: "Raconte une histoire drôle pour {{children_names}}." },
            { key: "fast_story_fear", active_content: "Raconte une histoire rapide de courage pour {{children_names}}." }
          ],
          error: null
        });
      }
      if (table === "stories") {
        return createChain({ data: recentStories, error: null });
      }
      if (table === "age_cognition") {
        return createChain({ data: [{ range: "4-6 ans", characteristics: "Maternelle", is_active: true }], error: null });
      }
      if (table === "narrative_schemas") {
        return createChain({
          data: [
            { type: "Cascade de Quiproquos", mechanism: "Malentendus comiques", objective_affinity: ["fun"], is_active: true },
            { type: "Linéaire", mechanism: "Progression douce", objective_affinity: ["sleep", "relax"], is_active: true },
          ],
          error: null
        });
      }
      if (table === "vakog_focus") {
        return createChain({
          data: [
            { sensory_type: "Auditif", sensory_keywords: ["éclats de rire"], objective_affinity: ["fun"], is_active: true },
            { sensory_type: "Visuel Apaisant", sensory_keywords: ["étoiles douces"], objective_affinity: ["sleep"], is_active: true },
          ],
          error: null
        });
      }
      if (table === "symbolic_universes") {
        return createChain({
          data: [
            { name: "L'Académie des Animaux Gaffeurs", description: "École drôle", visual_style: "Vif", objective_affinity: ["fun"], is_active: true },
            { name: "Bulle de protection", description: "Cocon", visual_style: "Pastel", objective_affinity: ["sleep"], is_active: true },
          ],
          error: null
        });
      }
      if (table === "ericksonian_techniques") {
        return createChain({
          data: [
            { name: "Recadrage par l'Absurde", linguistic_pattern: "Dégonfle la tension", objective_affinity: ["fun"], is_active: true },
            { name: "Saupoudrage", linguistic_pattern: "Mots doux", objective_affinity: ["sleep"], is_active: true },
          ],
          error: null
        });
      }
      return createChain({ data: [], error: null });
    }
  };
};

describe("Règles Linguistiques & Vocabulaire par Âge", () => {
  it("impose la règle des 3 onomatopées maximum pour tous les âges", () => {
    expect(getVocabularyInstructions(2)).toContain("Maximum 3 onomatopées");
    expect(getVocabularyInstructions(5)).toContain("Maximum 3 onomatopées");
    expect(getVocabularyInstructions(8)).toContain("Maximum 3 onomatopées");
    expect(getVocabularyInstructions(14)).toContain("Maximum 3 onomatopées");
  });

  it("impose la règle zéro métaphore superflue et la liste noire pour tous les âges", () => {
    const vocab = getVocabularyInstructions(5);
    expect(vocab).toContain("RÈGLE ZÉRO MÉTAPHORE SUPERFLUE");
    expect(vocab).toContain("LISTE NOIRE STRICTE");
    expect(vocab).toContain("irisé");
    expect(vocab).toContain("nacre");
    expect(vocab).toContain("offrande");
  });

  it("interdit formellement le vocabulaire abstrait ou littéraire pour les tout-petits (0-3 ans)", () => {
    const vocab = getVocabularyInstructions(2);
    expect(vocab).toContain("SYNTAXE TRÈS COURTE");
    expect(vocab).toContain("5 à 8 mots par phrase MAXIMUM");
    expect(vocab).toContain("STRUCTURE DIRECTE OBLIGATOIRE");
    expect(vocab).toContain("INTERDICTION ABSOLUE");
    expect(vocab).toContain("MOTS DU QUOTIDIEN CONCRET");
  });

  it("impose un vocabulaire simple et des verbes d'action pour la maternelle (4-6 ans)", () => {
    const vocab = getVocabularyInstructions(5);
    expect(vocab).toContain("SYNTAXE COURTE ET VIVANTE");
    expect(vocab).toContain("8 à 12 mots par phrase MAXIMUM");
    expect(vocab).toContain("STRUCTURE DIRECTE");
    expect(vocab).toContain("Verbes d'action concrets");
  });

  it("limite les mots complexes à 2-3 contextualisés pour le primaire (7-8 ans)", () => {
    const vocab = getVocabularyInstructions(7);
    expect(vocab).toContain("Maximum 2 à 3 mots enrichissants");
  });
});

describe("Modèle en 2 Temps & Objectifs Narratifs", () => {
  const sampleChildren: AssemblyChild[] = [
    {
      id: "c1",
      name: "Arthur",
      gender: "boy",
      birthDate: "2019-03-10",
      teddyName: "Gribouille",
      teddyDescription: "Un petit chien en peluche",
      imaginaryWorld: "L'espace des gâteaux",
      petType: null,
      petTypeCustom: null,
    }
  ];

  it("génère un prompt 'fun' avec cause à effet, action motrice et interdiction des métaphores poétiques", () => {
    const prompt = generateAdvancedStoryPrompt("fun", sampleChildren, "Le Grand Bazar de Gribouille");
    expect(prompt).toContain("MODÈLE NARRATIF EN 2 TEMPS");
    expect(prompt).toContain("DYNAMIQUE S'AMUSER (ÉNERGIE HAUTE & RIRE)");
    expect(prompt).toContain("TRAME NARRATIVE DE CAUSE À EFFET CONTINUE");
    expect(prompt).toContain("MINI-ENJEU CLAIR DÈS LE DÉPART");
    expect(prompt).toContain("ENFANTS ACTEURS & DÉCIDEURS");
    expect(prompt).toContain("INTERDICTION FORMELLE : Ne jamais utiliser de ton lénifiant");
    expect(prompt).toContain("Maximum 3 onomatopées");
    expect(prompt).toContain("TITRE SÉLECTIONNÉ : \"Le Grand Bazar de Gribouille\"");
  });

  it("génère un prompt 'focus' avec énigme claire dès le départ et déduction active", () => {
    const prompt = generateAdvancedStoryPrompt("focus", sampleChildren, "L'Énigme du Grenier");
    expect(prompt).toContain("DYNAMIQUE FOCUS");
    expect(prompt).toContain("énigme claire dès le départ");
    expect(prompt).toContain("Maximum 3 onomatopées");
  });

  it("génère un prompt 'sleep' avec descente hypnotique progressive vers le sommeil", () => {
    const prompt = generateAdvancedStoryPrompt("sleep", sampleChildren, "Le Voyage des Étoiles");
    expect(prompt).toContain("DYNAMIQUE SOMMEIL");
    expect(prompt).toContain("descente hypnotique progressive");
    expect(prompt).toContain("endormissement calme et réparateur");
  });
});

describe("Sélection des Ingrédients Narratifs (Affinité d'Objectif)", () => {
  it("filtre les schémas narratifs et le VAKOG selon l'affinité de l'objectif 'fun'", async () => {
    const mockSupabase = createMockSupabase();
    const variation = await selectVariation(mockSupabase, 6, "fun");

    expect(variation.narrativeSchema?.type).toBe("Cascade de Quiproquos");
    expect(variation.vakogFocus?.sensory_type).toBe("Auditif");
    expect(variation.symbolicUniverse?.name).toBe("L'Académie des Animaux Gaffeurs");
    expect(variation.ericksonianTechnique?.name).toBe("Recadrage par l'Absurde");
  });

  it("filtre les ingrédients selon l'affinité de l'objectif 'sleep'", async () => {
    const mockSupabase = createMockSupabase();
    const variation = await selectVariation(mockSupabase, 6, "sleep");

    expect(variation.narrativeSchema?.type).toBe("Linéaire");
    expect(variation.vakogFocus?.sensory_type).toBe("Visuel Apaisant");
    expect(variation.symbolicUniverse?.name).toBe("Bulle de protection");
    expect(variation.ericksonianTechnique?.name).toBe("Saupoudrage");
  });
});

describe("Dédoublonnage des histoires (Anti-Répétition Renforcé)", () => {
  describe("buildGuidedStoryPayload", () => {
    it("ajoute les interdictions strictes de réutiliser les tropes, décors et acolytes récents", async () => {
      const recentStories = [
        { title: "Le dragon rigolo", summary: "Un dragon qui fait des blagues dans la forêt magique." },
      ];
      const mockSupabase = createMockSupabase(recentStories);

      const payload = await buildGuidedStoryPayload(mockSupabase, {
        userId: "user-123",
        objective: "fun",
        childrenIds: ["child-1"],
        selectedTitle: "La Panique des Crêpes"
      });

      expect(payload.storyPrompt).toContain("⚠️ CONTEXTE CRITIQUE - ÉVITER LES RÉPÉTITIONS");
      expect(payload.storyPrompt).toContain("INTERDICTIONS STRICTES DE REDONDANCE");
      expect(payload.storyPrompt).toContain("Ne pas réutiliser le même type de décor principal");
      expect(payload.storyPrompt).toContain("Le dragon rigolo");
    });
  });

  describe("buildFastStoryPayload", () => {
    it("ajoute l'avertissement de répétition en mode histoire rapide", async () => {
      const recentStories = [
        { title: "L'ours grognon", summary: "Un ours fatigué qui apprenait à sourire." }
      ];
      const mockSupabase = createMockSupabase(recentStories);

      const payload = await buildFastStoryPayload(mockSupabase, {
        userId: "user-123",
        fastStoryPromptKey: "fast_story_fear",
        durationMinutes: 10
      });

      expect(payload.storyPrompt).toContain("⚠️ CONTEXTE CRITIQUE - ÉVITER LES RÉPÉTITIONS");
      expect(payload.storyPrompt).toContain("L'ours grognon");
    });
  });
});
