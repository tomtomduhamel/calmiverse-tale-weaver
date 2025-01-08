import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Story } from '@/types/story';

export const generateEpub = async (story: Story): Promise<Blob> => {
  // Create a simple HTML structure for the story
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${story.title}</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>${story.title}</h1>
        ${story.story_text.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
      </body>
    </html>
  `;

  // Convert HTML to Blob
  return new Blob([htmlContent], { type: 'text/html' });
};

export const uploadEpubToStorage = async (storyId: string, epubBlob: Blob): Promise<string> => {
  const storage = getStorage();
  const epubRef = ref(storage, `stories/${storyId}.html`);
  
  await uploadBytes(epubRef, epubBlob);
  const downloadURL = await getDownloadURL(epubRef);
  
  const storyRef = doc(db, 'stories', storyId);
  await updateDoc(storyRef, {
    epubFile: downloadURL
  });
  
  return downloadURL;
};