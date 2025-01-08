import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateReadingTime } from '@/utils/readingTime';
import type { Story } from '@/types/story';
import EPub from 'epub-gen';

export const generateEpub = async (story: Story): Promise<Blob> => {
  const options = {
    title: story.title,
    author: "Calmi Stories",
    content: [
      {
        title: "Informations",
        data: `
          <h2>Métadonnées</h2>
          <p>Durée de lecture: ${calculateReadingTime(story.story_text)}</p>
          <p>Date de création: ${new Date(story.createdAt).toLocaleString()}</p>
          <p>Objectif: ${typeof story.objective === 'string' ? story.objective : story.objective.value}</p>
        `
      },
      {
        title: "Histoire",
        data: story.story_text.replace(/\n/g, '<br/>')
      }
    ]
  };

  return new Promise((resolve, reject) => {
    const tempFilePath = `temp_${Date.now()}.epub`;
    new EPub(options, tempFilePath).promise
      .then(() => {
        const blob = new Blob([tempFilePath], { type: 'application/epub+zip' });
        resolve(blob);
      })
      .catch(reject);
  });
};

export const uploadEpubToStorage = async (storyId: string, epubBlob: Blob): Promise<string> => {
  const storage = getStorage();
  const epubRef = ref(storage, `epubs/${storyId}.epub`);
  
  await uploadBytes(epubRef, epubBlob);
  const downloadURL = await getDownloadURL(epubRef);
  
  const storyRef = doc(db, 'stories', storyId);
  await updateDoc(storyRef, {
    epubFile: downloadURL
  });
  
  return downloadURL;
};