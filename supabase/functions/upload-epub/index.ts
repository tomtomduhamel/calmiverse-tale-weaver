
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

serve(async (req) => {
  console.log('📚 [upload-epub] Nouvelle requête de génération EPUB');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { content, filename } = await req.json();
    
    if (!content || !filename) {
      throw new Error('Contenu ou nom de fichier manquant');
    }

    console.log('📖 [upload-epub] Génération EPUB pour:', filename);

    // Créer le contenu EPUB basique (structure simplifiée)
    const mimeType = 'application/epub+zip';
    const epubContent = createEpubContent(content, filename);
    
    // Convertir en Blob pour simulation d'upload
    const blob = new Blob([epubContent], { type: mimeType });
    
    // Pour l'instant, nous retournons une URL simulée
    // Dans un vrai environnement, vous uploaderiez vers un stockage
    const mockUrl = `https://storage.example.com/epubs/${filename.replace(/\s+/g, '_')}.epub`;
    
    console.log('✅ [upload-epub] EPUB généré avec succès:', mockUrl);

    return new Response(
      JSON.stringify({
        success: true,
        url: mockUrl,
        filename: filename,
        size: blob.size
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ [upload-epub] Erreur:', error.message);

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function createEpubContent(htmlContent: string, title: string): string {
  // Structure EPUB basique avec le contenu HTML fourni
  const epubStructure = `
<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:creator>Calmiverse</dc:creator>
    <dc:language>fr</dc:language>
    <dc:identifier id="uid">calmi-${Date.now()}</dc:identifier>
  </metadata>
  <manifest>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="content"/>
  </spine>
</package>

--- CONTENT ---
${htmlContent}
  `;
  
  return epubStructure;
}
