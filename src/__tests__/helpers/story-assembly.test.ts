// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildGuidedStoryPayload, buildFastStoryPayload } from "../../../supabase/functions/_shared/story-assembly";

// A helper to create a mock chainable Supabase client
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

const createMockSupabase = (recentStories: any[] = []) => {
  return {
    from: (table: string) => {
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
            { key: "fast_story_fear", active_content: "Raconte une histoire rapide de courage pour {{children_names}}." }
          ],
          error: null
        });
      }
      if (table === "stories") {
        return createChain({ data: recentStories, error: null });
      }
      return createChain({ data: [], error: null });
    }
  };
};

describe("Dédoublonnage des histoires (Anti-Répétition)", () => {
  describe("buildGuidedStoryPayload", () => {
    it("devrait ajouter l'avertissement de répétition avec les résumés des histoires passées", async () => {
      const recentStories = [
        { title: "Le dragon rigolo", summary: "Un dragon qui fait des blagues." },
        { title: "Le singe astronaute", summary: "Un singe qui va sur la lune." }
      ];
      const mockSupabase = createMockSupabase(recentStories);

      const payload = await buildGuidedStoryPayload(mockSupabase, {
        userId: "user-123",
        objective: "sleep",
        childrenIds: ["child-1"],
        selectedTitle: "Une nuit paisible"
      });

      expect(payload.storyPrompt).toContain("⚠️ CONTEXTE CRITIQUE - ÉVITER LES RÉPÉTITIONS");
      expect(payload.storyPrompt).toContain("Le dragon rigolo");
      expect(payload.storyPrompt).toContain("Un singe qui va sur la lune.");
    });

    it("ne devrait pas ajouter de section anti-répétition si l'utilisateur n'a pas d'histoires passées", async () => {
      const mockSupabase = createMockSupabase([]);

      const payload = await buildGuidedStoryPayload(mockSupabase, {
        userId: "user-123",
        objective: "sleep",
        childrenIds: ["child-1"],
        selectedTitle: "Une nuit paisible"
      });

      expect(payload.storyPrompt).not.toContain("⚠️ CONTEXTE CRITIQUE - ÉVITER LES RÉPÉTITIONS");
    });
  });

  describe("buildFastStoryPayload", () => {
    it("devrait ajouter l'avertissement de répétition en mode histoire rapide", async () => {
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
      expect(payload.storyPrompt).toContain("Un ours fatigué qui apprenait à sourire.");
    });
  });
});
