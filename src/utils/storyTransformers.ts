
import { z } from 'zod';
import type { FrontendStory, CloudFunctionStory, SharingConfig } from '@/types/shared/story';
import { FrontendStorySchema } from '@/utils';
import { StoryMetrics } from '@/utils';
import { generateToken } from '@/utils/tokenUtils';

const createPublicAccess = (
  source?: Partial<SharingConfig['publicAccess']>
): SharingConfig['publicAccess'] => ({
  enabled: source?.enabled ?? false,
  token: source?.token ?? generateToken(),
  expiresAt: source?.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
});

const DEFAULT_SHARING: SharingConfig = {
  publicAccess: createPublicAccess(),
  sharedEmails: [],
  kindleDeliveries: []
};

export const toFrontendStory = (cloudStory: CloudFunctionStory): FrontendStory => {
  try {
    StoryMetrics.startOperation(cloudStory.id);
    console.log('Starting story transformation:', {
      id: cloudStory.id,
      timestamp: new Date().toISOString()
    });

    // Si pas de sharing, retourner l'histoire sans sharing
    if (!cloudStory.sharing) {
      const story: FrontendStory = {
        id: cloudStory.id,
        title: cloudStory.title || '',
        preview: cloudStory.preview || '',
        objective: cloudStory.objective || '',
        childrenIds: cloudStory.childrenIds || [],
        childrenNames: cloudStory.childrenNames || [],
        story_text: cloudStory.story_text || '',
        story_summary: cloudStory.story_summary || '',
        createdAt: cloudStory.createdAt || new Date().toISOString(),
        status: cloudStory.status || 'pending',
        authorId: cloudStory.authorId || '',
        wordCount: cloudStory.wordCount || 0,
        _version: cloudStory._version || 1,
        _lastSync: cloudStory._lastSync || new Date().toISOString(),
        _pendingWrites: cloudStory._pendingWrites || false
      };
      return FrontendStorySchema.parse(story);
    }

    // Si sharing existe, assurer une structure complète
    const story: FrontendStory = {
      id: cloudStory.id,
      title: cloudStory.title || '',
      preview: cloudStory.preview || '',
      objective: cloudStory.objective || '',
      childrenIds: cloudStory.childrenIds || [],
      childrenNames: cloudStory.childrenNames || [],
      story_text: cloudStory.story_text || '',
      story_summary: cloudStory.story_summary || '',
      createdAt: cloudStory.createdAt || new Date().toISOString(),
      status: cloudStory.status || 'pending',
      authorId: cloudStory.authorId || '',
      wordCount: cloudStory.wordCount || 0,
      _version: cloudStory._version || 1,
      _lastSync: cloudStory._lastSync || new Date().toISOString(),
      _pendingWrites: cloudStory._pendingWrites || false,
      sharing: {
        publicAccess: createPublicAccess(cloudStory.sharing.publicAccess),
        sharedEmails: [...(cloudStory.sharing.sharedEmails || [])],
        kindleDeliveries: [...(cloudStory.sharing.kindleDeliveries || [])]
      }
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

    // Parse les dates pour les champs de base de l'histoire
    const parsedStory: FrontendStory = {
      id: story.id,
      title: story.title,
      preview: story.preview,
      objective: story.objective,
      childrenIds: story.childrenIds,
      childrenNames: story.childrenNames,
      story_text: story.story_text,
      story_summary: story.story_summary,
      createdAt: new Date(story.createdAt).toISOString(),
      status: story.status,
      authorId: story.authorId,
      wordCount: story.wordCount,
      _version: story._version,
      _lastSync: new Date(story._lastSync).toISOString(),
      _pendingWrites: story._pendingWrites
    };

    // Si sharing existe, parse ses dates
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
