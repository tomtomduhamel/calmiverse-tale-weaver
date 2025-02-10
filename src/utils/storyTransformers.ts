
import { z } from 'zod';
import type { FrontendStory, CloudFunctionStory, SharingConfig } from '@/types/shared/story';
import { FrontendStorySchema } from '@/utils';
import { StoryMetrics } from '@/utils';
import { generateToken } from '@/utils/tokenUtils';

const DEFAULT_SHARING_CONFIG: SharingConfig = {
  publicAccess: {
    enabled: false,
    token: 'default_token_12345678901234567890123456789012',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  sharedEmails: [],
  kindleDeliveries: [],
} as const;

// Type strict pour la configuration du partage après transformation
type CompleteSharingConfig = {
  publicAccess: {
    enabled: boolean;
    token: string;
    expiresAt: string;
  };
  sharedEmails: {
    email: string;
    sharedAt: string;
    accessCount: number;
  }[];
  kindleDeliveries: {
    sentAt: string;
    status: 'pending' | 'sent' | 'failed';
  }[];
};

type StorySharingTransform = Omit<FrontendStory, 'sharing'> & {
  sharing?: CompleteSharingConfig;
};

const validateAndCompleteSharingConfig = (sharing: Partial<SharingConfig> | undefined): CompleteSharingConfig => {
  if (!sharing) return DEFAULT_SHARING_CONFIG;

  return {
    publicAccess: {
      enabled: sharing.publicAccess?.enabled ?? DEFAULT_SHARING_CONFIG.publicAccess.enabled,
      token: sharing.publicAccess?.token ?? generateToken(),
      expiresAt: sharing.publicAccess?.expiresAt ?? DEFAULT_SHARING_CONFIG.publicAccess.expiresAt,
    },
    sharedEmails: sharing.sharedEmails ?? DEFAULT_SHARING_CONFIG.sharedEmails,
    kindleDeliveries: sharing.kindleDeliveries ?? DEFAULT_SHARING_CONFIG.kindleDeliveries,
  };
};

const transformToStorySharingTransform = (story: CloudFunctionStory): StorySharingTransform => {
  return {
    ...story,
    sharing: story.sharing 
      ? validateAndCompleteSharingConfig(story.sharing)
      : undefined
  };
};

export const toFrontendStory = (cloudStory: CloudFunctionStory): FrontendStory => {
  try {
    StoryMetrics.startOperation(cloudStory.id);
    console.log('Starting story transformation:', {
      id: cloudStory.id,
      timestamp: new Date().toISOString()
    });

    // Première étape : validation et complétion des données
    const transformedStory = transformToStorySharingTransform(cloudStory);

    // Deuxième étape : application des valeurs par défaut si nécessaire
    const story: FrontendStory = {
      ...transformedStory,
      sharing: transformedStory.sharing ?? DEFAULT_SHARING_CONFIG,
    };

    console.log('Transformed story before validation:', {
      id: story.id,
      hasSharing: Boolean(story.sharing),
      timestamp: new Date().toISOString()
    });

    const validatedStory = FrontendStorySchema.parse(story);

    console.log('Story transformation completed:', {
      id: cloudStory.id,
      status: 'success',
      timestamp: new Date().toISOString()
    });

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

    const transformedStory = transformToStorySharingTransform(story);
    
    const parsedStory: FrontendStory = {
      ...transformedStory,
      createdAt: new Date(story.createdAt).toISOString(),
      _lastSync: new Date(story._lastSync).toISOString(),
      sharing: story.sharing ? {
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
      } : DEFAULT_SHARING_CONFIG,
    };

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

