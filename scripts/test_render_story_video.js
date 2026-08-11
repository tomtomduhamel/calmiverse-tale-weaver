import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { renderInstagramStoryVideo } from './generate_instagram_story_video.js';

async function runTest() {
  console.log("🧪 Lancement du test de rendu vidéo Instagram Story...");

  // 1. Créer une image de couverture test avec sharp (dégradé crépuscule doux avec étoiles)
  const coverSvg = `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0B0E17" />
        <stop offset="35%" stop-color="#1A2035" />
        <stop offset="70%" stop-color="#2D2B55" />
        <stop offset="100%" stop-color="#4C1D95" />
      </linearGradient>
      <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFFBEB" stop-opacity="1" />
        <stop offset="40%" stop-color="#FDE68A" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#F59E0B" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#skyGrad)"/>
    <!-- Lune dorée -->
    <circle cx="540" cy="520" r="160" fill="url(#moonGlow)"/>
    <circle cx="540" cy="520" r="75" fill="#FEF3C7"/>
    <!-- Constellations et étoiles -->
    <circle cx="220" cy="300" r="4" fill="#FFFFFF" opacity="0.9"/>
    <circle cx="860" cy="250" r="3.5" fill="#FFFFFF" opacity="0.8"/>
    <circle cx="340" cy="750" r="3" fill="#FCD34D" opacity="0.85"/>
    <circle cx="780" cy="800" r="4" fill="#FFFFFF" opacity="0.9"/>
    <circle cx="160" cy="1100" r="3" fill="#E0E7FF" opacity="0.7"/>
    <circle cx="920" cy="1200" r="3" fill="#F472B6" opacity="0.8"/>
  </svg>
  `;

  const coverBuffer = await sharp(Buffer.from(coverSvg)).png().toBuffer();

  // 2. Télécharger un son d'ambiance réel de Supabase (ex: inner-peace ou canopy rain)
  const soundUrl = "https://ioeihnoxvtpxtqhxklpw.supabase.co/storage/v1/object/public/story_sounds/inner-peace-339640.mp3";
  const tempAudioPath = path.join(process.cwd(), 'temp_test_audio.mp3');

  console.log(`📥 Téléchargement de la piste sonore : ${soundUrl}...`);
  const res = await fetch(soundUrl);
  if (!res.ok) {
    throw new Error(`Échec téléchargement audio: ${res.statusText}`);
  }
  const audioBuffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(tempAudioPath, audioBuffer);

  // 3. Exécuter le rendu
  const outputVideoPath = path.join(process.cwd(), 'test_instagram_story_output.mp4');

  const result = await renderInstagramStoryVideo({
    title: "Le Secret de l'Île aux Lucioles",
    theme: "🌙 Conte du Soir • Sommeil Profond",
    durationText: "10 min de lecture apaisante",
    excerpt: `Au-delà des collines embrumées, il existait une île secrète où les arbres murmuraient des chansons douces à la nuit tombée.\n\nChaque soir, des milliers de petites lucioles d'or s'éveillaient pour illuminer le sentier des rêves et dissiper les soucis de la journée.\n\nL'air était tiède, embaumé par le parfum de la fleur de lune, invitant chaque enfant et chaque grand à fermer paisiblement les yeux.`,
    coverBuffer,
    audioPath: tempAudioPath,
    outputVideoPath,
    ctaKeyword: "CALMI"
  });

  console.log("🎉 Résultat du test :", result);

  const stats = fs.statSync(outputVideoPath);
  console.log(`📦 Taille de la vidéo générée : ${(stats.size / (1024 * 1024)).toFixed(2)} Mo`);

  // Nettoyage audio temporaire
  if (fs.existsSync(tempAudioPath)) {
    fs.unlinkSync(tempAudioPath);
  }
}

runTest().catch(console.error);
