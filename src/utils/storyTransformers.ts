
import { z } from 'zod';
import type { FrontendStory, CloudFunctionStory } from '@/types/shared/story';
import { FrontendStorySchema } from '@/utils';
import { StoryMetrics } from '@/utils';
import { generateToken } from '@/utils/tokenUtils';

// Simple, complete types for sharing configuration
const DEFAULT_SHARING = {
  publicAccess: {
    enabled: false,
    token: generateToken(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  sharedEmails: [],
  kindleDeliveries: [],
} as const;

export const toFrontendStory = (cloudStory: CloudFunctionStory): FrontendStory => {
  try {
    StoryMetrics.startOperation(cloudStory.id);
    console.log('Starting story transformation:', {
      id: cloudStory.id,
      timestamp: new Date().toISOString()
    });

    // If no sharing data, return story without sharing
    if (!cloudStory.sharing) {
      const story = { ...cloudStory };
      return FrontendStorySchema.parse(story);
    }

    // If sharing exists, ensure complete structure
    const story: FrontendStory = {
      ...cloudStory,
      sharing: {
        publicAccess: {
          enabled: cloudStory.sharing.publicAccess?.enabled ?? DEFAULT_SHARING.publicAccess.enabled,
          token: cloudStory.sharing.publicAccess?.token ?? DEFAULT_SHARING.publicAccess.token,
          expiresAt: cloudStory.sharing.publicAccess?.expiresAt ?? DEFAULT_SHARING.publicAccess.expiresAt,
        },
        sharedEmails: cloudStory.sharing.sharedEmails ?? DEFAULT_SHARING.sharedEmails,
        kindleDeliveries: cloudStory.sharing.kindleDeliveries ?? DEFAULT_SHARING.kindleDeliveries,
      },
    };

    console.log('Story transformation completed:', {
      id: cloudStory.id,
      status: 'success',
      timestamp: new Date().toISOString()
    });

    const validatedStory = FrontendStorySchema.parse(story);
    StoryMetrics.endOperation(cloudStory.id, 'success');
    return validatedStory;
  } catch (error) {
    console.error('Story transformation failed:', {
      id: cloudStory.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      StoryMetrics.addProcessingStep(cloudStory.id, 'validation', 'error');
    }

    StoryMetrics.endOperation(cloudStory.id, 'error');
    throw error;
  }
};

export const parseStoryDates = (story: FrontendStory): FrontendStory => {
  try {
    StoryMetrics.startOperation(story.id);
    console.log('Starting date parsing:', {
      id: story.id,
      timestamp: new Date().toISOString()
    });

    // Parse dates for base story fields
    const parsedStory: FrontendStory = {
      ...story,
      createdAt: new Date(story.createdAt).toISOString(),
      _lastSync: new Date(story._lastSync).toISOString(),
    };

    // If sharing exists, parse its dates
    if (story.sharing) {
      parsedStory.sharing = {
        publicAccess: {
          enabled: story.sharing.publicAccess.enabled,
          token: story.sharing.publicAccess.token,
          expiresAt: new Date(story.sharing.publicAccess.expiresAt).toISOString(),
        },
        sharedEmails: story.sharing.sharedEmails.map(email => ({
          email: email.email,
          sharedAt: new Date(email.sharedAt).toISOString(),
          accessCount: email.accessCount,
        })),
        kindleDeliveries: story.sharing.kindleDeliveries.map(delivery => ({
          sentAt: new Date(delivery.sentAt).toISOString(),
          status: delivery.status,
        })),
      };
    }

    console.log('Parsed dates story before validation:', {
      id: story.id,
      hasSharing: Boolean(parsedStory.sharing),
      timestamp: new Date().toISOString()
    });

    const validatedStory = FrontendStorySchema.parse(parsedStory);

    console.log('Date parsing completed:', {
      id: story.id,
      status: 'success',
      timestamp: new Date().toISOString()
    });

    StoryMetrics.endOperation(story.id, 'success');
    return validatedStory;
  } catch (error) {
    console.error('Date parsing failed:', {
      id: story.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      StoryMetrics.addProcessingStep(story.id, 'validation', 'error');
    }

    StoryMetrics.endOperation(story.id, 'error');
    throw error;
  }
};
