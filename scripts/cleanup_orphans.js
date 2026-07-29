import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error("❌ Key Supabase non trouvée.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runCleanup() {
  const isExecute = process.argv.includes('--execute');
  const mode = isExecute ? 'EXECUTION (Suppression réelle)' : 'DRY-RUN (Simulation)';

  console.log(`\n🧹 Nettoyage des fichiers orphelins Supabase Storage [${mode}]`);
  console.log(`=================================================================\n`);

  // 1. Charger tous les chemins référencés en BDD
  console.log("🔍 Analyse des références en base de données...");

  const { data: stories } = await supabase.from('stories').select('image_path, video_path');
  const { data: series } = await supabase.from('story_series').select('image_path');
  const { data: audioFiles } = await supabase.from('audio_files').select('audio_url');
  const { data: sounds } = await supabase.from('sound_backgrounds').select('file_path');

  const validImagePaths = new Set([
    ...(stories || []).map(s => s.image_path).filter(Boolean),
    ...(series || []).map(s => s.image_path).filter(Boolean)
  ]);

  const validSoundPaths = new Set([
    ...(sounds || []).map(s => s.file_path).filter(Boolean)
  ]);

  console.log(`- Images référencées dans les histoires : ${validImagePaths.size}`);
  console.log(`- Sons référencés dans sound_backgrounds : ${validSoundPaths.size}`);

  // 2. Vérifier bucket storyimages
  console.log("\n📦 Analyse du bucket 'storyimages'...");
  const { data: imageObjects, error: imgError } = await supabase.storage.from('storyimages').list('', { limit: 1000 });

  if (imgError) {
    console.error("Erreur lecture storyimages:", imgError);
  } else {
    const orphanImages = imageObjects.filter(obj => !validImagePaths.has(obj.name));
    const totalBytes = orphanImages.reduce((sum, obj) => sum + (obj.metadata?.size || 0), 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

    console.log(`- Total fichiers : ${imageObjects.length}`);
    console.log(`- Fichiers orphelins détectés : ${orphanImages.length} (${totalMb} Mo)`);

    if (orphanImages.length > 0) {
      if (isExecute) {
        console.log("🔥 Suppression des images orphelines en cours...");
        const filesToRemove = orphanImages.map(img => img.name);
        const { error: delError } = await supabase.storage.from('storyimages').remove(filesToRemove);
        if (delError) {
          console.error("❌ Erreur lors de la suppression:", delError);
        } else {
          console.log(`✅ ${orphanImages.length} images orphelines supprimées avec succès ! (${totalMb} Mo libérés)`);
        }
      } else {
        console.log("ℹ️  Mode simulation : Exécutez avec '--execute' pour supprimer réellement ces fichiers.");
      }
    }
  }

  // 3. Vérifier bucket story_sounds
  console.log("\n📦 Analyse du bucket 'story_sounds'...");
  const { data: soundObjects, error: sndError } = await supabase.storage.from('story_sounds').list('', { limit: 1000 });

  if (sndError) {
    console.error("Erreur lecture story_sounds:", sndError);
  } else {
    const orphanSounds = soundObjects.filter(obj => !validSoundPaths.has(obj.name));
    const totalBytes = orphanSounds.reduce((sum, obj) => sum + (obj.metadata?.size || 0), 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

    console.log(`- Total fichiers : ${soundObjects.length}`);
    console.log(`- Fichiers orphelins détectés : ${orphanSounds.length} (${totalMb} Mo)`);

    if (orphanSounds.length > 0 && isExecute) {
      const filesToRemove = orphanSounds.map(snd => snd.name);
      await supabase.storage.from('story_sounds').remove(filesToRemove);
      console.log(`✅ ${orphanSounds.length} sons orphelins supprimés !`);
    }
  }

  console.log("\n✨ Bilan terminé.\n");
}

runCleanup();
