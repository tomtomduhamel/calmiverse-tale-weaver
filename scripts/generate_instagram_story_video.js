import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import { createClient } from '@supabase/supabase-js';

ffmpeg.setFfmpegPath(ffmpegPath.path);

const SUPABASE_URL = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const WIDTH = 1080;
const HEIGHT = 1920;

/**
 * Nettoie et formate le texte pour le rendu SVG
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Découpe un texte long en lignes adaptées à la largeur SVG
 */
function wrapText(text, maxCharsPerLine = 38) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Génère la carte de couverture (Slide 1 : 0-5s)
 */
async function generateCoverFrame({ title, theme, durationText, coverBuffer, outputPath }) {
  // Redimensionner et recadrer l'image de couverture
  const resizedCover = await sharp(coverBuffer)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
    .toBuffer();

  const titleLines = wrapText(title, 24);
  const titleSvgTspans = titleLines
    .map((line, i) => `<tspan x="540" dy="${i === 0 ? 0 : 54}">${escapeXml(line)}</tspan>`)
    .join('');

  const svgOverlay = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="topShadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(10, 15, 30, 0.85)" />
        <stop offset="100%" stop-color="rgba(10, 15, 30, 0)" />
      </linearGradient>
      <linearGradient id="bottomShadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(10, 15, 30, 0)" />
        <stop offset="60%" stop-color="rgba(10, 15, 30, 0.7)" />
        <stop offset="100%" stop-color="rgba(10, 15, 30, 0.95)" />
      </linearGradient>
      <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#4F46E5" />
        <stop offset="100%" stop-color="#8B5CF6" />
      </linearGradient>
    </defs>

    <!-- Ombrages supérieur et inférieur pour contraste -->
    <rect x="0" y="0" width="${WIDTH}" height="320" fill="url(#topShadow)" />
    <rect x="0" y="1100" width="${WIDTH}" height="820" fill="url(#bottomShadow)" />

    <!-- Badge Header -->
    <g transform="translate(540, 140)">
      <rect x="-240" y="-30" width="480" height="60" rx="30" fill="rgba(15, 23, 42, 0.8)" stroke="#818CF8" stroke-width="2"/>
      <text x="0" y="8" fill="#F8FAFC" font-size="24" font-weight="bold" font-family="sans-serif" text-anchor="middle" letter-spacing="2">
        ${escapeXml(theme.toUpperCase())}
      </text>
    </g>

    <!-- Carte de Titre Inférieure -->
    <g transform="translate(540, 1420)">
      <rect x="-460" y="-180" width="920" height="360" rx="36" fill="rgba(15, 23, 42, 0.88)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2"/>
      
      <!-- Titre de l'histoire -->
      <text x="0" y="-70" fill="#FFFFFF" font-size="44" font-weight="900" font-family="sans-serif" text-anchor="middle">
        ${titleSvgTspans}
      </text>

      <!-- Badge Durée -->
      <rect x="-170" y="45" width="340" height="48" rx="24" fill="rgba(99, 102, 241, 0.3)" stroke="#6366F1" stroke-width="1.5" />
      <text x="0" y="78" fill="#E0E7FF" font-size="22" font-weight="bold" font-family="sans-serif" text-anchor="middle">
        ⏱️ ${escapeXml(durationText)}
      </text>

      <!-- Hint swipe -->
      <text x="0" y="145" fill="#94A3B8" font-size="20" font-family="sans-serif" text-anchor="middle" letter-spacing="1">
        L'histoire commence dans un instant...
      </text>
    </g>
  </svg>
  `;

  await sharp(resizedCover)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .toFile(outputPath);

  return outputPath;
}

/**
 * Génère les pages de lecture du conte (Slide 2 : 5-48s)
 */
async function generateReadingPages({ coverBuffer, paragraphs, theme, outputDir }) {
  // Fond flouté pour atmosphère sereine
  const blurredBg = await sharp(coverBuffer)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
    .blur(35)
    .modulate({ brightness: 0.45, saturation: 1.2 })
    .toBuffer();

  const pagePaths = [];

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const pText = paragraphs[pIdx];
    const lines = wrapText(pText, 34);
    
    const textTspans = lines
      .map((line, i) => `<tspan x="540" dy="${i === 0 ? 0 : 56}">${escapeXml(line)}</tspan>`)
      .join('');

    const pageSvg = `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(15, 23, 42, 0.92)" />
          <stop offset="100%" stop-color="rgba(30, 41, 59, 0.94)" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Header minimaliste -->
      <g transform="translate(540, 130)">
        <text x="0" y="0" fill="#CBD5E1" font-size="20" font-weight="600" font-family="sans-serif" text-anchor="middle" letter-spacing="3">
          🌙 CALMI • LECTURE APAISANTE
        </text>
        <line x1="-120" y1="20" x2="120" y2="20" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
      </g>

      <!-- Carte de lecture centrale frosted-glass -->
      <g transform="translate(540, 960)">
        <rect x="-470" y="-620" width="940" height="1240" rx="44" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="2.5"/>
        
        <!-- Étoile subtile en tête de page -->
        <text x="0" y="-530" fill="#FCD34D" font-size="32" text-anchor="middle">✨</text>

        <!-- Contenu du paragraphe -->
        <text x="0" y="-410" fill="#F8FAFC" font-size="34" font-weight="500" font-family="sans-serif" text-anchor="middle">
          ${textTspans}
        </text>

        <!-- Indicateur de son d'ambiance en bas de carte -->
        <g transform="translate(0, 520)">
          <rect x="-180" y="-26" width="360" height="52" rx="26" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1"/>
          <text x="0" y="8" fill="#94A3B8" font-size="18" font-family="sans-serif" text-anchor="middle">
            🎧 Écoutez avec le son d'ambiance
          </text>
        </g>
      </g>

      <!-- Indicateur de pagination -->
      <g transform="translate(540, 1820)">
        <text x="0" y="0" fill="rgba(255,255,255,0.5)" font-size="18" font-family="sans-serif" text-anchor="middle">
          Page ${pIdx + 1} / ${paragraphs.length}
        </text>
      </g>
    </svg>
    `;

    const pagePath = path.join(outputDir, `page_${pIdx + 1}.png`);
    await sharp(blurredBg)
      .composite([{ input: Buffer.from(pageSvg), top: 0, left: 0 }])
      .toFile(pagePath);

    pagePaths.push(pagePath);
  }

  return pagePaths;
}

/**
 * Génère la carte de fin Cliffhanger & CTA (Slide 3 : 48-60s)
 */
async function generateOutroFrame({ ctaKeyword = 'CALMI', outputPath }) {
  const svgOutro = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="50%" stop-color="#1E1B4B" />
        <stop offset="100%" stop-color="#090D16" />
      </linearGradient>
      <linearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#6366F1" />
        <stop offset="50%" stop-color="#8B5CF6" />
        <stop offset="100%" stop-color="#EC4899" />
      </linearGradient>
      <linearGradient id="glowBtn" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#818CF8" />
        <stop offset="100%" stop-color="#C084FC" />
      </linearGradient>
    </defs>

    <!-- Fond dégradé cosmique -->
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)" />

    <!-- Particules d'étoiles lumineuses -->
    <circle cx="180" cy="240" r="3" fill="#FFFFFF" opacity="0.8" />
    <circle cx="880" cy="320" r="4" fill="#FCD34D" opacity="0.9" />
    <circle cx="260" cy="880" r="2.5" fill="#FFFFFF" opacity="0.6" />
    <circle cx="820" cy="1150" r="3" fill="#A5B4FC" opacity="0.8" />
    <circle cx="150" cy="1600" r="3.5" fill="#F472B6" opacity="0.7" />

    <!-- Carte centrale d'appel à l'action -->
    <g transform="translate(540, 960)">
      <rect x="-460" y="-600" width="920" height="1200" rx="44" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(139, 92, 246, 0.4)" stroke-width="2.5"/>

      <!-- Icône Lune -->
      <g transform="translate(0, -460)">
        <circle cx="0" cy="0" r="60" fill="rgba(139, 92, 246, 0.2)" stroke="#A78BFA" stroke-width="2"/>
        <text x="0" y="20" font-size="52" text-anchor="middle">🌙</text>
      </g>

      <!-- Accroche Cliffhanger -->
      <text x="0" y="-320" fill="#FFFFFF" font-size="44" font-weight="900" font-family="sans-serif" text-anchor="middle">
        Envie de connaître
      </text>
      <text x="0" y="-260" fill="#FCD34D" font-size="44" font-weight="900" font-family="sans-serif" text-anchor="middle">
        la suite de l'histoire ?
      </text>

      <!-- Description de l'app -->
      <text x="0" y="-150" fill="#E2E8F0" font-size="28" font-weight="500" font-family="sans-serif" text-anchor="middle">
        Écoutez ce conte en entier avec
      </text>
      <text x="0" y="-105" fill="#E2E8F0" font-size="28" font-weight="500" font-family="sans-serif" text-anchor="middle">
        nos voix douces et paysages sonores 3D.
      </text>

      <!-- Badge de fonctionnalités -->
      <g transform="translate(0, 10)">
        <rect x="-380" y="-40" width="760" height="80" rx="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)"/>
        <text x="0" y="10" fill="#CBD5E1" font-size="22" font-family="sans-serif" text-anchor="middle">
          🎙️ Multi-voix • 🎧 Bruits relaxants • 😴 Sommeil
        </text>
      </g>

      <!-- Bouton d'action principal -->
      <g transform="translate(0, 220)">
        <rect x="-380" y="-60" width="760" height="120" rx="36" fill="url(#btnGrad)" />
        <text x="0" y="-6" fill="#FFFFFF" font-size="30" font-weight="bold" font-family="sans-serif" text-anchor="middle" letter-spacing="1">
          RÉPONDEZ « ${escapeXml(ctaKeyword)} » EN DM
        </text>
        <text x="0" y="32" fill="#FCE7F3" font-size="20" font-family="sans-serif" text-anchor="middle">
          Pour recevoir l'histoire complète + accès gratuit
        </text>
      </g>

      <!-- Footer CTA -->
      <g transform="translate(0, 440)">
        <text x="0" y="0" fill="#94A3B8" font-size="22" font-family="sans-serif" text-anchor="middle">
          ou cliquez sur le sticker en story 📲
        </text>
      </g>
    </g>

    <!-- Logo / Brand Calmi en bas -->
    <g transform="translate(540, 1830)">
      <text x="0" y="0" fill="#64748B" font-size="20" font-weight="600" font-family="sans-serif" text-anchor="middle" letter-spacing="4">
        CALMI • APPLICATION BIEN-ÊTRE &amp; CONTES
      </text>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(svgOutro))
    .toFile(outputPath);

  return outputPath;
}

/**
 * Assemble toutes les images et la piste audio d'ambiance avec FFmpeg en vidéo 9:16 MP4
 */
export async function renderInstagramStoryVideo({
  title,
  theme = '🌙 Conte du Soir',
  durationText = '10 min de lecture',
  excerpt,
  coverBuffer,
  audioPath,
  outputVideoPath,
  ctaKeyword = 'CALMI'
}) {
  const tempDir = path.join(os.tmpdir(), `calmi_ig_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    console.log(`🎬 Début de génération de la story vidéo Instagram : "${title}"...`);

    // 1. Découper le texte en 3 à 4 paragraphes courts et lisibles
    const rawParagraphs = excerpt
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 20);

    const paragraphs = rawParagraphs.length > 0 ? rawParagraphs.slice(0, 3) : [
      "Il était une fois, niché au cœur d'une forêt ancienne, un lieu où chaque souffle de vent racontait une histoire apaisante.",
      "Les feuilles bruissaient doucement sous la lumière argentée de la lune, invitant chaque esprit fatigué à lâcher prise.",
      "Au loin, le clapotis de l'eau claire berçait les arbres centenaires dans une danse immobile et bienveillante."
    ];

    // 2. Générer les images PNG de haute qualité
    const coverPngPath = path.join(tempDir, 'cover.png');
    await generateCoverFrame({ title, theme, durationText, coverBuffer, outputPath: coverPngPath });

    const readingPagePaths = await generateReadingPages({
      coverBuffer,
      paragraphs,
      theme,
      outputDir: tempDir
    });

    const outroPngPath = path.join(tempDir, 'outro.png');
    await generateOutroFrame({ ctaKeyword, outputPath: outroPngPath });

    // 3. Calculer les durées de chaque séquence (Total = 55s à 60s)
    // Cover: 5s
    // Reading pages: 14s par page (ex: 3 pages = 42s)
    // Outro: 10s
    // Total = 5s + 42s + 10s = 57s
    const coverDuration = 5;
    const pageDuration = Math.max(10, Math.floor(42 / readingPagePaths.length));
    const outroDuration = 10;
    const totalDuration = coverDuration + (pageDuration * readingPagePaths.length) + outroDuration;

    console.log(`⏱️ Plan de timeline : Cover(${coverDuration}s) + ${readingPagePaths.length} Pages(${pageDuration}s/page) + Outro(${outroDuration}s) = ${totalDuration}s`);

    // 4. Créer le fichier de concaténation FFmpeg pour le diaporama vidéo fluide
    const concatTxtPath = path.join(tempDir, 'slides.txt');
    let concatContent = '';
    
    concatContent += `file '${coverPngPath.replace(/\\/g, '/')}'\n`;
    concatContent += `duration ${coverDuration}\n`;

    for (const pagePath of readingPagePaths) {
      concatContent += `file '${pagePath.replace(/\\/g, '/')}'\n`;
      concatContent += `duration ${pageDuration}\n`;
    }

    concatContent += `file '${outroPngPath.replace(/\\/g, '/')}'\n`;
    concatContent += `duration ${outroDuration}\n`;
    concatContent += `file '${outroPngPath.replace(/\\/g, '/')}'\n`; // FFmpeg concat require last image repeat

    fs.writeFileSync(concatTxtPath, concatContent);

    // 5. Assembler avec FFmpeg : Diaporama 1080x1920 + Audio en boucle avec fade in/out
    await new Promise((resolve, reject) => {
      let command = ffmpeg()
        .input(concatTxtPath)
        .inputOptions(['-f concat', '-safe 0'])
        .input(audioPath)
        .inputOptions(['-stream_loop -1']) // Boucle infinie du son d'ambiance
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-r 30',
          '-c:a aac',
          '-b:a 192k',
          '-ar 44100',
          `-t ${totalDuration}`,
          '-filter_complex', `[1:a]afade=t=in:st=0:d=2,afade=t=out:st=${totalDuration - 2}:d=2[aout]`,
          '-map 0:v',
          '-map [aout]',
          '-movflags +faststart'
        ])
        .output(outputVideoPath)
        .on('start', (cmd) => console.log('FFmpeg running:', cmd))
        .on('end', () => {
          console.log(`✅ Vidéo générée avec succès : ${outputVideoPath}`);
          resolve(outputVideoPath);
        })
        .on('error', (err) => {
          console.error('❌ Erreur FFmpeg:', err);
          reject(err);
        });

      command.run();
    });

    return {
      videoPath: outputVideoPath,
      durationSeconds: totalDuration,
      width: WIDTH,
      height: HEIGHT
    };

  } finally {
    // Nettoyer les fichiers temporaires sauf la vidéo finale
    try {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        if (!file.endsWith('.mp4')) {
          fs.unlinkSync(path.join(tempDir, file));
        }
      }
      fs.rmdirSync(tempDir);
    } catch (e) {
      // ignore cleanup errors
    }
  }
}
