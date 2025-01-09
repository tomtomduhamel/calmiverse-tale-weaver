import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Story } from '@/types/story';

const generateHtmlContent = (story: Story): string => {
  console.log("Génération du contenu HTML pour:", story.title);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>${story.title}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
          }
          h1 { text-align: center; margin-bottom: 2rem; }
          .metadata { 
            color: #666;
            font-size: 0.9em;
            margin-bottom: 2rem;
            border-bottom: 1px solid #eee;
            padding-bottom: 1rem;
          }
          .content { margin-top: 2rem; }
          p { margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <h1>${story.title}</h1>
        <div class="metadata">
          <p>Date de création: ${story.createdAt.toLocaleDateString()}</p>
          <p>Objectif: ${typeof story.objective === 'string' ? story.objective : story.objective.value}</p>
          ${story.tags ? `<p>Tags: ${story.tags.join(', ')}</p>` : ''}
        </div>
        <div class="content">
          ${story.story_text.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
        </div>
      </body>
    </html>
  `;

  console.log("Contenu HTML généré avec succès");
  return htmlContent;
};

const createBlob = (htmlContent: string): Blob => {
  console.log("Création du Blob");
  return new Blob([htmlContent], { type: 'text/html' });
};

const uploadToStorage = async (blob: Blob, storyId: string): Promise<string> => {
  console.log("Début de l'upload vers Storage");
  const storage = getStorage();
  const fileName = `stories/${storyId}_${Date.now()}.html`;
  const fileRef = ref(storage, fileName);
  
  await uploadBytes(fileRef, blob);
  const downloadURL = await getDownloadURL(fileRef);
  console.log("Upload terminé, URL:", downloadURL);
  
  return downloadURL;
};

const updateFirestore = async (storyId: string, downloadURL: string): Promise<void> => {
  console.log("Mise à jour Firestore");
  const storyRef = doc(db, 'stories', storyId);
  await updateDoc(storyRef, {
    epubFile: downloadURL,
    lastUpdated: new Date()
  });
  console.log("Document Firestore mis à jour");
};

export const generateAndUploadEpub = async (story: Story): Promise<string> => {
  try {
    console.log("Début du processus de génération et upload");
    
    const htmlContent = generateHtmlContent(story);
    const blob = createBlob(htmlContent);
    const downloadURL = await uploadToStorage(blob, story.id);
    await updateFirestore(story.id, downloadURL);
    
    console.log("Processus terminé avec succès");
    return downloadURL;
  } catch (error) {
    console.error("Erreur lors de la génération/upload:", error);
    throw error;
  }
};