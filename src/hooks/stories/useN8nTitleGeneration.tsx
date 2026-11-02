import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoryNotifications } from '@/hooks/stories/useStoryNotifications';
import { getErrorMessage } from '@/utils/retryUtils';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from "@/integrations/supabase/client";

export interface TitleGenerationData {
  objective: string;
  childrenIds: string[];
  childrenNames: string[];
  childrenGenders: string[];
}

export interface GeneratedTitle {
  id: string;
  title: string;
  description?: string;
}

// Interface pour les données de coût de génération des titres
export interface TitleCostData {
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  details_par_noeud?: Array<{
    nodeName: string;
    model_llm?: string;
    cost_total_usd: number;
    input_tokens?: number;
    output_tokens?: number;
  }>;
  timestamp: string;
}

export const useN8nTitleGeneration = (
  persistedTitles?: GeneratedTitle[],
  onTitlesGenerated?: (titles: GeneratedTitle[], costData?: TitleCostData) => void,
  persistedRegenerationUsed?: boolean,
  onRegenerationUsed?: () => void
) => {
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const { toast } = useToast();
  const { notifyTitlesGenerated, notifyStoryError } = useStoryNotifications();
  const { user } = useSupabaseAuth();

  // Utiliser l'état de regénération persisté ou local
  const regenerationUsed = persistedRegenerationUsed ?? false;

  // Utiliser les titres persistés comme source de vérité
  const generatedTitles = persistedTitles || [];

  const parseN8nTitlesResponse = (rawResult: any): GeneratedTitle[] => {
    console.log('[N8nTitleGeneration] Structure brute de la réponse:', JSON.stringify(rawResult, null, 2));

    let result = rawResult;

    // CORRECTION CRITIQUE: Gérer le format array de n8n
    if (Array.isArray(rawResult)) {
      console.log('[N8nTitleGeneration] Détection format array - extraction du premier élément');
      result = rawResult[0];
      if (!result) {
        console.error('[N8nTitleGeneration] Array vide reçu de n8n');
        return [];
      }
    }

    console.log('[N8nTitleGeneration] Result après extraction array:', JSON.stringify(result, null, 2));

    let titles: GeneratedTitle[] = [];

    // Format 1: result.output.title_1/title_2/title_3 ou "title 1"/"title 2"/"title 3"
    if (result.output) {
      console.log('[N8nTitleGeneration] Détection du format output:', result.output);

      const outputTitles = [];
      for (let i = 1; i <= 3; i++) {
        // Essayer les différentes variantes de clés
        const titleKeyUnderscore = `title_${i}`;
        const titleKeySpace = `title ${i}`;

        if (result.output[titleKeyUnderscore]) {
          outputTitles.push(result.output[titleKeyUnderscore]);
          console.log(`[N8nTitleGeneration] Trouvé ${titleKeyUnderscore}:`, result.output[titleKeyUnderscore]);
        } else if (result.output[titleKeySpace]) {
          outputTitles.push(result.output[titleKeySpace]);
          console.log(`[N8nTitleGeneration] Trouvé ${titleKeySpace}:`, result.output[titleKeySpace]);
        } else {
          console.warn(`[N8nTitleGeneration] Titre ${i} non trouvé avec les clés ${titleKeyUnderscore} ou ${titleKeySpace}`);
        }
      }

      if (outputTitles.length > 0) {
        console.log('[N8nTitleGeneration] Titres extraits du format output:', outputTitles);
        titles = outputTitles.map((title, index) => ({
          id: `title-${index + 1}-${Date.now()}`,
          title: typeof title === 'string' ? title : title.title || title.name || String(title),
          description: typeof title === 'object' ? title.description : undefined
        }));

        // Validation : vérifier qu'on a au moins 1 titre valide
        const validTitles = titles.filter(t => t.title && t.title.trim().length > 0);
        if (validTitles.length === 0) {
          console.error('[N8nTitleGeneration] Aucun titre valide trouvé dans les titres extraits');
          return [];
        }

        return validTitles;
      }
    }

    // Format 2: result.titles (format array)
    if (result.titles && Array.isArray(result.titles)) {
      console.log('[N8nTitleGeneration] Détection du format titles array:', result.titles);
      titles = result.titles.map((title: any, index: number) => ({
        id: `title-${index}-${Date.now()}`,
        title: typeof title === 'string' ? title : title.title || title.name,
        description: typeof title === 'object' ? title.description : undefined
      }));
      return titles;
    }

    // Format 3: result.title1/title2/title3 (format direct)
    if (result.title1 && result.title2 && result.title3) {
      console.log('[N8nTitleGeneration] Détection du format title1/title2/title3');
      titles = [
        { id: `title-1-${Date.now()}`, title: result.title1 },
        { id: `title-2-${Date.now()}`, title: result.title2 },
        { id: `title-3-${Date.now()}`, title: result.title3 }
      ];
      return titles;
    }

    // Format 4: Tentative d'extraction de propriétés contenant "title"
    const titleKeys = Object.keys(result).filter(key =>
      key.toLowerCase().includes('title') && result[key]
    );

    if (titleKeys.length > 0) {
      console.log('[N8nTitleGeneration] Détection de clés contenant "title":', titleKeys);
      titles = titleKeys.slice(0, 3).map((key, index) => ({
        id: `title-${index}-${Date.now()}`,
        title: String(result[key])
      }));
      return titles;
    }

    console.error('[N8nTitleGeneration] ERREUR: Aucun format de titre reconnu dans:', result);
    console.error('[N8nTitleGeneration] Clés disponibles:', Object.keys(result));
    return [];
  };

  // Fonction pour générer des titres supplémentaires (regénération)
  const generateAdditionalTitles = async (data: TitleGenerationData): Promise<GeneratedTitle[]> => {
    if (regenerationUsed) {
      toast({
        title: "Regénération déjà utilisée",
        description: "Vous ne pouvez regénérer des titres qu'une seule fois par création d'histoire",
        variant: "destructive",
      });
      return [];
    }

    try {
      setIsGeneratingTitles(true);

      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/067eebcf-cb14-4e1b-8b6b-b21e872c1d60';

      const { data: templateData } = await supabase
        .from('prompt_templates')
        .select('active_version_id, prompt_template_versions!active_version_id(content)')
        .eq('key', 'title_generation_prompt')
        .single();

      const versionData = templateData?.prompt_template_versions as unknown as { content: string } | { content: string }[];
      let promptContent = "";

      if (Array.isArray(versionData)) {
        promptContent = versionData[0]?.content;
      } else if (versionData) {
        promptContent = (versionData as { content: string }).content;
      }

      if (!promptContent) promptContent = "Génère 3 titres pour : {{objective}}";
      const finalPrompt = promptContent.replace('{{objective}}', data.objective);

      const payload = {
        action: 'generate_titles',
        objective: data.objective,
        title_generation_prompt: finalPrompt,
        childrenIds: data.childrenIds,
        childrenNames: data.childrenNames,
        childrenGenders: data.childrenGenders,
        requestType: 'title_regeneration',
        userId: user?.id
      };

      console.log('[N8nTitleGeneration] Regénération - Payload envoyé:', JSON.stringify(payload, null, 2));

      let result;
      let retries = 0;
      let successRegen = false;
      let lastRegenError;

      while (!successRegen && retries < 3) {
        try {
          const { data, error } = await supabase.functions.invoke('trigger-n8n', {
            body: { targetUrl: webhookUrl, payload }
          });

          if (error) throw new Error(error.message || "Erreur proxy");
          if (data?.error) throw new Error(data.error);
          
          result = data;
          successRegen = true;
        } catch (err: any) {
          lastRegenError = err;
          const msg = err?.message?.toLowerCase() || '';
          if (msg.includes('timeout') || msg.includes('network') || msg.includes('connexion') || msg.includes('proxy') || msg.includes('pattern') || msg.includes('erreur temporaire')) {
            retries++;
            if (retries >= 3) throw err;
            await new Promise(r => setTimeout(r, 2000 * Math.pow(2, retries)));
          } else {
            throw err;
          }
        }
      }
      console.log('[N8nTitleGeneration] Réponse regénération reçue:', JSON.stringify(result, null, 2));

      // Détecter erreur dans le body
      const rawCheckRegen = Array.isArray(result) ? result[0] : result;
      if (rawCheckRegen?.error || rawCheckRegen?.message?.toLowerCase()?.includes('pattern')) {
        throw new Error('Erreur temporaire du serveur de génération');
      }

      const newTitles = parseN8nTitlesResponse(result);

      if (newTitles.length === 0) {
        throw new Error('Aucun nouveau titre reçu');
      }

      // Corriger les IDs pour refléter la position réelle (4, 5, 6)
      const startIndex = generatedTitles.length;
      const titlesWithCorrectIds = newTitles.map((title, index) => ({
        ...title,
        id: `title-${startIndex + index + 1}-${Date.now()}`
      }));

      // Ajouter les nouveaux titres À LA FIN de la liste existante
      const updatedTitles = [...generatedTitles, ...titlesWithCorrectIds];
      onTitlesGenerated?.(updatedTitles);
      onRegenerationUsed?.(); // Utiliser la callback de persistance

      toast({
        title: "Nouveaux titres générés",
        description: "3 nouveaux titres ont été ajoutés à la liste",
      });

      return titlesWithCorrectIds;
    } catch (error: any) {
      console.error("Erreur lors de la regénération des titres:", error);
      toast({
        title: "Erreur de regénération",
        description: getErrorMessage(error, "regénération de titres"),
        variant: "destructive",
      });
      return [];
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  const generateTitles = async (data: TitleGenerationData): Promise<GeneratedTitle[]> => {
    console.log('[N8nTitleGeneration] ===== DÉBUT GÉNÉRATION TITRES =====');
    console.log('[N8nTitleGeneration] État initial:', {
      currentTitles: generatedTitles.length,
      isGenerating: isGeneratingTitles
    });

    setIsGeneratingTitles(true);

    try {
      console.log('[N8nTitleGeneration] Envoi de la requête pour générer 3 titres:', data);

      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/067eebcf-cb14-4e1b-8b6b-b21e872c1d60';

      // 1. Récupérer l'ID de la version active du template
      console.log('[N8nTitleGeneration] Récupération du template "title_generation_prompt"...');
      const { data: templateData, error: templateError } = await supabase
        .from('prompt_templates')
        .select('id, active_version_id')
        .eq('key', 'title_generation_prompt')
        .single();

      if (templateError) {
        console.warn('[N8nTitleGeneration] Erreur fetch template:', templateError);
      }

      let promptContent = "";

      // 2. Si on a une version active, récupérer son contenu
      if (templateData?.active_version_id) {
        const { data: versionData, error: versionError } = await supabase
          .from('prompt_template_versions')
          .select('content')
          .eq('id', templateData.active_version_id)
          .single();

        if (versionError) {
          console.warn('[N8nTitleGeneration] Erreur fetch version:', versionError);
        } else if (versionData?.content) {
          promptContent = versionData.content;
          console.log('[N8nTitleGeneration] Prompt chargé avec succès, longueur:', promptContent.length);
        }
      } else {
        console.warn('[N8nTitleGeneration] Aucune version active trouvée pour le template');
      }

      // Fallback si pas de prompt en base
      if (!promptContent) {
        console.warn('[N8nTitleGeneration] Pas de prompt trouvé en base (ou vide), utilisation du fallback par défaut');
        const DEFAULT_FALLBACK_PROMPT = `Tu es directeur éditorial jeunesse pour des albums illustrés destinés aux enfants de 3 à 8 ans. Ta mission est de proposer exactement 3 titres originaux, courts, poétiques et immédiatement évocateurs pour une histoire dont l'intention ou l'objectif émotionnel est : {{objective}}.

CONTEXTE ÉDITORIAL & POÉSIE JEUNESSE
Écris dans une sobriété littéraire inspirée de L'école des loisirs et de Gallimard Jeunesse : des mots simples, concrets, sonores et sensibles. Chaque titre doit faire naître une image claire et vivante dans l'esprit d'un enfant, sans expliquer l'intrigue, sans résumer l'histoire ni promettre une émotion de façon abstraite.

INTENTION SELON {{objective}}
- se calmer : évoquer l'ancrage, le retour au calme, la terre ferme, le silence après le tumulte, le souffle qui se pose.
- se relaxer : évoquer la lenteur, les matières douces, la chaleur, le flottement, le repos du corps.
- s'apaiser : évoquer la sécurité, la proximité, le refuge, la tendresse, le petit monde protégé.
- s'amuser : provoquer un rire ou un sourire malicieux par une action surprenante, un défi complice, un jeu d'équipe ou une situation espiègle.

VARIÉTÉ SYNTAXIQUE STRICTE OBLIGATOIRE (3 STRUCTURES TOTALEMENT DISTINCTES)
Chacun des 3 titres DOIT obligatoirement adopter une construction grammaticale différente. Ne réutilise JAMAIS la même structure entre deux titres d'une même proposition :

- Titre 1 : VERBE D'ACTION (à l'infinitif, à l'impératif ou invitation vive).
  Structure : [Verbe d'action] + [Complément direct simple]
  Exemples de référence : « Suivre la coccinelle bleue », « Réveiller la colline », « Écouter la nuit tiède », « Attraper le vent frais ».

- Titre 2 : GROUPE NOMINAL SIMPLE SANS AUCUN COMPLÉMENT DU NOM.
  Structure : [Article / Déterminant] + [Nom concret] + [Adjectif sensoriel, d'attitude ou de couleur]
  ATTENTION : ZÉRO préposition « de / du / des » dans ce titre !
  Exemples de référence : « Le galet tiède », « La cabane endormie », « Un souffle orange », « Le sentier silencieux », « La boîte jaune ».

- Titre 3 : PRÉPOSITION SPATIALE/TEMPORELLE (autre que de/dans) OU MOMENT POÉTIQUE COURT.
  Structure : [Préposition : sous / avant / après / derrière / avec / vers] + [Groupe nominal] OU [Proposition : Quand / Dès que...]
  Exemples de référence : « Sous le grand rideau », « Avant la première pluie », « Derrière les fougères », « Quand le soir arrive », « Demain sera tout doux ».

INTERDICTIONS ABSOLUES & ANTI-PATTERNS (TRÈS STRICT - ZÉRO TOLÉRANCE)
1. INTERDICTION FORMELLE DU COMPLÉMENT DU NOM EN « DE / DU / DES / D' » :
   PROSCRIRE TOUT TITRE DU TYPE « [Nom] de/du/des/d' [Nom] ».
   Exemples strictement INTERDITS : « Le ravin des cerfs-volants », « La mosaïque de la tortue », « Les balises du gymnase », « Le pont des parapluies », « Le secret du bois », « La quête des glands », « L'expédition du vent ».
   AUCUN des 3 titres ne doit adopter cette structure répétitive.
2. INTERDICTION FORMELLE DU SCHÉMA « OBJET DANS UN LIEU » :
   PROSCRIRE STRICTEMENT « Le chat dans le placard », « La boussole dans la soupe », « Le phare dans l'armoire », « Un poisson dans la baignoire ».
3. AUCUN ADJECTIF LAUDATIF OU CREUX :
   Proscrire absolument : « magique », « merveilleux », « incroyable », « fantastique », « génial », « extraordinaire », « fabuleux », « féerique ».
4. AUCUN NOM D'ENFANT OU PRÉNOM DANS LE TITRE.
5. AUCUNE CONSTRUCTION EN « QUI + VERBE » (ex: interdire « Le hérisson qui ne piquait pas », « Le chat qui dort »).
6. AUCUN CLICHÉ THÉRAPEUTIQUE OU ABSTRAIT :
   Ne jamais utiliser de mots abstraits comme « la confiance », « le calme », « la sérénité », « le bonheur » dans le titre. L'émotion doit passer par une image physique concrète.

TYPOGRAPHIE FRANÇAISE
Respecte strictement la casse française : une majuscule uniquement au premier mot du titre et aux noms propres indispensables. N'utilise JAMAIS la Title Case anglaise (pas de majuscule à chaque mot).
- Correct : « Le renardeau timide »
- Incorrect : « Le Renardeau Timide »

FORMAT DE SORTIE IMPÉRATIF
Réponds exclusivement avec un objet JSON valide, sans commentaire, sans balise Markdown et sans texte avant ou après :
{
  "title_1": "...",
  "title_2": "...",
  "title_3": "...",
  "input_tokens": "string",
  "output_tokens": "string",
  "model_llm": "gpt-5"
}`;
        promptContent = DEFAULT_FALLBACK_PROMPT;
      }

      // Remplacer la variable {{objective}}
      const finalPrompt = promptContent.replace('{{objective}}', data.objective);

      const payload = {
        action: 'generate_titles',
        objective: data.objective,
        title_generation_prompt: finalPrompt, // Champ explicite pour la génération
        childrenIds: data.childrenIds,
        childrenNames: data.childrenNames,
        childrenGenders: data.childrenGenders,
        requestType: 'title_generation',
        userId: user?.id
      };

      console.log('[N8nTitleGeneration] Payload envoyé:', JSON.stringify(payload, null, 2));

      let result;
      let retriesGen = 0;
      let successGen = false;
      let lastGenError;

      while (!successGen && retriesGen < 4) {
        try {
          const { data, error } = await supabase.functions.invoke('trigger-n8n', {
            body: { targetUrl: webhookUrl, payload }
          });

          if (error) throw new Error(error.message || "Erreur proxy");
          if (data?.error) throw new Error(data.error);
          
          result = data;
          successGen = true;
        } catch (err: any) {
          lastGenError = err;
          const msg = err?.message?.toLowerCase() || '';
          const name = (err?.name || '').toLowerCase();
          const isNetworkError =
            msg.includes('failed to fetch') ||
            msg.includes('timeout') ||
            msg.includes('network') ||
            msg.includes('networkerror') ||
            msg.includes('connexion') ||
            msg.includes('proxy') ||
            msg.includes('pattern') ||
            msg.includes('erreur temporaire') ||
            name === 'typeerror';
          if (isNetworkError) {
            retriesGen++;
            console.warn(`[N8nTitleGeneration] Retry ${retriesGen}/4 après erreur réseau:`, err?.message);
            if (retriesGen >= 4) {
              throw new Error("Le service de génération est temporairement indisponible. Réessaie dans quelques secondes — si l'erreur persiste, recharge l'app depuis Paramètres → Vérifier les mises à jour.");
            }
            await new Promise(r => setTimeout(r, 2000 * Math.pow(2, retriesGen)));
          } else {
            throw err;
          }
        }
      }
      console.log('[N8nTitleGeneration] Réponse brute reçue:', JSON.stringify(result, null, 2));

      // Détecter si n8n a renvoyé une erreur dans le body (HTTP 200 mais contenu = erreur)
      const rawCheck = Array.isArray(result) ? result[0] : result;
      if (rawCheck?.error || rawCheck?.message?.toLowerCase()?.includes('pattern') || rawCheck?.message?.toLowerCase()?.includes('did not match')) {
        console.error('[N8nTitleGeneration] Erreur détectée dans le body n8n:', rawCheck?.error || rawCheck?.message);
        throw new Error('Erreur temporaire du serveur de génération');
      }

      // Utiliser le parser corrigé
      const titles = parseN8nTitlesResponse(result);

      if (titles.length === 0) {
        console.error('[N8nTitleGeneration] ÉCHEC: Aucun titre extrait de la réponse');
        throw new Error('Aucun titre reçu de n8n - format de réponse non reconnu');
      }

      // Extraire les données de coût de la réponse n8n
      const rawResult = Array.isArray(result) ? result[0] : result;
      const costData: TitleCostData | undefined = rawResult?.total_cost_usd !== undefined ? {
        total_input_tokens: rawResult.total_input_tokens || 0,
        total_output_tokens: rawResult.total_output_tokens || 0,
        total_cost_usd: rawResult.total_cost_usd || 0,
        details_par_noeud: rawResult.details_par_noeud,
        timestamp: rawResult.timestamp || new Date().toISOString()
      } : undefined;

      console.log('[N8nTitleGeneration] SUCCÈS: Titres finaux extraits:', titles);
      console.log('[N8nTitleGeneration] Données de coût extraites:', costData);
      console.log('[N8nTitleGeneration] ===== FIN GÉNÉRATION TITRES - SUCCÈS =====');

      // Notifier la persistance des nouveaux titres avec le coût
      onTitlesGenerated?.(titles, costData);

      // 🚨 NOTIFICATION NATIVE : Titres prêts
      try {
        await notifyTitlesGenerated();
        console.log('[N8nTitleGeneration] ✅ Notification native envoyée : Titres générés');
      } catch (notifError) {
        console.warn('[N8nTitleGeneration] ⚠️ Erreur notification native:', notifError);
      }

      // Pas de toast ici - sera géré par le composant appelant
      return titles;
    } catch (error: any) {
      console.error('[N8nTitleGeneration] ===== ERREUR GÉNÉRATION TITRES =====');
      console.error('[N8nTitleGeneration] Erreur complète:', error);

      toast({
        title: "Erreur de génération",
        description: getErrorMessage(error, "génération de titres"),
        variant: "destructive",
      });

      // 🚨 NOTIFICATION NATIVE : Erreur de génération
      try {
        await notifyStoryError('Génération de titres', 'generation-error');
        console.log('[N8nTitleGeneration] ✅ Notification d\'erreur envoyée');
      } catch (notifError) {
        console.warn('[N8nTitleGeneration] ⚠️ Erreur notification d\'erreur:', notifError);
      }

      throw error;
    } finally {
      console.log('[N8nTitleGeneration] ===== FIN GÉNÉRATION TITRES - CLEANUP =====');
      setIsGeneratingTitles(false);
    }
  };

  const clearTitles = () => {
    onTitlesGenerated?.([]);
    // La réinitialisation sera gérée par la persistance
  };

  // Fonction pour réinitialiser l'état de regénération
  const resetRegenerationState = () => {
    // Géré par la persistance
  };

  return {
    generateTitles,
    generateAdditionalTitles,
    clearTitles,
    resetRegenerationState,
    generatedTitles,
    isGeneratingTitles,
    regenerationUsed,
    canRegenerate: !regenerationUsed && generatedTitles.length >= 3 && generatedTitles.length < 6,
  };
};
