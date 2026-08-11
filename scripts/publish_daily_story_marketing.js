import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { renderInstagramStoryVideo } from './generate_instagram_story_video.js';
import { publishVideoToInstagram } from './instagram_api_client.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SLOT_CONFIGS = {
  morning_6h: {
    slotName: 'morning_6h',
    theme: '☀️ Calmi Réveil • Sérénité & Énergie Douce',
    durationText: '3 min de lecture',
    targetDurationMinutes: 3,
    publicationType: 'story',
    soundObjective: 'focus',
    fallbackSoundFile: 'path-to-harmony-313385.mp3',
    storyPrompt: "Une histoire courte, douce et lumineuse pour bien commencer la journée, invitant à la clarté d'esprit et à la confiance.",
    sampleTitle: "La Première Lueur du Matin",
    sampleExcerpt: `Le soleil se levait doucement sur la vallée encore endormie, déposant des gouttes de rosée dorée sur les feuilles de chêne.\n\nUne petite mésange ouvrit ses ailes et entama son chant matinal, rappelant que chaque journée nouvelle est une page blanche pleine de promesses.\n\nPrenez une profonde inspiration, sentez l'énergie calme qui s'éveille en vous et avancez sereinement vers cette nouvelle journée.`
  },
  noon_12h: {
    slotName: 'noon_12h',
    theme: '🌸 Pause Midi • Déconnexion & Respiration',
    durationText: '5 min de lecture',
    targetDurationMinutes: 5,
    publicationType: 'story',
    soundObjective: 'relax',
    fallbackSoundFile: 'breath-of-life_10-minutes-320859.mp3',
    storyPrompt: "Une histoire relaxante pour faire une pause régénérante au milieu de la journée, relâcher les tensions et apaiser l'esprit.",
    sampleTitle: "L'Oasis des Pensées Calmes",
    sampleExcerpt: `Au milieu du tumulte du monde, il existe un jardin secret où le temps semble suspendre son vol.\n\nLe vent y chante une mélodie légère à travers les bambous, invitant vos épaules à s'abaisser et vos pensées à s'éclaircir.\n\nAccordez-vous cet instant de répit. Fermez les yeux quelques secondes et laissez la tranquillité se diffuser dans tout votre corps.`
  },
  evening_19h: {
    slotName: 'evening_19h',
    theme: '🌙 Conte du Soir • Rituel du Sommeil',
    durationText: '10 min de lecture',
    targetDurationMinutes: 10,
    publicationType: 'story_and_reel',
    soundObjective: 'sleep',
    fallbackSoundFile: 'inner-peace-339640.mp3',
    storyPrompt: "Un conte poétique et hypnotique pour endormir petits et grands, basé sur des métaphores apaisantes et une détente progressive.",
    sampleTitle: "Le Gardien des Rêves Étoilés",
    sampleExcerpt: `La nuit enveloppait peu à peu le monde de son grand manteau de velours sombre, parsemé de poussière d'étoiles.\n\nDans sa petite barque d'argent flottant sur le fleuve céleste, le gardien des rêves allumait une à une les veilleuses du sommeil.\n\nChaque souffle devient plus lent, chaque paupière plus lourde, bercé par le rythme rassurant de la nuit qui prend soin de vous.`
  }
};

/**
 * Génère ou récupère une image de couverture adaptée
 */
async function createCoverImageBuffer({ slot, title }) {
  const isMorning = slot === 'morning_6h';
  const isNoon = slot === 'noon_12h';

  const stop1 = isMorning ? '#0F172A' : isNoon ? '#064E3B' : '#0B0E17';
  const stop2 = isMorning ? '#1E293B' : isNoon ? '#065F46' : '#1A2035';
  const stop3 = isMorning ? '#312E81' : isNoon ? '#047857' : '#2D2B55';
  const stop4 = isMorning ? '#F59E0B' : isNoon ? '#10B981' : '#4C1D95';

  const centerIcon = isMorning ? '☀️' : isNoon ? '🌸' : '🌙';

  const coverSvg = `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${stop1}" />
        <stop offset="35%" stop-color="${stop2}" />
        <stop offset="70%" stop-color="${stop3}" />
        <stop offset="100%" stop-color="${stop4}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8" />
        <stop offset="50%" stop-color="#A5B4FC" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#818CF8" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    <circle cx="540" cy="540" r="220" fill="url(#glow)" />
    <text x="540" y="580" font-size="120" text-anchor="middle">${centerIcon}</text>
  </svg>
  `;

  return await sharp(Buffer.from(coverSvg)).png().toBuffer();
}

/**
 * Récupère le son d'ambiance approprié
 */
async function fetchAmbientAudio({ soundObjective, fallbackSoundFile }) {
  const { data: sounds } = await supabase
    .from('sound_backgrounds')
    .select('*')
    .eq('objective', soundObjective);

  let soundRecord = sounds && sounds.length > 0 ? sounds[0] : null;
  const fileName = soundRecord?.file_path || fallbackSoundFile;
  const soundUrl = `${SUPABASE_URL}/storage/v1/object/public/story_sounds/${fileName}`;

  const tempAudioPath = path.join(os.tmpdir(), `sound_${Date.now()}_${fileName}`);
  console.log(`📥 Téléchargement audio d'ambiance (${soundObjective}): ${soundUrl}`);
  
  const res = await fetch(soundUrl);
  if (!res.ok) {
    throw new Error(`Impossible de télécharger l'audio: ${soundUrl}`);
  }

  fs.writeFileSync(tempAudioPath, Buffer.from(await res.arrayBuffer()));

  return {
    soundRecord,
    tempAudioPath,
    soundUrl
  };
}

/**
 * Exécute la génération et publication marketing pour un créneau donné
 */
export async function executeDailyMarketingStory({
  slot = 'evening_19h',
  customTitle,
  customExcerpt,
  customImageBuffer,
  igUserId = process.env.INSTAGRAM_USER_ID,
  accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
}) {
  console.log(`\n======================================================`);
  console.log(`🚀 [Calmi Marketing] Traitement du créneau : ${slot}`);
  console.log(`======================================================`);

  const config = SLOT_CONFIGS[slot] || SLOT_CONFIGS.evening_19h;
  const title = customTitle || config.sampleTitle;
  const excerpt = customExcerpt || config.sampleExcerpt;

  // 1. Enregistrer l'entrée dans Supabase
  const { data: publication, error: pubErr } = await supabase
    .from('marketing_publications')
    .insert({
      slot: config.slotName,
      channel: 'instagram',
      publication_type: config.publicationType,
      target_duration_minutes: config.targetDurationMinutes,
      theme: config.theme,
      title,
      excerpt,
      status: 'generating',
      cta_keyword: 'CALMI'
    })
    .select()
    .single();

  if (pubErr) {
    console.error("❌ Erreur création publication Supabase:", pubErr);
  }

  const pubId = publication?.id || `pub_${Date.now()}`;
  let tempAudioPath = null;
  let tempVideoPath = null;

  try {
    // 2. Audio d'ambiance
    const { soundRecord, tempAudioPath: audioPath, soundUrl } = await fetchAmbientAudio({
      soundObjective: config.soundObjective,
      fallbackSoundFile: config.fallbackSoundFile
    });
    tempAudioPath = audioPath;

    // 3. Image de couverture
    const coverBuffer = customImageBuffer || (await createCoverImageBuffer({ slot, title }));

    // 4. Génération vidéo 9:16
    tempVideoPath = path.join(os.tmpdir(), `calmi_story_${pubId}.mp4`);
    const renderRes = await renderInstagramStoryVideo({
      title,
      theme: config.theme,
      durationText: config.durationText,
      excerpt,
      coverBuffer,
      audioPath: tempAudioPath,
      outputVideoPath: tempVideoPath,
      ctaKeyword: 'CALMI'
    });

    // 5. Upload sur Supabase Storage (marketing-videos)
    const videoBuffer = fs.readFileSync(tempVideoPath);
    const videoStoragePath = `stories/${pubId}.mp4`;

    console.log(`☁️ Upload de la vidéo sur Supabase Storage (marketing-videos)...`);
    const { error: upErr } = await supabase.storage
      .from('marketing-videos')
      .upload(videoStoragePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (upErr) {
      throw new Error(`Échec upload vidéo: ${upErr.message}`);
    }

    const publicVideoUrl = `${SUPABASE_URL}/storage/v1/object/public/marketing-videos/${videoStoragePath}`;
    console.log(`🔗 URL publique de la vidéo : ${publicVideoUrl}`);

    // 6. Publication Instagram (si les clés sont fournies)
    let igStoryMediaId = null;
    let igReelMediaId = null;

    if (igUserId && accessToken) {
      console.log(`📸 Publication Instagram Story en cours...`);
      const storyRes = await publishVideoToInstagram({
        igUserId,
        accessToken,
        videoUrl: publicVideoUrl,
        mediaType: 'STORIES'
      });
      igStoryMediaId = storyRes.publishedMediaId;

      // Si créneau du soir (19h), publier également en Reel
      if (config.publicationType === 'story_and_reel') {
        console.log(`🎬 Publication Instagram Reel (19h) en cours...`);
        const reelCaption = `✨ ${title}\n\n${config.theme}\n\n🎧 Écoutez ce conte complet avec nos voix immersives et sons d'ambiance 3D dans l'application Calmi.\n\n💬 Répondez « CALMI » en message privé pour recevoir votre accès gratuit !\n\n#calmi #sommeil #relaxation #conte #méditation #bienetre #dodo`;
        const reelRes = await publishVideoToInstagram({
          igUserId,
          accessToken,
          videoUrl: publicVideoUrl,
          mediaType: 'REELS',
          caption: reelCaption,
          shareToFeed: true
        });
        igReelMediaId = reelRes.publishedMediaId;
      }
    } else {
      console.log(`ℹ️ Clés Instagram non fournies (Dry-run). Vidéo prête pour publication ultérieure.`);
    }

    // 7. Mettre à jour Supabase
    await supabase
      .from('marketing_publications')
      .update({
        sound_id: soundRecord?.id || null,
        sound_url: soundUrl,
        video_url: publicVideoUrl,
        status: (igStoryMediaId || !igUserId) ? 'ready' : 'failed',
        ig_story_media_id: igStoryMediaId,
        ig_reel_media_id: igReelMediaId,
        published_at: igStoryMediaId ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', pubId);

    console.log(`🎉 [Calmi Marketing] Créneau ${slot} terminé avec succès !`);
    return {
      success: true,
      publicationId: pubId,
      publicVideoUrl,
      igStoryMediaId,
      igReelMediaId
    };

  } catch (error) {
    console.error("❌ Erreur pendant l'exécution marketing:", error);
    await supabase
      .from('marketing_publications')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', pubId);
    throw error;

  } finally {
    if (tempAudioPath && fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
    if (tempVideoPath && fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
  }
}

// Permettre l'exécution directe en ligne de commande : node scripts/publish_daily_story_marketing.js [slot]
if (process.argv[1] && process.argv[1].endsWith('publish_daily_story_marketing.js')) {
  const slotArg = process.argv[2] || 'evening_19h';
  executeDailyMarketingStory({ slot: slotArg })
    .then(res => console.log('Résultat:', res))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
