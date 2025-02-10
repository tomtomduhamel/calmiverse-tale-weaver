
export type RequiredPublicAccess = Required<{
  enabled: boolean;
  token: string;
  expiresAt: string;
}>;

export type RequiredSharedEmail = Required<{
  email: string;
  sharedAt: string;
  accessCount: number;
}>;

export type RequiredKindleDelivery = Required<{
  sentAt: string;
  status: 'pending' | 'sent' | 'failed';
}>;

export type RequiredSharingConfig = Required<{
  publicAccess: RequiredPublicAccess;
  sharedEmails: RequiredSharedEmail[];
  kindleDeliveries: RequiredKindleDelivery[];
}>;
