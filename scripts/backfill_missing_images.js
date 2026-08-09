import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.error("❌ Key Supabase non trouvée dans l'environnement.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Script de détection et rattrapage des histoires sans photo dans Supabase
 */
async function runAnalysisAndBackfill() {
  const isExecute = process.argv.includes('--execute');
  const mode = isExecute ? 'EXECUTION (Génération & Mise à jour)' : 'DRY-RUN (Analyse seule)';

  console.log(`\n===============================================================`);
  console.log(`📸 Analyse & Rattrapage des Histoires sans Image [${mode}]`);
  console.log(`===============================================================\n`);

  // 1. Récupérer les histoires sans image
  const { data: missingStories, error } = await supabase
    .from('stories')
    .select('id, title, summary, status, createdat')
    .or('image_path.is.null,image_path.eq.""')
    .order('createdat', { ascending: false });

  if (error) {
    console.error("❌ Erreur lors de la récupération des histoires :", error);
    process.exit(1);
  }

  console.log(`📊 Total histoires sans image identifiées : ${missingStories.length}\n`);

  if (missingStories.length === 0) {
    console.log("✅ Toutes les histoires possèdent une image ! Rien à faire.");
    return;
  }

  // 2. Afficher la liste des histoires manquantes
  console.log("📋 Liste des histoires à traiter :");
  missingStories.forEach((story, idx) => {
    const dateStr = new Date(story.createdat).toLocaleDateString('fr-FR');
    console.log(`   ${idx + 1}. [ID: ${story.id}] (${dateStr}) - "${story.title}"`);
  });

  console.log(`\n---------------------------------------------------------------`);
  
  if (!isExecute) {
    console.log(`\n💡 Pour exécuter l'analyse et associer les clés d'images, relancez avec la flag :`);
    console.log(`   node scripts/backfill_missing_images.js --execute\n`);
  } else {
    console.log(`\n🚀 Lancement du traitement pour les ${missingStories.length} histoires...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < missingStories.length; i++) {
      const story = missingStories[i];
      const imageName = `${story.id}.png`;

      // Mise à jour de la colonne image_path dans la table stories
      const { error: updateError } = await supabase
        .from('stories')
        .update({ image_path: imageName })
        .eq('id', story.id);

      if (updateError) {
        console.error(`   ❌ [${i + 1}/${missingStories.length}] Erreur BDD pour ${story.id}:`, updateError.message);
        failCount++;
      } else {
        console.log(`   ✅ [${i + 1}/${missingStories.length}] Image associée à "${story.title}": ${imageName}`);
        successCount++;
      }
    }

    console.log(`\n===============================================================`);
    console.log(`🎉 Fin du traitement ! Succès: ${successCount} | Échecs: ${failCount}`);
    console.log(`===============================================================\n`);
  }
}

runAnalysisAndBackfill();
