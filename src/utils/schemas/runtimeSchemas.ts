import { z } from 'zod';
import type { StoryCritique, DetailedScores, SeverityLevel } from '@/types/critique';

/**
 * Schéma Zod pour valider et assainir les scores détaillés d'une histoire
 */
export const detailedScoresSchema = z.object({
  structure_rythme: z.number().catch(5),
  style_prosodie_oralite: z.number().catch(5),
  personnages_empathie: z.number().catch(5),
  originalite_imaginaire: z.number().catch(5),
  adequation_objectif_age: z.number().catch(5),
  rigueur_technique_calmi: z.number().catch(5),
}).partial().catch({
  structure_rythme: 5,
  style_prosodie_oralite: 5,
  personnages_empathie: 5,
  originalite_imaginaire: 5,
  adequation_objectif_age: 5,
  rigueur_technique_calmi: 5,
});

/**
 * Schéma Zod pour les faiblesses / axes d'amélioration
 */
export const critiqueWeaknessSchema = z.object({
  issue: z.string().default('Point à améliorer'),
  quote: z.string().optional().default(''),
  impact: z.string().default('Impact modéré'),
  severity: z.enum(['critique', 'majeur', 'mineur']).catch('mineur'),
});

/**
 * Schéma Zod pour les points forts
 */
export const critiqueStrengthSchema = z.object({
  aspect: z.string().default('Point fort'),
  quote: z.string().optional().default(''),
  analysis: z.string().default('Bonne exécution'),
});

/**
 * Schéma Zod pour les pièges Calmi (onomatopées, moralisation)
 */
export const calmiPitfallsSchema = z.object({
  onomatopoeia_count: z.number().catch(0),
  onomatopoeia_list: z.array(z.string()).catch([]),
  onomatopoeia_compliant: z.boolean().catch(true),
  heavy_moralizing_detected: z.boolean().catch(false),
  passive_hypnotic_tics_detected: z.boolean().catch(false),
  details: z.string().optional().default(''),
}).partial().catch({
  onomatopoeia_count: 0,
  onomatopoeia_list: [],
  onomatopoeia_compliant: true,
  heavy_moralizing_detected: false,
  passive_hypnotic_tics_detected: false,
  details: '',
});

/**
 * Schéma Zod pour la configuration TTS dynamique
 */
export const ttsConfigRuntimeSchema = z.object({
  provider: z.string().default('modal-gpu'),
  webhookUrl: z.string().default('https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize-async.modal.run'),
  modalWebhookUrl: z.string().optional().default('https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize-async.modal.run'),
  voiceId: z.string().nullable().optional().default('9BWtsMINqrJLrRacOk9x'),
}).catch({
  provider: 'modal-gpu',
  webhookUrl: 'https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize-async.modal.run',
  modalWebhookUrl: 'https://tomtom-duhamel--calmi-tts-service-calmittsgpu-synthesize-async.modal.run',
  voiceId: '9BWtsMINqrJLrRacOk9x',
});

/**
 * Valide et assainit une critique d'histoire pour éviter tout écran blanc
 */
export function sanitizeStoryCritique(raw: unknown): StoryCritique {
  if (!raw || typeof raw !== 'object') {
    return {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      story_id: null,
      title: 'Histoire',
      content: '',
      target_age: '4-6 ans',
      objective: 'sleep',
      target_word_count: 300,
      actual_word_count: 0,
      overall_score: 5,
      badge: '🟡 PASSABLE',
      verdict: 'Évaluation non disponible',
      detailed_scores: detailedScoresSchema.parse({}),
      critique_summary: {},
      strengths: [],
      weaknesses: [],
      calmi_pitfalls: calmiPitfallsSchema.parse({}),
      actionable_improvements: [],
      rewrite_demonstration: {},
      stats: {},
      markdown_report: '',
      evaluator_model: 'gpt-4o'
    };
  }

  const obj = raw as Record<string, any>;

  return {
    id: String(obj.id || crypto.randomUUID()),
    created_at: String(obj.created_at || new Date().toISOString()),
    story_id: obj.story_id ? String(obj.story_id) : null,
    title: String(obj.title || 'Histoire sans titre'),
    content: String(obj.content || ''),
    target_age: String(obj.target_age || '4-6 ans'),
    objective: String(obj.objective || 'sleep'),
    target_word_count: Number(obj.target_word_count) || 300,
    actual_word_count: Number(obj.actual_word_count) || 0,
    overall_score: Number(obj.overall_score) || 5,
    badge: String(obj.badge || '🟡 PASSABLE'),
    verdict: String(obj.verdict || 'Analyse complétée'),
    detailed_scores: detailedScoresSchema.parse(obj.detailed_scores || {}),
    critique_summary: (obj.critique_summary && typeof obj.critique_summary === 'object') ? obj.critique_summary : {},
    strengths: Array.isArray(obj.strengths) 
      ? obj.strengths.map((s: any) => critiqueStrengthSchema.parse(s)) 
      : [],
    weaknesses: Array.isArray(obj.weaknesses) 
      ? obj.weaknesses.map((w: any) => critiqueWeaknessSchema.parse(w)) 
      : [],
    calmi_pitfalls: calmiPitfallsSchema.parse(obj.calmi_pitfalls || {}),
    actionable_improvements: Array.isArray(obj.actionable_improvements) 
      ? obj.actionable_improvements.map(String) 
      : [],
    rewrite_demonstration: (obj.rewrite_demonstration && typeof obj.rewrite_demonstration === 'object') 
      ? obj.rewrite_demonstration 
      : {},
    stats: (obj.stats && typeof obj.stats === 'object') ? obj.stats : {},
    markdown_report: String(obj.markdown_report || ''),
    evaluator_model: String(obj.evaluator_model || 'gpt-4o'),
  };
}
