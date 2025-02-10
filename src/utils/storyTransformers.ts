
import { z } from 'zod';
import type { FrontendStory, CloudFunctionStory, SharingConfig } from '@/types/shared/story';
import { FrontendStorySchema, SharingSchema } from '@/utils';
import { StoryMetrics } from '@/utils';
import { generateToken } from '@/utils/tokenUtils';

function normalizePublicAccess(input: Partial<SharingConfig['publicAccess']> | undefined): Required<SharingConfig['publicAccess']> {
  return {
    enabled: input?.enabled ?? false,
    token: input?.token ?? generateToken(),
    expiresAt: input?.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

function normalizeSharedEmail(input: Partial<SharingConfig['sharedEmails'][0]>): Required<SharingConfig['sharedEmails'][0]> {
  return {
    email: input.email ?? '',
    sharedAt: input.sharedAt ?? new Date().toISOString(),
    accessCount: input.accessCount ?? 0
  };
}

function normalizeKindleDelivery(input: Partial<SharingConfig['kindleDeliveries'][0]>): Required<SharingConfig['kindleDeliveries'][0]> {
  return {
    sentAt: input.sentAt ?? new Date().toISOString(),
    status: input.status ?? 'pending'
  };
}

const createValidSharing = (input: Partial<SharingConfig> | undefined): Required<SharingConfig> => {
  const normalizedSharing: Required<SharingConfig> = {
    publicAccess: normalizePublicAccess(input?.publicAccess),
    sharedEmails: (input?.sharedEmails ?? []).map(normalizeSharedEmail),
    kindleDeliveries: (input?.kindleDeliveries ?? []).map(normalizeKindleDelivery)
  };

  return SharingSchema.parse(normalizedSharing);
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
    _pendingWrites: false,
    isFavorite: false,
    tags: [],
    sharing: createValidSharing(undefined)
  };

  const normalizedSharing = createValidSharing(story.sharing);
  
  const completeStory: FrontendStory = {
    ...defaultStory,
    ...story,
    sharing: normalizedSharing
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
