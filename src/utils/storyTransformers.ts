
import { z } from 'zod';
import type { FrontendStory, CloudFunctionStory, SharingConfig } from '@/types/shared/story';
import { FrontendStorySchema, SharingSchema } from '@/utils';
import { StoryMetrics } from '@/utils';
import { generateToken } from '@/utils/tokenUtils';

type PublicAccessConfig = {
  enabled: boolean;
  token: string;
  expiresAt: string;
};

type SharedEmailConfig = {
  email: string;
  sharedAt: string;
  accessCount: number;
};

type KindleDeliveryConfig = {
  sentAt: string;
  status: 'pending' | 'sent' | 'failed';
};

function validatePublicAccess(input: unknown): PublicAccessConfig {
  if (!input || typeof input !== 'object') {
    return {
      enabled: false,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  return {
    enabled: 'enabled' in input ? Boolean(input.enabled) : false,
    token: 'token' in input && typeof input.token === 'string' 
      ? input.token 
      : generateToken(),
    expiresAt: 'expiresAt' in input && typeof input.expiresAt === 'string'
      ? input.expiresAt
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

function validateSharedEmail(input: unknown): SharedEmailConfig {
  if (!input || typeof input !== 'object') {
    return {
      email: '',
      sharedAt: new Date().toISOString(),
      accessCount: 0
    };
  }

  return {
    email: 'email' in input ? String(input.email) : '',
    sharedAt: 'sharedAt' in input ? String(input.sharedAt) : new Date().toISOString(),
    accessCount: 'accessCount' in input ? Number(input.accessCount) : 0
  };
}

function validateKindleDelivery(input: unknown): KindleDeliveryConfig {
  if (!input || typeof input !== 'object') {
    return {
      sentAt: new Date().toISOString(),
      status: 'pending'
    };
  }

  return {
    sentAt: 'sentAt' in input ? String(input.sentAt) : new Date().toISOString(),
    status: 'status' in input && 
      (input.status === 'pending' || input.status === 'sent' || input.status === 'failed')
      ? (input.status as 'pending' | 'sent' | 'failed')
      : 'pending'
  };
}

function createValidSharing(input: unknown): SharingConfig {
  const validInput = input && typeof input === 'object' ? input : {};
  
  const validConfig: SharingConfig = {
    publicAccess: validatePublicAccess('publicAccess' in validInput ? validInput.publicAccess : null),
    sharedEmails: 'sharedEmails' in validInput && Array.isArray(validInput.sharedEmails)
      ? validInput.sharedEmails.map(validateSharedEmail)
      : [],
    kindleDeliveries: 'kindleDeliveries' in validInput && Array.isArray(validInput.kindleDeliveries)
      ? validInput.kindleDeliveries.map(validateKindleDelivery)
      : []
  };

  return SharingSchema.parse(validConfig);
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
