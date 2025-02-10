
import { z } from 'zod';

export const DateSchema = z.string().refine((date) => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}, {
  message: "Invalid date format"
});

export const PublicAccessSchema = z.object({
  enabled: z.boolean(),
  token: z.string(),
  expiresAt: DateSchema
});

export const SharedEmailSchema = z.object({
  email: z.string().email(),
  sharedAt: DateSchema,
  accessCount: z.number().int().min(0)
});

export const KindleDeliverySchema = z.object({
  sentAt: DateSchema,
  status: z.enum(['pending', 'sent', 'failed'])
});

export const SharingSchema = z.object({
  publicAccess: PublicAccessSchema,
  sharedEmails: z.array(SharedEmailSchema),
  kindleDeliveries: z.array(KindleDeliverySchema)
});

export const FrontendStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  preview: z.string(),
  objective: z.string(),
  childrenIds: z.array(z.string()),
  childrenNames: z.array(z.string()),
  story_text: z.string(),
  story_summary: z.string(),
  createdAt: DateSchema,
  status: z.enum(['pending', 'completed', 'read']),
  authorId: z.string(),
  wordCount: z.number().int().min(0),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  _version: z.number().int().min(1),
  _lastSync: DateSchema,
  _pendingWrites: z.boolean(),
  sharing: SharingSchema.optional()
});

