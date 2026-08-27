// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Assombrissement d\'écran lors de la lecture audio (Mode Veilleuse)', () => {
  it('devrait définir dimScreenOnAudioPlay dans l\'interface UserSettings', () => {
    const filePath = path.resolve(__dirname, '../../../../types/user-settings.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('dimScreenOnAudioPlay?: boolean');
  });

  it('devrait initialiser et charger dimScreenOnAudioPlay dans useUserSettingsState', () => {
    const filePath = path.resolve(__dirname, '../../../../hooks/settings/useUserSettingsState.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('dimScreenOnAudioPlay: false');
    expect(content).toContain('dimScreenOnAudioPlay: data.dim_screen_on_audio ?? false');
  });

  it('devrait sauvegarder dim_screen_on_audio dans useUpdateUserSettings', () => {
    const filePath = path.resolve(__dirname, '../../../../hooks/settings/useUpdateUserSettings.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('newSettings.readingPreferences?.dimScreenOnAudioPlay !== undefined');
    expect(content).toContain('supabaseData.dim_screen_on_audio = newSettings.readingPreferences.dimScreenOnAudioPlay');
  });

  it('devrait comporter le toggle d\'assombrissement dans ReadingPreferencesSection', () => {
    const filePath = path.resolve(__dirname, '../../../../components/settings/ReadingPreferencesSection.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('Assombrir l\'écran pendant l\'audio');
    expect(content).toContain('handleDimScreenOnAudioChange');
    expect(content).toContain('dimScreenOnAudioPlay: checked');
    expect(content).toContain('id="dim-screen-audio"');
  });

  it('devrait comporter le toggle d\'assombrissement dans AudioSection', () => {
    const filePath = path.resolve(__dirname, '../../../../components/settings/AudioSection.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('Assombrir l\'écran pendant l\'audio');
    expect(content).toContain('handleDimScreenChange');
    expect(content).toContain('dimScreenOnAudioPlay: checked');
    expect(content).toContain('id="audio-dim-screen"');
  });

  it('devrait propager onPlayStateChange dans IntegratedAudioDeck et ReaderControls', () => {
    const deckPath = path.resolve(__dirname, '../../../../components/story/reader/IntegratedAudioDeck.tsx');
    const deckContent = fs.readFileSync(deckPath, 'utf-8');

    expect(deckContent).toContain('onPlayStateChange?: (isPlaying: boolean) => void');
    expect(deckContent).toContain('onPlayStateChange?.(active)');

    const controlsPath = path.resolve(__dirname, '../../../../components/story/ReaderControls.tsx');
    const controlsContent = fs.readFileSync(controlsPath, 'utf-8');

    expect(controlsContent).toContain('onAudioPlayStateChange?: (isPlaying: boolean) => void');
    expect(controlsContent).toContain('onPlayStateChange={onAudioPlayStateChange}');
  });

  it('devrait intégrer le calque d\'assombrissement automatique fluide dans StoryReader', () => {
    const readerPath = path.resolve(__dirname, '../../../../components/StoryReader.tsx');
    const readerContent = fs.readFileSync(readerPath, 'utf-8');

    expect(readerContent).toContain('userSettings.readingPreferences?.dimScreenOnAudioPlay && isAudioPlaying');
    expect(readerContent).toContain('bg-black/80');
    expect(readerContent).toContain('transition-opacity duration-1000');
    expect(readerContent).toContain('onAudioPlayStateChange={setIsAudioPlaying}');
  });
});
