
import OpenAI from 'openai';
import * as functions from 'firebase-functions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateStoryWithAI = async (objective: string, childrenNames: string[]) => {
  console.log("Début de la génération avec OpenAI");
  console.log("Paramètres reçus:", { objective, childrenNames });
  console.log("Clé API OpenAI présente:", !!process.env.OPENAI_API_KEY);
  
  try {
    console.log("Création de la requête OpenAI");
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
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
- Termine toujours sur une note positive

STRUCTURE CACHÉE (ne pas la rendre visible) :
1. Introduction et mise en contexte :
   - Cadre sécurisant et familier
   - Personnages principaux introduits naturellement
   - Description sensorielle de l'environnement
   - Transition douce

2. Développement de l'ambiance :
   - Descriptions sensorielles riches
   - Éléments naturels ou fantastiques
   - Ton calme et rassurant
   - Métaphores apaisantes

3. Progression de l'histoire :
   - Langage indirect et suggestions positives
   - Introduction de compagnons bienveillants
   - Symboles rassurants
   - Progression naturelle

4. Cœur de l'histoire :
   - Aventure captivante mais apaisante
   - Descriptions immersives
   - Rencontres positives
   - Rythme lent et régulier

5. Conclusion :
   - Renforcement du sentiment de sécurité
   - Phrases rassurantes
   - Transition douce vers l'objectif
   - Message final positif

CONTRAINTES SPÉCIFIQUES :
- Vocabulaire simple et accessible
- Pas de termes liés à l'hypnose
- Grammaire et orthographe impeccables
- Éviter l'excès de superlatifs
- Noms de personnages appropriés
- Univers cohérent et captivant`,
        },
        {
          role: 'user',
          content: `Je souhaite créer une histoire personnalisée pour ${childrenNames} avec l'objectif suivant : ${objective}. 
          L'histoire doit suivre la structure donnée tout en restant fluide et naturelle, sans découpage visible en parties.
          Assure-toi que l'histoire soit captivante dès le début pour maintenir l'attention des enfants.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    console.log("Réponse d'OpenAI reçue");
    console.log("Contenu de la réponse:", completion.choices[0].message);

    const story = completion.choices[0].message.content;
    if (!story) {
      console.error("Erreur: Aucune histoire générée par OpenAI");
      throw new Error('Aucune histoire n\'a été générée');
    }

    console.log("Génération de l'ID unique pour l'histoire");
    const uniqueId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("Formatage des données de l'histoire");
    const storyData = {
      id_stories: uniqueId,
      story_text: story,
      story_summary: "Résumé en cours de génération...",
      status: 'pending',
      createdAt: new Date(),
      title: "Nouvelle histoire",
      preview: story.substring(0, 200) + "..."
    };

    console.log("Données de l'histoire formatées avec succès:", storyData);
    return storyData;
  } catch (error) {
    console.error("Erreur lors de la génération de l'histoire avec OpenAI:", error);
    throw error;
  }
};
