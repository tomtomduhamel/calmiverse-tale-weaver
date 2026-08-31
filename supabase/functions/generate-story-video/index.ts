import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const n8nSecret = Deno.env.get("N8N_WEBHOOK_SECRET");

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

    const body = await req.json();
    const { storyId } = body;

    if (!storyId) {
      return new Response(
        JSON.stringify({ error: "storyId manquant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Récupérer l'histoire
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, title, summary, image_path, video_path, authorid")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      return new Response(
        JSON.stringify({ error: "Histoire non trouvée" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (story.authorid !== user.id) {
      return new Response(
        JSON.stringify({ error: "Action non autorisée sur cette histoire" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (story.video_path) {
      return new Response(
        JSON.stringify({ success: true, alreadyExists: true, video_path: story.video_path }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Récupérer les préférences de l'utilisateur
    const { data: userProfile } = await supabase
      .from("users")
      .select("video_orientation")
      .eq("id", user.id)
      .maybeSingle();

    const videoOrientation = userProfile?.video_orientation || "portrait";
    const videoAspectRatio = videoOrientation === "landscape" ? "16:9" : "9:16";

    // 3. Déclencher n8n pour la génération vidéo
    const webhookUrl = "https://n8n.srv856374.hstgr.cloud/webhook/816f3f78-bbdc-4b51-88b6-13232fcf3c78";

    if (n8nSecret) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Calmi-Webhook-Secret": n8nSecret,
          },
          body: JSON.stringify({
            action: "generate_video_only",
            generateVideo: true,
            videoOrientation,
            videoAspectRatio,
            storyId: story.id,
            selectedTitle: story.title,
            summary: story.summary || story.title,
            imagePath: story.image_path,
            userId: user.id,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookErr) {
        console.warn("[generate-story-video] Erreur appel webhook n8n:", webhookErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Génération de la vidéo magique initiée avec succès",
        storyId: story.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[generate-story-video] ERREUR:", error?.message);
    return new Response(
      JSON.stringify({ error: error?.message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
