import * as admin from 'firebase-admin';
import { uploadEpub } from './handlers/uploadHandler';
import { generateStory } from './handlers/storyHandler';

admin.initializeApp();

export {
  uploadEpub,
  generateStory
};