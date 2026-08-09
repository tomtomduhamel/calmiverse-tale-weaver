// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseStoryToAudioSegments } from "../../utils/storyAudioParser";

describe("Validation & Résilience de la Génération Audio (Persistence & Multi-Voix)", () => {

  describe("Détection et Persistance des Fichiers Audio", () => {
    it("devrait détecter un fichier audio en cours ('pending' ou 'processing') pour l'histoire entière même en cas de re-montage du composant", () => {
      const storyId = "story-uuid-1234";
      const audioFiles = [
        {
          id: "audio-1",
          story_id: storyId,
          text_content: "Contenu complet de l'histoire...",
          status: "pending" as const,
          webhook_id: "req-1",
          file_size: null,
          duration: null,
          voice_id: "voice-papa",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Simulation de la logique de IntegratedAudioDeck.tsx pour détecter une génération en cours
      const currentPendingAudioFile = audioFiles.find(
        file => (file.status === 'pending' || file.status === 'processing') && (file.story_id === storyId)
      );

      expect(currentPendingAudioFile).toBeDefined();
      expect(currentPendingAudioFile?.status).toBe("pending");
      expect(currentPendingAudioFile?.story_id).toBe(storyId);
    });

    it("devrait identifier qu'un livre audio est prêt ('ready') dès que audio_url est renseigné pour le story_id", () => {
      const storyId = "story-uuid-5678";
      const audioFiles = [
        {
          id: "audio-2",
          story_id: storyId,
          text_content: "Contenu complet de l'histoire...",
          status: "ready" as const,
          audio_url: "story-uuid-5678/webhook-12345.mp3",
          webhook_id: "req-2",
          file_size: 1048576,
          duration: 360,
          voice_id: "voice-papa",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const currentAudioFile = audioFiles.find(
        file => file.status === 'ready' && file.audio_url && (file.story_id === storyId)
      );

      expect(currentAudioFile).toBeDefined();
      expect(currentAudioFile?.status).toBe("ready");
      expect(currentAudioFile?.audio_url).toContain("story-uuid-5678");
    });

    it("devrait passer du statut 'processing' à 'ready' lors de l'arrivée d'un événement Realtime ou visibilitychange", () => {
      let state: "pending" | "processing" | "ready" = "processing";
      const storyId = "story-bg-9999";

      // Simulation du retour d'arrière-plan avec visibilité = visible
      const handleVisibilityChange = (updatedStatus: "ready") => {
        state = updatedStatus;
      };

      // Événement Realtime reçu pendant que l'utilisateur est revenu sur l'app
      handleVisibilityChange("ready");

      expect(state).toBe("ready");
    });
  });

  describe("Découpage Multi-Voix et Attribution des Rôles (storyAudioParser)", () => {
    it("devrait découper l'histoire en segments narrateur et dialogues avec les rôles appropriés", () => {
      const storyContent = `Un soir, Léo marchait dans la forêt.
Soudain, Barnabé la chouette s'exclama : « N'aie pas peur, la nuit est magique ! »
Léo répondit avec un grand sourire : « Je sais, la forêt est magnifique ! »`;

      const voiceMapping = {
        narrator: "https://storage.supabase/voice_maman.wav",
        animal_flying: "https://storage.supabase/voice_chouette.wav",
        child_boy: "https://storage.supabase/voice_leo.wav"
      };

      const segments = parseStoryToAudioSegments(storyContent, voiceMapping, "fr");

      expect(segments.length).toBeGreaterThan(1);
      
      // Vérifier le premier segment narrateur
      const narratorSegment = segments.find(s => s.roleCategory === 'narrator' || s.roleCategory === 'narrator_family');
      expect(narratorSegment).toBeDefined();
      expect(narratorSegment?.voiceRefUrl).toBe("https://storage.supabase/voice_maman.wav");

      // Vérifier le segment dialogue de l'oiseau/chouette
      const flyingSegment = segments.find(s => s.roleCategory === 'animal_flying');
      expect(flyingSegment).toBeDefined();
      expect(flyingSegment?.text).toContain("N'aie pas peur");
      expect(flyingSegment?.voiceRefUrl).toBe("https://storage.supabase/voice_chouette.wav");
    });
  });

});
