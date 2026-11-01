import { describe, it, expect } from 'vitest';
import { calculateReadingTime, formatReadingMinutes, formatAudioDuration } from '@/utils/readingTime';
import { STORY_DURATION_CONFIG, getStoryDurationConfig, estimateWordCountForDuration, getDurationWordBounds } from '@/types/story';

describe('Story Duration & Reading Time Utilities', () => {
  describe('calculateReadingTime', () => {
    it('returns "0 min de lecture" for undefined or empty text', () => {
      expect(calculateReadingTime(undefined)).toBe('0 min de lecture');
      expect(calculateReadingTime('')).toBe('0 min de lecture');
    });

    it('returns "< 1 min de lecture" for very short text (< 60 words at 120 wpm)', () => {
      const shortText = 'Il était une fois un petit renard.';
      expect(calculateReadingTime(shortText)).toBe('< 1 min de lecture');
    });

    it('returns formatted "~X min de lecture" with tilde for standard text length', () => {
      // 120 words => 1 min
      const words120 = Array(120).fill('mot').join(' ');
      expect(calculateReadingTime(words120)).toBe('~1 min de lecture');

      // 1080 words => 9 min
      const words1080 = Array(1080).fill('mot').join(' ');
      expect(calculateReadingTime(words1080)).toBe('~9 min de lecture');

      // 1200 words => 10 min
      const words1200 = Array(1200).fill('mot').join(' ');
      expect(calculateReadingTime(words1200)).toBe('~10 min de lecture');
    });
  });

  describe('formatReadingMinutes', () => {
    it('formats minutes into explicit parent reading duration', () => {
      expect(formatReadingMinutes(0)).toBe('< 1 min de lecture');
      expect(formatReadingMinutes(3)).toBe('~3 min de lecture');
      expect(formatReadingMinutes(5)).toBe('~5 min de lecture');
      expect(formatReadingMinutes(10)).toBe('~10 min de lecture');
      expect(formatReadingMinutes(15)).toBe('~15 min de lecture');
    });
  });

  describe('formatAudioDuration', () => {
    it('formats audio seconds into clear listening duration', () => {
      expect(formatAudioDuration(0)).toBe("0 min d'écoute");
      expect(formatAudioDuration(45)).toBe("45s d'écoute");
      expect(formatAudioDuration(360)).toBe("6 min d'écoute");
      expect(formatAudioDuration(375)).toBe("6 min 15s d'écoute");
    });
  });

  describe('STORY_DURATION_CONFIG & getStoryDurationConfig', () => {
    it('provides narrative format metadata for 3, 5, 10, and 15 minutes', () => {
      expect(STORY_DURATION_CONFIG[3].label).toBe('Express');
      expect(STORY_DURATION_CONFIG[3].sublabel).toBe('~3 min');

      expect(STORY_DURATION_CONFIG[5].label).toBe('Courte');
      expect(STORY_DURATION_CONFIG[5].sublabel).toBe('~5 min');

      expect(STORY_DURATION_CONFIG[10].label).toBe('Moyenne');
      expect(STORY_DURATION_CONFIG[10].sublabel).toBe('~10 min');

      expect(STORY_DURATION_CONFIG[15].label).toBe('Longue');
      expect(STORY_DURATION_CONFIG[15].sublabel).toBe('~15 min');
    });

    it('returns correct config or fallback to 10 min', () => {
      expect(getStoryDurationConfig(3).label).toBe('Express');
      expect(getStoryDurationConfig(5).label).toBe('Courte');
      expect(getStoryDurationConfig(10).label).toBe('Moyenne');
      expect(getStoryDurationConfig(15).label).toBe('Longue');
      expect(getStoryDurationConfig(null).label).toBe('Moyenne');
      expect(getStoryDurationConfig(99 as any).label).toBe('Moyenne');
    });

    it('estimates target words accurately for story generation with default and custom WPM', () => {
      // 3 min * 120 wpm = 360 words
      expect(estimateWordCountForDuration(3)).toBe(360);
      // 5 min * 120 wpm = 600 words
      expect(estimateWordCountForDuration(5)).toBe(600);
      // 10 min * 120 wpm = 1200 words
      expect(estimateWordCountForDuration(10)).toBe(1200);
      // 15 min * 120 wpm = 1800 words
      expect(estimateWordCountForDuration(15)).toBe(1800);

      // Custom WPM (e.g. 90 words/min)
      expect(estimateWordCountForDuration(5, 90)).toBe(450);
      expect(estimateWordCountForDuration(3, 90)).toBe(270);
      // Custom WPM (e.g. 150 words/min)
      expect(estimateWordCountForDuration(10, 150)).toBe(1500);
    });

    it('calculates strict word bounds and ceilings with getDurationWordBounds', () => {
      // 3 min @ default 120 wpm
      const bounds3 = getDurationWordBounds(3);
      expect(bounds3.targetWords).toBe(300);
      expect(bounds3.minWords).toBe(255);
      expect(bounds3.maxWords).toBe(342); // strict cap under 350 to never trigger 4/5 min

      // 3 min @ user profile 115 wpm
      const bounds3User = getDurationWordBounds(3, 115);
      expect(bounds3User.targetWords).toBe(288);
      expect(bounds3User.maxWords).toBe(328);

      // 5 min @ 120 wpm
      const bounds5 = getDurationWordBounds(5);
      expect(bounds5.targetWords).toBe(516);
      expect(bounds5.maxWords).toBe(576);

      // 10 min @ 120 wpm
      const bounds10 = getDurationWordBounds(10);
      expect(bounds10.targetWords).toBe(1056);
      expect(bounds10.maxWords).toBe(1152);
    });

    it('safeguards calculateReadingTime so 3-min express stories never round up to 4 or 5 min', () => {
      // 340 words with 115 wpm -> 340 / 115 = 2.95 min -> ~3 min
      const text340 = Array(340).fill('mot').join(' ');
      expect(calculateReadingTime(text340, 115)).toBe('~3 min de lecture');

      // 355 words with slow reading speed 100 wpm (normally 3.55 -> rounds to 4, but capped to 3)
      const text355 = Array(355).fill('mot').join(' ');
      expect(calculateReadingTime(text355, 100)).toBe('~3 min de lecture');

      // 580 words with 100 wpm (normally 5.8 -> rounds to 6, capped to 5)
      const text580 = Array(580).fill('mot').join(' ');
      expect(calculateReadingTime(text580, 100)).toBe('~5 min de lecture');
    });
  });
});
