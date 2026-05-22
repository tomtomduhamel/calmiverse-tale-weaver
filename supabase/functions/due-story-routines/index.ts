// Edge Function appelée par n8n toutes les 5 minutes.
// Elle réclame les routines dues de manière atomique, vérifie les droits/quotas,
// incrémente l'usage et renvoie des descripteurs de jobs que n8n dispatche.
//
// Auth : header x-webhook-secret == N8N_WEBHOOK_SECRET (même pattern que n8n-story-webhook)
//
// Réponse :
// {
//   jobs: Job[],        // à dispatcher par n8n
//   processed: number,
//   skipped: number,
//   requestId: string
// }
//
// Job (mode fast) :
// { routineId, userId, mode:"fast", fastStoryPromptKey, durationMinutes, generateVideo,
//   assembleUrl, storyWebhookUrl }
//
// Job (mode guided) :
// { routineId, userId, mode:"guided", objective, childrenIds, durationMinutes, generateVideo,
//   titlePayload, titleWebhookUrl, assembleUrl, storyWebhookUrl }
//
// n8n flow (fast)    : assemble-story-payload (webhook secret auth) → create webhook
// n8n flow (guided)  : title webhook → titles[0] → assemble-story-payload → create webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// URLs n8n fixes (mêmes que dans les hooks frontend)
const TITLE_WEBHOOK_URL =
  "https://n8n.srv856374.hstgr.cloud/webhook/067eebcf-cb14-4e1b-8b6b-b21e872c1d60";
const STORY_WEBHOOK_URL =
  "https://n8n.srv856374.hstgr.cloud/webhook/816f3f78-bbdc-4b51-88b6-13232fcf3c78";

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`⏰ [due-routines-${requestId}] ${req.method}`);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── 1. Authentification ─────────────────────────────────────────────────────
  const webhookSecret = req.headers.get("x-webhook-secret");
  const expectedSecret = Deno.env.get("N8N_WEBHOOK_SECRET");

  if (!webhookSecret || webhookSecret !== expectedSecret) {
    console.error(`❌ [due-routines-${requestId}] Secret webhook invalide`);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const ASSEMBLE_URL = `${supabaseUrl}/functions/v1/assemble-story-payload`;

    // ── 2. Reset quotas mensuels expirés (idempotent) ──────────────────────────
    const { error: resetError } = await supabase.rpc("reset_monthly_quotas");
    if (resetError) {
      // Non bloquant : on log et on continue
      console.warn(
        `⚠️ [due-routines-${requestId}] reset_monthly_quotas: ${resetError.message}`
      );
    } else {
      console.log(`🔄 [due-routines-${requestId}] Quotas mensuels vérifiés`);
    }

    // ── 3. Réclamation atomique des routines dues ──────────────────────────────
    const { data: dueRoutines, error: claimError } = await supabase.rpc(
      "claim_due_routines",
      { p_limit: 50 }
    );

    if (claimError) {
      throw new Error(`claim_due_routines failed: ${claimError.message}`);
    }

    const routines: any[] = dueRoutines ?? [];
    console.log(
      `📋 [due-routines-${requestId}] ${routines.length} routine(s) due(s)`
    );

    if (routines.length === 0) {
      return new Response(
        JSON.stringify({ jobs: [], processed: 0, skipped: 0, requestId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Précharger le template de génération de titres (partagé) ────────────
    let titleGenPromptTemplate = "";
    try {
      const { data: tmpl } = await supabase
        .from("prompt_templates")
        .select("id, active_version_id")
        .eq("key", "title_generation_prompt")
        .single();

      if (tmpl?.active_version_id) {
        const { data: ver } = await supabase
          .from("prompt_template_versions")
          .select("content")
          .eq("id", tmpl.active_version_id)
          .single();
        titleGenPromptTemplate = ver?.content ?? "";
        console.log(
          `📝 [due-routines-${requestId}] Template titre chargé (${titleGenPromptTemplate.length} car.)`
        );
      } else {
        console.warn(
          `⚠️ [due-routines-${requestId}] Aucune version active pour title_generation_prompt`
        );
      }
    } catch (e: any) {
      console.warn(
        `⚠️ [due-routines-${requestId}] Erreur fetch template titre: ${e?.message}`
      );
    }

    // ── 5. Traiter chaque routine ──────────────────────────────────────────────
    const jobs: any[] = [];
    const skippedList: { id: string; reason: string }[] = [];

    for (const routine of routines) {
      const userId: string = routine.user_id;
      const routineId: string = routine.id;
      const logPrefix = `[due-routines-${requestId}][routine:${routineId.slice(0, 8)}]`;

      // 5a. Vérifier le droit premium "auto_creation"
      const { data: featureOk, error: featureErr } = await supabase.rpc(
        "has_feature_access",
        { p_user_id: userId, p_feature: "auto_creation" }
      );

      if (featureErr) {
        console.warn(`⚠️ ${logPrefix} has_feature_access error: ${featureErr.message}`);
      }

      if (!featureOk) {
        console.log(`⏭️ ${logPrefix} Skipped: feature_not_available`);
        skippedList.push({ id: routineId, reason: "feature_not_available" });
        continue;
      }

      // 5b. Vérifier le quota histoires
      const { data: quotaData, error: quotaErr } = await supabase.rpc(
        "check_user_quota",
        { p_user_id: userId, p_quota_type: "story" }
      );

      if (quotaErr) {
        console.warn(`⚠️ ${logPrefix} check_user_quota error: ${quotaErr.message}`);
      }

      if (!quotaData?.allowed) {
        console.log(
          `⏭️ ${logPrefix} Skipped: quota_exceeded (${quotaData?.used ?? "?"}/${quotaData?.limit ?? "?"})`
        );
        skippedList.push({ id: routineId, reason: "quota_exceeded" });
        continue;
      }

      // 5c. Incrémenter l'usage immédiatement (avant dispatch pour éviter les doublons en cas d'erreur n8n)
      const { error: incrErr } = await supabase.rpc("increment_usage", {
        p_user_id: userId,
        p_usage_type: "story",
      });

      if (incrErr) {
        // Non bloquant : on log mais on continue pour ne pas bloquer la routine
        console.warn(`⚠️ ${logPrefix} increment_usage error: ${incrErr.message}`);
      }

      // 5d. Construire le descripteur de job selon le mode
      if (routine.mode === "fast") {
        console.log(`✅ ${logPrefix} Job fast: promptKey=${routine.fast_story_prompt_key}`);
        jobs.push({
          routineId,
          userId,
          mode: "fast",
          fastStoryPromptKey: routine.fast_story_prompt_key,
          durationMinutes: routine.duration_minutes,
          generateVideo: routine.generate_video,
          // URLs que n8n utilisera directement
          assembleUrl: ASSEMBLE_URL,
          storyWebhookUrl: STORY_WEBHOOK_URL,
        });
      } else {
        // mode === 'guided'
        // Résoudre les données enfants pour le payload de génération de titres
        let childrenData: { id: string; name: string; gender: string }[] = [];
        try {
          const { data: children, error: childErr } = await supabase
            .from("children")
            .select("id, name, gender")
            .in("id", routine.child_ids ?? []);

          if (childErr) {
            console.warn(`⚠️ ${logPrefix} Erreur fetch children: ${childErr.message}`);
          } else {
            childrenData = children ?? [];
          }
        } catch (e: any) {
          console.warn(`⚠️ ${logPrefix} Exception fetch children: ${e?.message}`);
        }

        // Construire le prompt de génération de titres (même logique que useN8nTitleGeneration)
        const finalPrompt = titleGenPromptTemplate
          ? titleGenPromptTemplate.replace("{{objective}}", routine.objective ?? "")
          : ""; // n8n utilisera son fallback interne si vide

        const titlePayload = {
          action: "generate_titles",
          objective: routine.objective ?? "",
          title_generation_prompt: finalPrompt,
          childrenIds: childrenData.map((c) => c.id),
          childrenNames: childrenData.map((c) => c.name),
          childrenGenders: childrenData.map((c) => c.gender),
          requestType: "title_generation",
          userId,
        };

        console.log(
          `✅ ${logPrefix} Job guided: objective=${routine.objective}, ${childrenData.length} enfant(s)`
        );

        jobs.push({
          routineId,
          userId,
          mode: "guided",
          objective: routine.objective ?? "",
          childrenIds: routine.child_ids ?? [],
          durationMinutes: routine.duration_minutes,
          generateVideo: routine.generate_video,
          // Payload prêt à envoyer au webhook de génération de titres
          titlePayload,
          // URLs que n8n utilisera directement
          titleWebhookUrl: TITLE_WEBHOOK_URL,
          assembleUrl: ASSEMBLE_URL,
          storyWebhookUrl: STORY_WEBHOOK_URL,
        });
      }
    }

    // ── 6. Écrire les raisons de skip en DB ────────────────────────────────────
    if (skippedList.length > 0) {
      // Batch update par raison pour limiter les requêtes
      const byReason = skippedList.reduce<Record<string, string[]>>((acc, s) => {
        acc[s.reason] = acc[s.reason] ?? [];
        acc[s.reason].push(s.id);
        return acc;
      }, {});

      for (const [reason, ids] of Object.entries(byReason)) {
        const { error: skipErr } = await supabase
          .from("story_routines")
          .update({
            last_skip_reason: reason,
            updated_at: new Date().toISOString(),
          })
          .in("id", ids);

        if (skipErr) {
          console.warn(
            `⚠️ [due-routines-${requestId}] Erreur update skip reason "${reason}": ${skipErr.message}`
          );
        }
      }
    }

    console.log(
      `🏁 [due-routines-${requestId}] Terminé: ${jobs.length} job(s), ${skippedList.length} skippé(s)`
    );

    return new Response(
      JSON.stringify({
        jobs,
        processed: jobs.length,
        skipped: skippedList.length,
        requestId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error(`💥 [due-routines-${requestId}] ERREUR:`, error?.message);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Erreur interne", requestId }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
