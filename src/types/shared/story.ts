
export interface BaseStory {
  id: string;
  title: string;
  preview: string;
  objective: string;
  childrenIds: string[];
  childrenNames: string[];
  story_text: string;
  story_summary: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'read';
  authorId: string;
  wordCount: number;
  isFavorite?: boolean;
  tags?: string[];
  _version: number;
  _lastSync: string;
  _pendingWrites: boolean;
}

export interface FrontendStory extends BaseStory {
  sharing?: {
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
}

export interface CloudFunctionStory extends BaseStory {
  retryCount?: number;
  processingTime?: number;
}

