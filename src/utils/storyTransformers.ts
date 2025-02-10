
import { z } from 'zod';
import type { FrontendStory, CloudFunctionStory, SharingConfig } from '@/types/shared/story';
import { FrontendStorySchema } from '@/utils';
import { StoryMetrics } from '@/utils';

const createDefaultSharing = (): SharingConfig => ({
  publicAccess: {
    enabled: false,
    token: 'default_token_12345678901234567890123456789012',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  sharedEmails: [],
  kindleDeliveries: [],
});

export const toFrontendStory = (cloudStory: CloudFunctionStory): FrontendStory => {
  try {
    StoryMetrics.startOperation(cloudStory.id);
    console.log('Starting story transformation:', {
      id: cloudStory.id,
      timestamp: new Date().toISOString()
    });

    const defaultSharing = createDefaultSharing();
    const sharing: SharingConfig = cloudStory.sharing ? {
      publicAccess: {
        enabled: cloudStory.sharing.publicAccess?.enabled ?? defaultSharing.publicAccess.enabled,
        token: cloudStory.sharing.publicAccess?.token ?? defaultSharing.publicAccess.token,
        expiresAt: cloudStory.sharing.publicAccess?.expiresAt ?? defaultSharing.publicAccess.expiresAt,
      },
      sharedEmails: cloudStory.sharing.sharedEmails ?? defaultSharing.sharedEmails,
      kindleDeliveries: cloudStory.sharing.kindleDeliveries ?? defaultSharing.kindleDeliveries,
    } : defaultSharing;

    const story: FrontendStory = {
      id: cloudStory.id,
      title: cloudStory.title,
      preview: cloudStory.preview,
      objective: cloudStory.objective,
      childrenIds: cloudStory.childrenIds,
      childrenNames: cloudStory.childrenNames,
      story_text: cloudStory.story_text,
      story_summary: cloudStory.story_summary,
      createdAt: cloudStory.createdAt,
      status: cloudStory.status,
      authorId: cloudStory.authorId,
      wordCount: cloudStory.wordCount,
      isFavorite: cloudStory.isFavorite,
      tags: cloudStory.tags,
      _version: cloudStory._version,
      _lastSync: cloudStory._lastSync,
      _pendingWrites: cloudStory._pendingWrites,
      sharing: sharing,
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

    const defaultSharing = createDefaultSharing();
    const sharing: SharingConfig = story.sharing ? {
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
    } : defaultSharing;

    const parsedStory: FrontendStory = {
      ...story,
      createdAt: new Date(story.createdAt).toISOString(),
      _lastSync: new Date(story._lastSync).toISOString(),
      sharing: sharing,
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
