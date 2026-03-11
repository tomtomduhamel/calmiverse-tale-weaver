
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle OPTIONS pour les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Créer un client Supabase avec service_role pour accéder à auth.users
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    // Obtenir le token JWT de l'en-tête Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentification requise" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extraire le token JWT
    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier et obtenir l'utilisateur à partir du JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Erreur d'authentification:", authError);
      return new Response(
        JSON.stringify({ error: "Utilisateur non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`Début suppression du compte utilisateur: ${userId}`);

    // 1. Supprimer les données associées dans l'ordre (contraintes FK)

    const { error: childrenError } = await supabaseClient
      .from('children')
      .delete()
      .eq('authorid', userId);
    if (childrenError) {
      console.warn(`Erreur suppression enfants (non bloquant): ${childrenError.message}`);
    } else {
      console.log(`Enfants supprimés pour ${userId}`);
    }

    const { error: storiesError } = await supabaseClient
      .from('stories')
      .delete()
      .eq('authorid', userId);
    if (storiesError) {
      console.warn(`Erreur suppression histoires (non bloquant): ${storiesError.message}`);
    } else {
      console.log(`Histoires supprimées pour ${userId}`);
    }

    const { error: subscriptionsError } = await supabaseClient
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);
    if (subscriptionsError) {
      console.warn(`Erreur suppression abonnements (non bloquant): ${subscriptionsError.message}`);
    }

    const { error: betaError } = await supabaseClient
      .from('beta_users')
      .delete()
      .eq('user_id', userId);
    if (betaError) {
      console.warn(`Erreur suppression beta_users (non bloquant): ${betaError.message}`);
    }

    const { error: usersTableError } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', userId);
    if (usersTableError) {
      console.warn(`Erreur suppression table users (non bloquant): ${usersTableError.message}`);
    } else {
      console.log(`Enregistrement users supprimé pour ${userId}`);
    }

    // 2. Supprimer le compte utilisateur de auth.users (nécessite service_role)
    const { error: deleteAuthUserError } = await supabaseClient.auth.admin.deleteUser(userId);
    
    if (deleteAuthUserError) {
      console.error("Erreur lors de la suppression auth user:", deleteAuthUserError);
      return new Response(
        JSON.stringify({ error: deleteAuthUserError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Compte utilisateur ${userId} supprimé avec succès`);

    return new Response(
      JSON.stringify({ success: true, message: "Compte utilisateur supprimé avec succès" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error("Erreur lors de la suppression du compte:", errorMessage);
    return new Response(
      JSON.stringify({ error: `Erreur lors de la suppression du compte: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
