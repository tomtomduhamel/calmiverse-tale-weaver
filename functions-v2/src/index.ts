
import * as admin from 'firebase-admin';
import { generateStory, retryFailedStory } from './handlers/storyHandler';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export the cloud functions
export { generateStory, retryFailedStory };

