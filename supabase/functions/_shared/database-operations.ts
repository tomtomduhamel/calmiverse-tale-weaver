
// Fonction pour récupérer les données complètes d'une histoire depuis la base de données
export const fetchStoryDataFromDb = async (supabase: any, storyId: string) => {
  try {
    console.log(`Récupération des données complètes pour l'histoire ${storyId}`);
    
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();
      
    if (error) {
      console.error('Erreur lors de la récupération des données de l\'histoire:', error);
      throw new Error(`Erreur lors de la récupération des données: ${error.message}`);
    }
    
    if (!data) {
      throw new Error(`Aucune donnée trouvée pour l'histoire avec l'ID ${storyId}`);
    }
    
    console.log(`Données récupérées avec succès pour l'histoire ${storyId}`);
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des données de l\'histoire:', error);
    throw new Error(`Erreur lors de la récupération des données de l'histoire: ${error.message || 'Erreur inconnue'}`);
  }
};

// Vérification de l'existence d'une histoire dans la base de données
export const checkStoryExists = async (supabase: any, storyId: string) => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('id, status')
      .eq('id', storyId)
      .single();
      
    if (error) {
      console.error('Erreur lors de la vérification de l\'existence de l\'histoire:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error(`L'histoire avec l'ID ${storyId} n'existe pas`);
    }
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'existence de l\'histoire:', error);
    throw new Error(`Erreur lors de la vérification de l'histoire: ${error.message}`);
  }
};

// Mise à jour de l'histoire dans la base de données
export const updateStoryInDb = async (supabase: any, storyId: string, storyData: any) => {
  try {
    console.log(`Mise à jour de l'histoire ${storyId} dans la base de données...`);
    
    const { error } = await supabase
      .from('stories')
      .update({
        title: storyData.title,
        content: storyData.content,
        summary: storyData.summary,
        preview: storyData.preview,
        status: storyData.status,
        error: storyData.error,
        updatedat: new Date().toISOString()
      })
      .eq('id', storyId);

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'histoire dans la base de données:', error);
      throw error;
    }
    
    console.log(`Histoire ${storyId} mise à jour avec succès`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'histoire:', error);
    throw new Error(`Erreur lors de la mise à jour de l'histoire dans la base de données: ${error.message}`);
  }
};
