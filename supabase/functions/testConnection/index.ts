
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`🔥 [testConnection] REQUÊTE REÇUE: ${req.method} à ${new Date().toISOString()}`);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [testConnection] CORS OPTIONS traité');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'POST') {
    console.log('🎯 [testConnection] POST REÇU AVEC SUCCÈS!');
    
    try {
      const body = await req.json();
      console.log('📋 [testConnection] Body reçu:', JSON.stringify(body, null, 2));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Test de connexion réussi',
          timestamp: new Date().toISOString(),
          receivedData: body
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error: any) {
      console.error('❌ [testConnection] Erreur:', error);
      return new Response(
        JSON.stringify({ 
          error: true, 
          message: error.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }

  console.log(`❌ [testConnection] Méthode non supportée: ${req.method}`);
  return new Response(
    JSON.stringify({ error: 'Méthode non supportée' }),
    {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
});
