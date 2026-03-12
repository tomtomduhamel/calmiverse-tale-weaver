
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: register-pending-user
 * 
 * Crée une entrée beta_users avec statut pending_validation pour un nouvel utilisateur.
 * Utilise le service_role pour bypasser les politiques RLS.
 * Peut être appelée sans session auth (utilisateur vient de s'inscrire).
 * 
 * Body: { user_id: string, email: string, invitation_code?: string }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Créer un client avec service_role pour bypasser RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    // Lire le body de la requête
    const body = await req.json();
    const { user_id, email, invitation_code } = body;

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: "user_id et email sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'utilisateur existe bien dans auth.users (sécurité)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (authError || !authUser?.user) {
      console.error("[register-pending-user] Utilisateur introuvable dans auth:", authError);
      return new Response(
        JSON.stringify({ error: "Utilisateur introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'email correspond bien à l'utilisateur (sécurité anti-spoofing)
    if (authUser.user.email?.toLowerCase() !== email.toLowerCase()) {
      console.error("[register-pending-user] Email ne correspond pas à l'utilisateur");
      return new Response(
        JSON.stringify({ error: "Email invalide" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[register-pending-user] Création entrée beta_users pour ${user_id} (${email})`);

    // Insérer dans beta_users avec service_role (bypass RLS)
    const { data, error } = await supabaseAdmin
      .from('beta_users')
      .insert({
        user_id,
        email,
        invitation_code: invitation_code || null,
        status: 'pending_validation',
      })
      .select()
      .single();

    if (error) {
      // Contrainte unique : l'entrée existe déjà (pas une erreur)
      if (error.code === '23505') {
        console.log("[register-pending-user] Entrée beta_users déjà existante, OK");
        return new Response(
          JSON.stringify({ success: true, message: "Entrée déjà existante" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("[register-pending-user] Erreur insertion beta_users:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[register-pending-user] ✅ Entrée beta_users créée: ${data.id}`);

    return new Response(
      JSON.stringify({ success: true, beta_user_id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error("[register-pending-user] Exception:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
