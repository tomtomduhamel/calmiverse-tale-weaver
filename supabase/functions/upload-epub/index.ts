
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuration CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupération des paramètres de la requête
    const { content, filename } = await req.json();
    
    if (!content || !filename) {
      throw new Error("Le contenu et le nom du fichier sont requis");
    }

    // Validation du format du contenu
    if (typeof content !== 'string' || content.length > 5000000) { // limite de 5MB
      throw new Error("Format ou taille de contenu invalide");
    }

    // Validation du nom de fichier
    if (!/^[a-zA-Z0-9_-]+\.epub$/.test(filename)) {
      throw new Error("Format de nom de fichier invalide");
    }

    console.log('Création du buffer à partir du contenu HTML');
    const buffer = new TextEncoder().encode(content);

    // Création du client Supabase avec la clé d'API de service pour accéder au stockage
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Vérification si le bucket existe, sinon le créer
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const epubsBucket = buckets?.find(b => b.name === 'epubs');
    
    if (!epubsBucket) {
      console.log('Création du bucket epubs');
      await supabaseAdmin.storage.createBucket('epubs', {
        public: false,
        fileSizeLimit: 10485760 // 10MB
      });
    }

    // Upload du fichier
    console.log('Début de l\'upload du fichier', filename);
    const { data, error } = await supabaseAdmin.storage
      .from('epubs')
      .upload(`${filename}`, buffer, {
        contentType: 'application/epub+zip',
        cacheControl: '3600'
      });

    if (error) throw error;

    // Génération d'une URL signée pour télécharger le fichier
    console.log('Génération de l\'URL signée');
    const signedUrlResult = await supabaseAdmin.storage
      .from('epubs')
      .createSignedUrl(`${filename}`, 604800); // 7 jours (en secondes)

    if (signedUrlResult.error) throw signedUrlResult.error;

    console.log('URL générée avec succès');
    return new Response(
      JSON.stringify({ url: signedUrlResult.data.signedUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Erreur dans upload-epub:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
