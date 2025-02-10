
import { z } from 'zod';
import type { FrontendStory, CloudFunctionStory, SharingConfig } from '@/types/shared/story';
import { FrontendStorySchema, SharingSchema } from '@/utils';
import { StoryMetrics } from '@/utils';
import { generateToken } from '@/utils/tokenUtils';

// Types stricts pour la validation
type RequiredPublicAccess = Required<{
  enabled: boolean;
  token: string;
  expiresAt: string;
}>;

type RequiredSharedEmail = Required<{
  email: string;
  sharedAt: string;
  accessCount: number;
}>;

type RequiredKindleDelivery = Required<{
  sentAt: string;
  status: 'pending' | 'sent' | 'failed';
}>;

type RequiredSharingConfig = Required<{
  publicAccess: RequiredPublicAccess;
  sharedEmails: RequiredSharedEmail[];
  kindleDeliveries: RequiredKindleDelivery[];
}>;

function validatePublicAccess(input: unknown): RequiredPublicAccess {
  const defaultAccess: RequiredPublicAccess = {
    enabled: false,
    token: generateToken(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  if (!input || typeof input !== 'object') {
    return defaultAccess;
  }

  const typedInput = input as Partial<RequiredPublicAccess>;
  
  return {
    enabled: typedInput.enabled ?? defaultAccess.enabled,
    token: typedInput.token ?? defaultAccess.token,
    expiresAt: typedInput.expiresAt ?? defaultAccess.expiresAt
  };
}

function validateSharedEmail(input: unknown): RequiredSharedEmail {
  const defaultEmail: RequiredSharedEmail = {
    email: '',
    sharedAt: new Date().toISOString(),
    accessCount: 0
  };

  if (!input || typeof input !== 'object') {
    return defaultEmail;
  }

  const typedInput = input as Partial<RequiredSharedEmail>;

  return {
    email: typedInput.email ?? defaultEmail.email,
    sharedAt: typedInput.sharedAt ?? defaultEmail.sharedAt,
    accessCount: typedInput.accessCount ?? defaultEmail.accessCount
  };
}

function validateKindleDelivery(input: unknown): RequiredKindleDelivery {
  const defaultDelivery: RequiredKindleDelivery = {
    sentAt: new Date().toISOString(),
    status: 'pending' as const
  };

  if (!input || typeof input !== 'object') {
    return defaultDelivery;
  }

  const typedInput = input as Partial<RequiredKindleDelivery>;

  return {
    sentAt: typedInput.sentAt ?? defaultDelivery.sentAt,
    status: (typedInput.status as RequiredKindleDelivery['status']) ?? defaultDelivery.status
  };
}

function createValidSharing(input: unknown): SharingConfig {
  const validConfig: RequiredSharingConfig = {
    publicAccess: validatePublicAccess(input && typeof input === 'object' ? (input as any).publicAccess : null),
    sharedEmails: input && typeof input === 'object' && Array.isArray((input as any).sharedEmails)
      ? (input as any).sharedEmails.map(validateSharedEmail)
      : [],
    kindleDeliveries: input && typeof input === 'object' && Array.isArray((input as any).kindleDeliveries)
      ? (input as any).kindleDeliveries.map(validateKindleDelivery)
      : []
  };

  return SharingSchema.parse(validConfig) as SharingConfig;
}

const ensureCompleteStory = (story: Partial<FrontendStory>): FrontendStory => {
  const defaultStory: FrontendStory = {
    id: '',
    title: '',
    preview: '',
    objective: '',
    childrenIds: [],
    childrenNames: [],
    story_text: '',
    story_summary: '',
    createdAt: new Date().toISOString(),
    status: 'pending',
    authorId: '',
    wordCount: 0,
    _version: 1,
    _lastSync: new Date().toISOString(),
    _pendingWrites: false,
    isFavorite: false,
    tags: [],
    sharing: createValidSharing({})
  };

  const completeStory = {
    ...defaultStory,
    ...story,
    sharing: createValidSharing(story.sharing)
  };

  return FrontendStorySchema.parse(completeStory);
};

export const toFrontendStory = (cloudStory: CloudFunctionStory): FrontendStory => {
  try {
    StoryMetrics.startOperation(cloudStory.id);
    console.log('Starting story transformation:', {
      id: cloudStory.id,
      timestamp: new Date().toISOString()
    });

    const validatedStory = ensureCompleteStory(cloudStory);

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

    const parsedStory = ensureCompleteStory({
      ...story,
      createdAt: new Date(story.createdAt).toISOString(),
      _lastSync: new Date(story._lastSync).toISOString(),
      sharing: {
        ...story.sharing,
        publicAccess: {
          ...story.sharing.publicAccess,
          expiresAt: new Date(story.sharing.publicAccess.expiresAt).toISOString()
        },
        sharedEmails: story.sharing.sharedEmails.map(email => ({
          ...email,
          sharedAt: new Date(email.sharedAt).toISOString()
        })),
        kindleDeliveries: story.sharing.kindleDeliveries.map(delivery => ({
          ...delivery,
          sentAt: new Date(delivery.sentAt).toISOString()
        }))
      }
    });

    console.log('Date parsing completed:', {
      id: story.id,
      status: 'success',
      timestamp: new Date().toISOString()
    });

    StoryMetrics.endOperation(story.id, 'success');
    return parsedStory;
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
