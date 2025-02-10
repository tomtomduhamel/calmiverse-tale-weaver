
import { z } from 'zod';
import type { FrontendStory, CloudFunctionStory, SharingConfig } from '@/types/shared/story';
import { FrontendStorySchema, SharingSchema } from '@/utils';
import { StoryMetrics } from '@/utils';
import { generateToken } from '@/utils/tokenUtils';

function normalizePublicAccess(input?: Partial<SharingConfig['publicAccess']>): SharingConfig['publicAccess'] {
  return {
    enabled: input?.enabled !== undefined ? Boolean(input.enabled) : false,
    token: String(input?.token || generateToken()),
    expiresAt: String(input?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
  };
}

function normalizeSharedEmail(input?: Partial<SharingConfig['sharedEmails'][0]>): SharingConfig['sharedEmails'][0] {
  return {
    email: String(input?.email || ''),
    sharedAt: String(input?.sharedAt || new Date().toISOString()),
    accessCount: Number(input?.accessCount || 0)
  };
}

function normalizeKindleDelivery(input?: Partial<SharingConfig['kindleDeliveries'][0]>): SharingConfig['kindleDeliveries'][0] {
  return {
    sentAt: String(input?.sentAt || new Date().toISOString()),
    status: (input?.status || 'pending') as 'pending' | 'sent' | 'failed'
  };
}

const createValidSharing = (input?: Partial<SharingConfig>): SharingConfig => {
  const validSharing: SharingConfig = {
    publicAccess: normalizePublicAccess(input?.publicAccess),
    sharedEmails: (input?.sharedEmails || []).map(normalizeSharedEmail),
    kindleDeliveries: (input?.kindleDeliveries || []).map(normalizeKindleDelivery)
  };

  return SharingSchema.parse(validSharing);
};

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
    _pendingWrites: false
  };

  const completeStory: FrontendStory = {
    ...defaultStory,
    ...story,
    sharing: story.sharing ? createValidSharing(story.sharing) : undefined
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
      sharing: story.sharing ? {
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
      } : undefined
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
