
import type { FrontendStory, CloudFunctionStory } from '@/types/shared/story';

export const toFrontendStory = (cloudStory: CloudFunctionStory): FrontendStory => {
  return {
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
};

export const parseStoryDates = (story: FrontendStory): FrontendStory => {
  return {
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
};
