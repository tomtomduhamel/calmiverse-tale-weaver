import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ioeihnoxvtpxtqhxklpw.supabase.co";
// Utiliser la clé anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

const supabase = createClient(supabaseUrl, supabaseKey);

async function optimizeImages() {
  const isExecute = process.argv.includes('--execute');
  const maxLimit = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '50', 10);

  console.log(`\n🖼️  Optimisation & Compression des Images Supabase Storage [${isExecute ? 'EXECUTION' : 'SIMULATION'}]`);
  console.log(`=================================================================================\n`);

  console.log("🔍 Récupération de la liste des images dans le bucket 'storyimages'...");
  
  const { data: files, error: listErr } = await supabase.storage.from('storyimages').list('', { limit: 1000 });

  if (listErr || !files) {
    console.error("❌ Erreur lors du listage des images:", listErr);
    return;
  }

  console.log(`- ${files.length} fichiers trouvés dans le bucket 'storyimages'.\n`);

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedCount = 0;

  for (const fileObj of files) {
    if (processedCount >= maxLimit) break;
    const cleanPath = fileObj.name;
    const originalSizeBytes = fileObj.metadata?.size || 0;

    // Ne pas retraiter les images déjà légères (< 250 Ko) et déjà en WebP
    if (cleanPath.endsWith('.webp') && originalSizeBytes < 250 * 1024) {
      continue;
    }

    // Télécharger l'image depuis Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage.from('storyimages').download(cleanPath);

    if (downloadError || !fileData) {
      continue;
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    if (buffer.length === 0) continue;

    try {
      // Optimisation avec sharp : max width 1280px, format WebP qualité 80%
      const optimizedBuffer = await sharp(buffer)
        .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const optimizedSizeBytes = optimizedBuffer.length;
      if (optimizedSizeBytes >= originalSizeBytes) {
        // L'image originale est déjà ultra-optimisée
        continue;
      }

      const reduction = (((originalSizeBytes - optimizedSizeBytes) / originalSizeBytes) * 100).toFixed(1);

      totalOriginalSize += originalSizeBytes;
      totalOptimizedSize += optimizedSizeBytes;
      processedCount++;

      const origMb = (originalSizeBytes / (1024 * 1024)).toFixed(2);
      const optMb = (optimizedSizeBytes / (1024 * 1024)).toFixed(2);

      console.log(`[${processedCount}] ${cleanPath}`);
      console.log(`   Taille originale: ${origMb} Mo ➡️ WebP optimisé: ${optMb} Mo (-${reduction}%)`);

      if (isExecute) {
        // En mode exécution, remplacer l'image sur Supabase Storage
        const { error: uploadErr } = await supabase.storage.from('storyimages').upload(cleanPath, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

        if (uploadErr) {
          console.error(`   ❌ Erreur d'upload pour ${cleanPath}:`, uploadErr.message);
        } else {
          console.log(`   ✅ Mis à jour et compressé sur Supabase Storage.`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Erreur traitement image ${cleanPath}:`, err.message);
    }
  }

  const savedMb = ((totalOriginalSize - totalOptimizedSize) / (1024 * 1024)).toFixed(2);
  console.log(`\n=================================================================================`);
  console.log(`🎉 Bilan (${processedCount} images analysées) :`);
  console.log(`- Taille d'origine : ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} Mo`);
  console.log(`- Taille optimisée : ${(totalOptimizedSize / (1024 * 1024)).toFixed(2)} Mo`);
  console.log(`- Gain potentiel   : ${savedMb} Mo d'espace économisé !`);
  if (!isExecute) {
    console.log(`\nℹ️  Pour appliquer cette compression directement sur Supabase, relancez avec: node scripts/optimize_storage_images.js --execute`);
  }
}

optimizeImages();
