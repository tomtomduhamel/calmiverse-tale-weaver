
import { z } from 'zod';
import type { FrontendStory, CloudFunctionStory, SharingConfig } from '@/types/shared/story';
import { FrontendStorySchema, SharingSchema } from '@/utils';
import { StoryMetrics } from '@/utils';
import { generateToken } from '@/utils/tokenUtils';

// Types stricts pour la transformation
type StrictPublicAccess = {
  enabled: boolean;
  token: string;
  expiresAt: string;
};

type StrictSharing = {
  publicAccess: StrictPublicAccess;
  sharedEmails: Array<{
    email: string;
    sharedAt: string;
    accessCount: number;
  }>;
  kindleDeliveries: Array<{
    sentAt: string;
    status: 'pending' | 'sent' | 'failed';
  }>;
};

const createValidSharing = (input?: Partial<SharingConfig>): SharingConfig => {
  // Créer d'abord l'objet complet avec les valeurs par défaut
  const sharing: StrictSharing = {
    publicAccess: {
      enabled: false,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    sharedEmails: [],
    kindleDeliveries: []
  };

  // Appliquer les valeurs d'entrée si elles existent
  if (input?.publicAccess) {
    sharing.publicAccess = {
      ...sharing.publicAccess,
      enabled: input.publicAccess.enabled ?? sharing.publicAccess.enabled,
      token: input.publicAccess.token ?? sharing.publicAccess.token,
      expiresAt: input.publicAccess.expiresAt ?? sharing.publicAccess.expiresAt
    };
  }

  if (input?.sharedEmails) {
    sharing.sharedEmails = input.sharedEmails;
  }

  if (input?.kindleDeliveries) {
    sharing.kindleDeliveries = input.kindleDeliveries;
  }

  // Valider avec Zod avant de retourner
  return SharingSchema.parse(sharing);
};

const ensureCompleteStory = (story: Partial<FrontendStory>): FrontendStory => {
  const completeStory = {
    id: story.id ?? '',
    title: story.title ?? '',
    preview: story.preview ?? '',
    objective: story.objective ?? '',
    childrenIds: story.childrenIds ?? [],
    childrenNames: story.childrenNames ?? [],
    story_text: story.story_text ?? '',
    story_summary: story.story_summary ?? '',
    createdAt: story.createdAt ?? new Date().toISOString(),
    status: story.status ?? 'pending',
    authorId: story.authorId ?? '',
    wordCount: story.wordCount ?? 0,
    _version: story._version ?? 1,
    _lastSync: story._lastSync ?? new Date().toISOString(),
    _pendingWrites: story._pendingWrites ?? false,
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
