
// Génération de l'histoire avec OpenAI en utilisant fetch directement
export const generateStoryText = async (apiKey: string, objective: string, childrenNames: string[], isRetry = false) => {
  console.log(`Génération du texte de l'histoire avec l'objectif: ${objective} pour: ${childrenNames.join(', ')}`);
  
  try {
    const retryText = isRetry ? "Ceci est une nouvelle tentative, alors essaie une approche différente." : "";
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en création d'histoires pour enfants. 
            
FORMAT DE L'HISTOIRE :
- Longueur : 6000-10000 mots
- Structure narrative fluide et continue, sans découpage visible
- Pas de titre explicite

RÈGLES FONDAMENTALES :
- Adapte le langage à l'âge de l'enfant
- Crée des personnages mémorables et appropriés
- Utilise des dialogues engageants
- Ajoute des répétitions pour les jeunes enfants
- Évite tout contenu effrayant ou angoissant
- Termine toujours sur une note positive`
          },
          {
            role: 'user',
            content: `Je souhaite créer une histoire personnalisée pour ${childrenNames.join(', ')} avec l'objectif suivant : ${objective}. 
            L'histoire doit suivre la structure donnée tout en restant fluide et naturelle, sans découpage visible en parties.
            Assure-toi que l'histoire soit captivante dès le début pour maintenir l'attention des enfants.
            ${retryText}`
          }
        ],
        temperature: isRetry ? 0.8 : 0.7, // Légèrement plus de créativité pour les relances
        max_tokens: 3500,
      }),
    });

    // Vérification de la réponse HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI (HTTP):', response.status, response.statusText, errorData);
      throw new Error(`Erreur API OpenAI (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data || !data.choices || data.choices.length === 0) {
      console.error('Réponse OpenAI invalide:', data);
      throw new Error('Format de réponse OpenAI inattendu');
    }
    
    const storyText = data.choices[0].message?.content;
    
    if (!storyText) {
      throw new Error('Aucune histoire générée par OpenAI');
    }

    console.log('Histoire générée avec succès (longueur):', storyText.length);
    return storyText;
  } catch (error) {
    console.error('Erreur lors de la génération du texte:', error);
    throw new Error(`Erreur lors de la génération de l'histoire: ${error.message || 'Erreur inconnue'}`);
  }
};

// Génération de résumé avec OpenAI
export const generateSummary = async (apiKey: string, storyText: string) => {
  try {
    console.log('Génération du résumé de l\'histoire...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui résume des histoires pour enfants de manière concise.'
          },
          {
            role: 'user',
            content: `Résume cette histoire en 3-4 phrases : ${storyText.substring(0, 2000)}...`
          }
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI (résumé):', response.status, response.statusText, errorData);
      throw new Error(`Erreur API OpenAI pour le résumé (${response.status})`);
    }

    const data = await response.json();
    const summary = data.choices[0].message?.content || "Résumé non disponible";
    
    console.log('Résumé généré avec succès (longueur):', summary.length);
    return summary;
  } catch (error) {
    console.error('Erreur lors de la génération du résumé:', error);
    // En cas d'erreur de résumé, on retourne un résumé par défaut plutôt que d'échouer tout le processus
    return "Un résumé n'a pas pu être généré. L'histoire contient une aventure captivante pour enfants.";
  }
};

// Génération de titre avec OpenAI
export const generateTitle = async (apiKey: string, storyText: string, childrenNames: string[]) => {
  try {
    console.log('Génération du titre de l\'histoire...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui crée des titres captivants pour des histoires pour enfants.'
          },
          {
            role: 'user',
            content: `Crée un titre court et captivant pour cette histoire : ${storyText.substring(0, 1000)}...`
          }
        ],
        temperature: 0.8,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI (titre):', response.status, response.statusText, errorData);
      throw new Error(`Erreur API OpenAI pour le titre (${response.status})`);
    }

    const data = await response.json();
    const title = data.choices[0].message?.content?.replace(/["']/g, '') || `Histoire pour ${childrenNames.join(' et ')}`;
    
    console.log('Titre généré avec succès:', title);
    return title;
  } catch (error) {
    console.error('Erreur lors de la génération du titre:', error);
    // En cas d'erreur de titre, on retourne un titre par défaut plutôt que d'échouer tout le processus
    return `Histoire pour ${childrenNames.join(' et ')}`;
  }
};
