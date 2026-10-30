import { describe, it, expect } from 'vitest';
import { sanitizeStoryCritique } from '@/utils/schemas/runtimeSchemas';

describe('critique data normalization', () => {
  it('preserves structured recommendations instead of stringifying objects', () => {
    const result = sanitizeStoryCritique({ actionable_improvements: [{ priority: 2, target_area: 'rythme', recommendation: 'Raccourcir la scène' }] });
    expect(result.actionable_improvements).toEqual([{ priority: 2, target_area: 'rythme', recommendation: 'Raccourcir la scène' }]);
  });
  it('normalizes legacy string recommendations', () => {
    expect(sanitizeStoryCritique({ actionable_improvements: ['Raccourcir la scène'] }).actionable_improvements)
      .toEqual([{ priority: 1, target_area: '', recommendation: 'Raccourcir la scène' }]);
  });
  it('fills required strength and weakness fields', () => {
    const result = sanitizeStoryCritique({ strengths: [{}], weaknesses: [{}] });
    expect(result.strengths[0]).toEqual({ aspect: 'Point fort', analysis: 'Bonne exécution', quote: '' });
    expect(result.weaknesses[0]).toEqual({ issue: 'Point à améliorer', impact: 'Impact modéré', severity: 'mineur', quote: '' });
  });
});