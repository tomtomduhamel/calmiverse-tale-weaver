import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function batchCompress() {
  console.log(`\n🚀 Lancement de la compression globale des images du bucket 'storyimages'...\n`);

  const { data: files, error: listErr } = await supabase.storage.from('storyimages').list('', { limit: 1000 });

  if (listErr || !files) {
    console.error("❌ Erreur lors de la liste des fichiers:", listErr);
    return;
  }

  console.log(`📂 Total d'images trouvées dans storyimages : ${files.length}\n`);

  let totalBeforeBytes = 0;
  let totalAfterBytes = 0;
  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const fileObj = files[i];
    const name = fileObj.name;
    const origSize = fileObj.metadata?.size || 0;

    // Sauter les images déjà petites (< 250 Ko)
    if (origSize > 0 && origSize < 250 * 1024) {
      skippedCount++;
      totalBeforeBytes += origSize;
      totalAfterBytes += origSize;
      continue;
    }

    const downloadUrl = `${supabaseUrl}/storage/v1/object/public/storyimages/${encodeURIComponent(name)}`;

    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        skippedCount++;
        continue;
      }

      const rawBuffer = Buffer.from(await res.arrayBuffer());
      const rawSize = rawBuffer.length;

      if (rawSize < 250 * 1024) {
        skippedCount++;
        totalBeforeBytes += rawSize;
        totalAfterBytes += rawSize;
        continue;
      }

      // Compression avec Sharp
      const compressedBuffer = await sharp(rawBuffer)
        .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const compressedSize = compressedBuffer.length;

      if (compressedSize >= rawSize) {
        // Déjà optimisée
        skippedCount++;
        totalBeforeBytes += rawSize;
        totalAfterBytes += rawSize;
        continue;
      }

      // Upload de l'image compressée
      const { error: uploadError } = await supabase.storage.from('storyimages').upload(name, compressedBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

      if (uploadError) {
        console.error(`❌ Erreur [${i + 1}/${files.length}] ${name}:`, uploadError.message);
      } else {
        successCount++;
        totalBeforeBytes += rawSize;
        totalAfterBytes += compressedSize;
        const gainPct = (((rawSize - compressedSize) / rawSize) * 100).toFixed(1);
        const rawMb = (rawSize / (1024 * 1024)).toFixed(2);
        const compMb = (compressedSize / (1024 * 1024)).toFixed(2);

        console.log(`✅ [${i + 1}/${files.length}] ${name}`);
        console.log(`   ${rawMb} Mo ➡️ ${compMb} Mo (-${gainPct}%)`);
      }
    } catch (err) {
      console.error(`❌ Erreur traitement [${i + 1}/${files.length}] ${name}:`, err.message);
    }
  }

  const savedMb = ((totalBeforeBytes - totalAfterBytes) / (1024 * 1024)).toFixed(2);
  const totalBeforeMb = (totalBeforeBytes / (1024 * 1024)).toFixed(2);
  const totalAfterMb = (totalAfterBytes / (1024 * 1024)).toFixed(2);

  console.log(`\n=================================================================================`);
  console.log(`🎉 COMPRESSION GLOBALE TERMINÉE !`);
  console.log(`- Images compressées : ${successCount}`);
  console.log(`- Images ignorées (déjà légères) : ${skippedCount}`);
  console.log(`- Taille totale avant : ${totalBeforeMb} Mo`);
  console.log(`- Taille totale après : ${totalAfterMb} Mo`);
  console.log(`- Espace disque économisé : ${savedMb} Mo !`);
  console.log(`=================================================================================\n`);
}

batchCompress();
