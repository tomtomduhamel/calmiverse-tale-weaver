/**
 * Moteur de Bruitages Contextuels Doux (Sound FX) pour Calmi
 * 
 * Conçu spécifiquement pour le rituel du coucher des enfants :
 * - Synthèse procédurale 100% Web Audio API native (0Ko à télécharger, 100% hors-ligne, 0 latence).
 * - Acoustique feutrée : filtre passe-bas anti-agressivité à 3500 Hz, volume atténué (-12 dB).
 * - Enveloppes d'amplitude ultra-douces (fade-in 300ms, longue traîne de résonance).
 */

export type BedtimeSoundEffect = 
  | 'magic'     // Carillon magique / scintillement féerique
  | 'stars'     // Berceuse céleste d'étoiles
  | 'wind'      // Brise tiède dans les feuilles
  | 'stream'    // Murmure de ruisseau apaisant
  | 'owl'       // Petite chouette nocturne bienveillante
  | 'fairy'     // Tintement de clochette féerique
  | 'bell'      // Résonance apaisante de bol tibétain (528 Hz)
  | 'heartbeat';// Battement de cœur rassurant

class BedtimeSoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isEnabled: boolean = true;
  private lastTriggeredTime: number = 0;
  private COOLDOWN_MS = 6000; // Pas plus d'un effet toutes les 6 secondes pour préserver le calme

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        
        // Filtre feutré pour supprimer toute fréquence agressive au coucher
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(3200, this.ctx.currentTime);

        // Volume maître bridé à -12 dB (doux sous la voix de narration)
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

        this.filterNode.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Joue un effet sonore doux
   */
  public play(effect: BedtimeSoundEffect, customVolume: number = 0.18): void {
    if (!this.isEnabled) return;

    // Protection anti-surcharge : évite l'accumulation d'effets sonores
    const now = Date.now();
    if (now - this.lastTriggeredTime < this.COOLDOWN_MS) {
      return;
    }
    this.lastTriggeredTime = now;

    try {
      this.initContext();
      if (!this.ctx || !this.filterNode) return;

      const t = this.ctx.currentTime;

      switch (effect) {
        case 'magic':
        case 'stars':
          this.playCelestialShimmer(t, customVolume);
          break;
        case 'fairy':
          this.playFairyChime(t, customVolume);
          break;
        case 'wind':
          this.playWarmBreeze(t, customVolume);
          break;
        case 'stream':
          this.playWaterMurmur(t, customVolume);
          break;
        case 'owl':
          this.playGentleOwl(t, customVolume);
          break;
        case 'bell':
          this.playHarmonicBowl(t, customVolume);
          break;
        case 'heartbeat':
          this.playCalmingHeartbeat(t, customVolume);
          break;
      }
    } catch (err) {
      console.warn("⚠️ [SFX Engine] Erreur lors de la lecture de l'effet sonore:", err);
    }
  }

  /**
   * Scintillement d'étoiles / Carillon céleste (accord pentatonique apaisant C6-E6-G6-B6)
   */
  private playCelestialShimmer(t: number, volume: number) {
    if (!this.ctx || !this.filterNode) return;
    const notes = [1046.50, 1318.51, 1567.98, 1975.53, 2093.00]; // C6, E6, G6, B6, C7
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const noteTime = t + idx * 0.18;
      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.exponentialRampToValueAtTime(volume * 0.45, noteTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.8);

      osc.connect(gain);
      gain.connect(this.filterNode!);

      osc.start(noteTime);
      osc.stop(noteTime + 2.0);
    });
  }

  /**
   * Clochette féerique douce (onde pure sinusoïdale avec vibration subtile)
   */
  private playFairyChime(t: number, volume: number) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.35);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume * 0.5, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(t);
    osc.stop(t + 2.5);
  }

  /**
   * Brise tiède dans les feuillages (bruit filtré rose passe-bande très doux)
   */
  private playWarmBreeze(t: number, volume: number) {
    if (!this.ctx || !this.filterNode) return;
    const bufferSize = this.ctx.sampleRate * 2.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02; // Bruit brun feutré
      lastOut = data[i];
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const breezeFilter = this.ctx.createBiquadFilter();
    breezeFilter.type = 'bandpass';
    breezeFilter.frequency.setValueAtTime(450, t);
    breezeFilter.frequency.linearRampToValueAtTime(650, t + 1.2);
    breezeFilter.frequency.linearRampToValueAtTime(400, t + 2.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume * 0.6, t + 0.8);
    gain.gain.linearRampToValueAtTime(0.0001, t + 2.5);

    noise.connect(breezeFilter);
    breezeFilter.connect(gain);
    gain.connect(this.filterNode);

    noise.start(t);
    noise.stop(t + 2.6);
  }

  /**
   * Murmure de ruisseau apaisant
   */
  private playWaterMurmur(t: number, volume: number) {
    if (!this.ctx || !this.filterNode) return;
    const tones = [580, 680, 790];
    tones.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq + (idx % 2 === 0 ? 35 : -35), t + 1.5);

      gain.gain.setValueAtTime(0.0001, t + idx * 0.15);
      gain.gain.linearRampToValueAtTime(volume * 0.25, t + idx * 0.15 + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.15 + 2.2);

      osc.connect(gain);
      gain.connect(this.filterNode!);

      osc.start(t);
      osc.stop(t + 2.6);
    });
  }

  /**
   * Petite chouette nocturne bienveillante (deux tons doux : 440 Hz -> 392 Hz)
   */
  private playGentleOwl(t: number, volume: number) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(392, t + 0.35);
    osc.frequency.setValueAtTime(392, t + 0.55);
    osc.frequency.exponentialRampToValueAtTime(349, t + 0.95);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume * 0.45, t + 0.15);
    gain.gain.linearRampToValueAtTime(0.0001, t + 0.45);
    gain.gain.linearRampToValueAtTime(volume * 0.45, t + 0.65);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(t);
    osc.stop(t + 1.8);
  }

  /**
   * Bol chantant tibétain / Fréquence sacrée 528 Hz (amour, harmonie et sommeil profond)
   */
  private playHarmonicBowl(t: number, volume: number) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, t); // 528 Hz

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(264, t); // Octave inférieure feutrée

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume * 0.45, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(t);
    subOsc.start(t);
    osc.stop(t + 3.8);
    subOsc.stop(t + 3.8);
  }

  /**
   * Battement de cœur rassurant (pulsation fœtale apaisante ~60 bpm)
   */
  private playCalmingHeartbeat(t: number, volume: number) {
    if (!this.ctx || !this.filterNode) return;
    const pulses = [0, 0.22]; // Double battement "lub-dub"
    pulses.forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t + offset);
      osc.frequency.exponentialRampToValueAtTime(45, t + offset + 0.12);

      gain.gain.setValueAtTime(0.0001, t + offset);
      gain.gain.linearRampToValueAtTime(volume * 0.6, t + offset + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.25);

      osc.connect(gain);
      gain.connect(this.filterNode!);

      osc.start(t + offset);
      osc.stop(t + offset + 0.3);
    });
  }
}

export const soundEffectsEngine = new BedtimeSoundEffectsEngine();

/**
 * Détecte si un paragraphe ou une phrase appelle un effet sonore doux
 */
export const detectContextualSoundEffect = (text: string): BedtimeSoundEffect | null => {
  if (!text) return null;

  // 1. Balise explicite prioritaire injectée par le LLM (ex: [sfx:stars])
  const tagMatch = text.match(/\[sfx:\s*(magic|stars|wind|stream|owl|fairy|bell|heartbeat)\]/i);
  if (tagMatch) {
    return tagMatch[1].toLowerCase() as BedtimeSoundEffect;
  }

  const clean = text.toLowerCase();

  // 2. Détection sémantique contextuelle douce
  if (/chouette|hibou|hululement|hulula\b/i.test(clean)) {
    return 'owl';
  }
  if (/baguette magique|sortilège|poudre d'étoile|étincelle dorée|enchantement|formule magique/i.test(clean)) {
    return 'magic';
  }
  if (/étoile filante|ciel étoilé|constellation|scintill|berceau céleste/i.test(clean)) {
    return 'stars';
  }
  if (/brise tiède|souffle du vent|feuilles qui dansent|vent doux|zéphyr/i.test(clean)) {
    return 'wind';
  }
  if (/ruisseau|cascade d'eau|rivière|gouttelettes|clapotis|eau cristalline/i.test(clean)) {
    return 'stream';
  }
  if (/clochette|carillon|tintement doux|fée clochette/i.test(clean)) {
    return 'fairy';
  }
  if (/bol chantant|cloche douce|vibration apaisante/i.test(clean)) {
    return 'bell';
  }
  if (/battement de son cœur|tout contre son cœur|au creux de ses bras/i.test(clean)) {
    return 'heartbeat';
  }

  return null;
};

/**
 * Nettoie le texte de toute balise [sfx:...] pour la lecture visuelle ou la synthèse TTS
 */
export const stripStorySfxTags = (text: string): string => {
  if (!text) return "";
  return text.replace(/\[sfx:\s*[^\]]+\]/gi, "").replace(/\s{2,}/g, " ").trim();
};
