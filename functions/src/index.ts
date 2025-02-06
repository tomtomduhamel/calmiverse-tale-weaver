
import * as admin from 'firebase-admin';
import { uploadEpub } from './handlers/uploadHandler';
import { generateStory } from './handlers/storyHandler';

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

export {
  uploadEpub,
  generateStory
};
