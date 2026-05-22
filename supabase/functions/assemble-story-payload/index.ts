// Assemble le payload complet de génération d'histoire à envoyer à n8n.
//
// Deux modes d'authentification :
//   1. Bearer JWT   → appelé par le frontend (création manuelle)
//      userId déduit du token, JAMAIS du body
//   2. x-webhook-secret → appelé par n8n (routines automatiques)
//      userId obligatoire dans le body

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildFastStoryPayload, buildGuidedStoryPayload } from "../_shared/story-assembly.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const expectedWebhookSecret = Deno.env.get("N8N_WEBHOOK_SECRET");

    // ── Lire le body une seule fois ───────────────────────────────────────────
    const body = await req.json();

    // ── Authentification : JWT OU webhook secret ───────────────────────────────
    let userId: string;

    const webhookSecret = req.headers.get("x-webhook-secret");
    const authHeader = req.headers.get("Authorization");

    if (webhookSecret && expectedWebhookSecret && webhookSecret === expectedWebhookSecret) {
      // Chemin n8n (routines automatiques) : userId fourni dans le body
      if (!body.userId || typeof body.userId !== "string") {
        return new Response(
          JSON.stringify({ error: "userId requis dans le body pour l'auth webhook" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = body.userId;
    } else if (authHeader) {
      // Chemin frontend (création manuelle) : userId déduit du JWT
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = user.id;
    } else {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Authorization header ou x-webhook-secret requis" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Assembler le payload (client service role pour lecture DB) ─────────────
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const mode = body?.mode;
    let payload;

    if (mode === "guided") {
      if (
        !body.objective ||
        !Array.isArray(body.childrenIds) ||
        body.childrenIds.length === 0 ||
        !body.selectedTitle
      ) {
        return new Response(
          JSON.stringify({
            error:
              "Paramètres guided manquants (objective, childrenIds, selectedTitle)",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      payload = await buildGuidedStoryPayload(supabase, {
        userId,
        objective: body.objective,
        childrenIds: body.childrenIds,
        selectedTitle: body.selectedTitle,
        durationMinutes: body.durationMinutes ?? null,
        generateVideo: body.generateVideo ?? false,
        titleGenerationCost: body.titleGenerationCost ?? null,
      });
    } else if (mode === "fast") {
      if (!body.fastStoryPromptKey || !body.durationMinutes) {
        return new Response(
          JSON.stringify({
            error: "Paramètres fast manquants (fastStoryPromptKey, durationMinutes)",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      payload = await buildFastStoryPayload(supabase, {
        userId,
        fastStoryPromptKey: body.fastStoryPromptKey,
        durationMinutes: body.durationMinutes,
        generateVideo: body.generateVideo ?? false,
      });
    } else {
      return new Response(
        JSON.stringify({ error: "mode invalide (attendu: 'guided' ou 'fast')" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[assemble-story-payload] ERREUR:", error?.message);
    return new Response(
      JSON.stringify({ error: error?.message || "Erreur interne" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
