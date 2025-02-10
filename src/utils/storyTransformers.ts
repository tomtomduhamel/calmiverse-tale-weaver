
import { z } from 'zod';
import type { FrontendStory, CloudFunctionStory } from '@/types/shared/story';
import { FrontendStorySchema } from './storyValidation';

export const toFrontendStory = (cloudStory: CloudFunctionStory): FrontendStory => {
  const story = {
    ...cloudStory,
    sharing: {
      publicAccess: {
        enabled: false,
        token: '',
        expiresAt: new Date().toISOString(),
      },
      sharedEmails: [],
      kindleDeliveries: [],
    },
  };

  try {
    // Validation du type avec Zod
    const validatedStory = FrontendStorySchema.parse(story);
    return validatedStory;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Story validation failed:', error.errors);
    }
    throw error;
  }
};

export const parseStoryDates = (story: FrontendStory): FrontendStory => {
  const parsedStory = {
    ...story,
    createdAt: new Date(story.createdAt).toISOString(),
    _lastSync: new Date(story._lastSync).toISOString(),
    sharing: story.sharing ? {
      ...story.sharing,
      publicAccess: {
        ...story.sharing.publicAccess,
        expiresAt: new Date(story.sharing.publicAccess.expiresAt).toISOString(),
      },
      sharedEmails: story.sharing.sharedEmails.map(email => ({
        ...email,
        sharedAt: new Date(email.sharedAt).toISOString(),
      })),
      kindleDeliveries: story.sharing.kindleDeliveries.map(delivery => ({
        ...delivery,
        sentAt: new Date(delivery.sentAt).toISOString(),
      })),
    } : undefined,
  };

  try {
    // Validation du type avec Zod
    const validatedStory = FrontendStorySchema.parse(parsedStory);
    return validatedStory;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Story date parsing validation failed:', error.errors);
    }
    throw error;
  }
};

