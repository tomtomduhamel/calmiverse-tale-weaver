
/**
 * Utilitaires pour la gestion des sons dans la génération d'histoires
 */

/**
 * Recherche et sélectionne un fond sonore adapté pour un objectif donné
 * @param supabase Client Supabase
 * @param objective Objectif de l'histoire ('sleep', 'focus', 'relax', 'fun')
 * @returns ID du son sélectionné ou null si aucun son adapté
 */
export async function selectSoundForObjective(supabase: any, objective: string): Promise<string | null> {
  try {
    console.log(`🔍 Recherche d'un fond sonore adapté pour l'objectif: ${objective}`);
    
    // Récupérer un son correspondant à l'objectif
    const { data: sounds, error: soundError } = await supabase
      .from('sound_backgrounds')
      .select('id, title, file_path')
      .eq('objective', objective);
    
    if (soundError) {
      console.error("❌ Erreur lors de la recherche de sons:", soundError);
      return null;
    }
    
    if (!sounds || sounds.length === 0) {
      console.log(`⚠️ Aucun fond sonore trouvé pour l'objectif: ${objective}`);
      return null;
    }
    
    // Vérifier que chaque son a un fichier valide
    const validSounds = sounds.filter((sound: { id: string; title: string; file_path: string | null }) => sound.file_path);
    
    if (validSounds.length === 0) {
      console.log(`⚠️ Aucun son avec fichier valide trouvé pour l'objectif: ${objective}`);
      return null;
    }
    
    // Choisir un son aléatoirement parmi ceux valides
    const randomIndex = Math.floor(Math.random() * validSounds.length);
    const selectedSound = validSounds[randomIndex];
    
    console.log(`✅ Fond sonore sélectionné pour l'histoire: 
      ID: ${selectedSound.id}, 
      Titre: ${selectedSound.title}, 
      Fichier: ${selectedSound.file_path}`
    );
    
    return selectedSound.id;
  } catch (soundError) {
    console.error("❌ Erreur lors de la sélection du son:", soundError);
    return null;
  }
}
