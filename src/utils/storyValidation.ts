
import { z } from 'zod';

export const DateSchema = z.string().refine((date) => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime()) && date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/);
}, {
  message: "La date doit être au format ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)"
});

const EmailSchema = z.string().email().refine((email) => {
  return email.length <= 255 && email.includes('.');
}, {
  message: "Format d'email invalide ou trop long"
});

const TokenSchema = z.string().min(32).max(64).regex(/^[a-zA-Z0-9_-]+$/, {
  message: "Le token doit contenir uniquement des caractères alphanumériques, tirets et underscores"
});

export const PublicAccessSchema = z.object({
  enabled: z.boolean(),
  token: TokenSchema,
  expiresAt: DateSchema,
}).strict();

export const SharedEmailSchema = z.object({
  email: EmailSchema,
  sharedAt: DateSchema,
  accessCount: z.number().int().min(0).max(1000)
}).strict();

export const KindleDeliverySchema = z.object({
  sentAt: DateSchema,
  status: z.enum(['pending', 'sent', 'failed'])
}).strict();

export const SharingSchema = z.object({
  publicAccess: PublicAccessSchema,
  sharedEmails: z.array(SharedEmailSchema).max(50),
  kindleDeliveries: z.array(KindleDeliverySchema).max(10)
}).strict();

export const FrontendStorySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  preview: z.string().max(500),
  objective: z.string().min(10).max(1000),
  childrenIds: z.array(z.string().uuid()),
  childrenNames: z.array(z.string().min(1).max(50)),
  story_text: z.string().min(100),
  story_summary: z.string().min(10).max(2000),
  createdAt: DateSchema,
  status: z.enum(['pending', 'completed', 'read']),
  authorId: z.string().uuid(),
  wordCount: z.number().int().min(0).max(50000),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  _version: z.number().int().min(1),
  _lastSync: DateSchema,
  _pendingWrites: z.boolean(),
  sharing: SharingSchema.optional()
}).strict().refine((data) => {
  return data.childrenIds.length === data.childrenNames.length;
}, {
  message: "Le nombre d'IDs d'enfants doit correspondre au nombre de noms d'enfants"
});
