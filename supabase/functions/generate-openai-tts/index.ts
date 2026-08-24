import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function chunkText(text: string, maxChars = 3800): string[] {
  if (text.length <= maxChars) return [text];
  
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk.length + para.length + 2) <= maxChars) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      if (para.length > maxChars) {
        // Découpe par phrases
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
        let subChunk = "";
        for (const s of sentences) {
          if ((subChunk.length + s.length) <= maxChars) {
            subChunk += s;
          } else {
            if (subChunk) chunks.push(subChunk.trim());
            subChunk = s;
          }
        }
        currentChunk = subChunk.trim();
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const logId = crypto.randomUUID().slice(0, 8);
  console.log(`🎙️ [generate-openai-tts-${logId}] Requête reçue`);

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('LOVABLE_API_KEY');
    if (!openaiApiKey) {
      throw new Error("Clé API OpenAI non configurée sur Supabase");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { text, storyId, requestId, voiceId } = body;

    if (!text || !storyId || !requestId) {
      return new Response(
        JSON.stringify({ error: "Champs obligatoires manquants (text, storyId, requestId)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sélection de la voix OpenAI selon le contexte
    // Voix disponibles : alloy, echo, fable, onyx, nova, shimmer
    let selectedVoice = "onyx"; // Voix masculine douce et posée par défaut
    if (voiceId && (voiceId.includes("mamie") || voiceId.includes("maman") || voiceId.includes("femme"))) {
      selectedVoice = "nova";
    }

    const textChunks = chunkText(text, 3800);
    console.log(`⚡ [generate-openai-tts-${logId}] Synthèse OpenAI (${selectedVoice}) sur ${textChunks.length} bloc(s)...`);

    const audioBuffers: Uint8Array[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      console.log(`  ├─ Traitement chunk ${i + 1}/${textChunks.length} (${chunk.length} chars)...`);

      const openAiRes = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "tts-1",
          input: chunk,
          voice: selectedVoice,
          response_format: "mp3",
          speed: 0.95 // Rythme apaisant pour le coucher
        })
      });

      if (!openAiRes.ok) {
        const errText = await openAiRes.text();
        throw new Error(`Erreur OpenAI TTS (${openAiRes.status}): ${errText}`);
      }

      const buffer = new Uint8Array(await openAiRes.arrayBuffer());
      audioBuffers.push(buffer);
    }

    // Concaténation des buffers MP3
    const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0);
    const finalBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of audioBuffers) {
      finalBuffer.set(buf, offset);
      offset += buf.length;
    }

    console.log(`✅ [generate-openai-tts-${logId}] Audio généré (${(finalBuffer.length / 1024).toFixed(1)} KB)`);

    // Upload vers Supabase Storage
    const fileName = `${storyId}/${requestId}-${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, finalBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Erreur upload Storage: ${uploadError.message}`);
    }

    const storedPath = uploadData.path;

    // Mise à jour de audio_files
    await supabase
      .from('audio_files')
      .update({
        status: 'ready',
        audio_url: storedPath,
        file_size: finalBuffer.length,
        updated_at: new Date().toISOString()
      })
      .eq('webhook_id', requestId);

    console.log(`🎉 [generate-openai-tts-${logId}] Audio prêt et enregistré dans audio_files !`);

    return new Response(
      JSON.stringify({
        success: true,
        provider: "openai-tts",
        audioPath: storedPath,
        requestId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`💥 [generate-openai-tts-${logId}] Erreur:`, error.message);

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
