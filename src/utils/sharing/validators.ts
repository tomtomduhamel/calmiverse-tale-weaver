
import { generateToken } from '../tokenUtils';
import type { RequiredPublicAccess, RequiredSharedEmail, RequiredKindleDelivery, RequiredSharingConfig } from './types';
import { SharingSchema } from '../storyValidation';
import type { SharingConfig } from '@/types/shared/story';

export function validatePublicAccess(input: unknown): RequiredPublicAccess {
  const defaultAccess: RequiredPublicAccess = {
    enabled: false,
    token: generateToken(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  if (!input || typeof input !== 'object') {
    return defaultAccess;
  }

  const typedInput = input as Partial<RequiredPublicAccess>;
  
  return {
    enabled: typedInput.enabled ?? defaultAccess.enabled,
    token: typedInput.token ?? defaultAccess.token,
    expiresAt: typedInput.expiresAt ?? defaultAccess.expiresAt
  };
}

export function validateSharedEmail(input: unknown): RequiredSharedEmail {
  const defaultEmail: RequiredSharedEmail = {
    email: '',
    sharedAt: new Date().toISOString(),
    accessCount: 0
  };

  if (!input || typeof input !== 'object') {
    return defaultEmail;
  }

  const typedInput = input as Partial<RequiredSharedEmail>;

  return {
    email: typedInput.email ?? defaultEmail.email,
    sharedAt: typedInput.sharedAt ?? defaultEmail.sharedAt,
    accessCount: typedInput.accessCount ?? defaultEmail.accessCount
  };
}

export function validateKindleDelivery(input: unknown): RequiredKindleDelivery {
  const defaultDelivery: RequiredKindleDelivery = {
    sentAt: new Date().toISOString(),
    status: 'pending' as const
  };

  if (!input || typeof input !== 'object') {
    return defaultDelivery;
  }

  const typedInput = input as Partial<RequiredKindleDelivery>;

  return {
    sentAt: typedInput.sentAt ?? defaultDelivery.sentAt,
    status: typedInput.status ?? defaultDelivery.status
  };
}

export function createValidSharing(input: unknown): SharingConfig {
  const inputObj = input && typeof input === 'object' ? input : {};
  
  const validConfig: RequiredSharingConfig = {
    publicAccess: validatePublicAccess((inputObj as any).publicAccess),
    sharedEmails: Array.isArray((inputObj as any).sharedEmails) 
      ? (inputObj as any).sharedEmails.map(validateSharedEmail)
      : [],
    kindleDeliveries: Array.isArray((inputObj as any).kindleDeliveries)
      ? (inputObj as any).kindleDeliveries.map(validateKindleDelivery)
      : []
  };

  return SharingSchema.parse(validConfig);
}
