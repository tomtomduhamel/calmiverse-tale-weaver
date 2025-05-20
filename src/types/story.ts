
export interface Story {
  id: string;
  id_stories?: string;
  title: string;
  preview: string;
  objective: string | { name: string; value: string };
  childrenIds: string[];
  childrenNames?: string[];
  createdAt: Date;
  status: 'pending' | 'ready' | 'read' | 'error';
  story_text: string;
  story_summary: string;
  authorId?: string;
  sharedWith?: string[];
  _version?: number;
  _lastSync?: any;
  _pendingWrites?: boolean;
  sharing?: {
    publicAccess: {
      enabled: boolean;
      token: string;
      expiresAt: Date;
    };
    sharedEmails: {
      email: string;
      sharedAt: Date;
      accessCount: number;
    }[];
    kindleDeliveries: {
      sentAt: Date;
      status: 'pending' | 'sent' | 'failed';
    }[];
  };
  error?: string;
  tags?: string[];
  isFavorite?: boolean;
  updatedAt?: Date;
}

export interface Objective {
  id: string;
  label: string;
  value: string;
}
