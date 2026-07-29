import { createClient } from '@supabase/supabase-js';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegPath.path);

const supabaseUrl = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tempDir = path.join(os.tmpdir(), 'calmi_audio_video_opt');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

function processAudio(inputPath, outputPath, bitrate = '96k') {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioBitrate(bitrate)
      .audioChannels(2)
      .toFormat('mp3')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

function processVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-crf 28', '-preset faster', '-vf scale=-2:720'])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

async function compressBucketFiles(bucketName, isVideo = false, audioBitrate = '96k') {
  console.log(`\n📦 Optimization du bucket '${bucketName}'...`);
  
  const { data: files, error } = await supabase.storage.from(bucketName).list('', { limit: 1000 });
  if (error || !files) {
    console.error(`❌ Erreur lecture bucket ${bucketName}:`, error);
    return { before: 0, after: 0, count: 0 };
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let count = 0;

  for (let i = 0; i < files.length; i++) {
    const fileObj = files[i];
    const name = fileObj.name;
    const rawSize = fileObj.metadata?.size || 0;

    if (rawSize < 500 * 1024 && !isVideo) {
      totalBefore += rawSize;
      totalAfter += rawSize;
      continue;
    }

    const downloadUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${encodeURIComponent(name)}`;
    const inputFilePath = path.join(tempDir, `in_${Date.now()}_${path.basename(name)}`);
    const outputFilePath = path.join(tempDir, `out_${Date.now()}_${path.basename(name)}`);

    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) continue;

      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(inputFilePath, buffer);

      if (isVideo) {
        await processVideo(inputFilePath, outputFilePath);
      } else {
        await processAudio(inputFilePath, outputFilePath, audioBitrate);
      }

      const optBuffer = fs.readFileSync(outputFilePath);
      const optSize = optBuffer.length;

      if (optSize < rawSize) {
        // Re-upload
        const { error: upErr } = await supabase.storage.from(bucketName).upload(name, optBuffer, {
          contentType: isVideo ? 'video/mp4' : 'audio/mpeg',
          upsert: true
        });

        if (!upErr) {
          count++;
          totalBefore += rawSize;
          totalAfter += optSize;

          const rawMb = (rawSize / (1024 * 1024)).toFixed(2);
          const optMb = (optSize / (1024 * 1024)).toFixed(2);
          const diffPct = (((rawSize - optSize) / rawSize) * 100).toFixed(1);

          console.log(`✅ [${i + 1}/${files.length}] ${name}`);
          console.log(`   ${rawMb} Mo ➡️ ${optMb} Mo (-${diffPct}%)`);
        }
      } else {
        totalBefore += rawSize;
        totalAfter += rawSize;
      }
    } catch (err) {
      console.error(`❌ Erreur [${name}]:`, err.message);
      totalBefore += rawSize;
      totalAfter += rawSize;
    } finally {
      if (fs.existsSync(inputFilePath)) fs.unlinkSync(inputFilePath);
      if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
    }
  }

  return { before: totalBefore, after: totalAfter, count };
}

async function runAllCompressions() {
  console.log(`\n🎧 🎬 Lancement de l'optimisation des buckets audio et vidéo...\n`);

  // 1. story_sounds
  const soundsRes = await compressBucketFiles('story_sounds', false, '96k');

  // 2. audio-files
  const audioRes = await compressBucketFiles('audio-files', false, '64k');

  // 3. storyvideos
  const videoRes = await compressBucketFiles('storyvideos', true);

  const totalSavedBytes = (soundsRes.before - soundsRes.after) + (audioRes.before - audioRes.after) + (videoRes.before - videoRes.after);
  const totalSavedMb = (totalSavedBytes / (1024 * 1024)).toFixed(2);

  console.log(`\n=================================================================================`);
  console.log(`🎉 COMPRESSION AUDIO & VIDÉO TERMINÉE !`);
  console.log(`- Fichiers sons d'ambiance (story_sounds) optimisés : ${soundsRes.count}`);
  console.log(`- Narrations audio (audio-files) optimisées          : ${audioRes.count}`);
  console.log(`- Vidéos d'intros (storyvideos) optimisées           : ${videoRes.count}`);
  console.log(`- Espace disque total économisé                     : ${totalSavedMb} Mo !`);
  console.log(`=================================================================================\n`);
}

runAllCompressions();
