/**
 * 🔍 BOOT MONITOR - Phase 6 Enhanced
 * Logger détaillé et diagnostiquer chaque étape du boot de l'application
 * Expose les logs pour l'UI d'urgence
 */

interface BootStage {
  stage: string;
  timestamp: number;
  duration?: number; // Durée de l'opération
}

class BootMonitor {
  private stages: BootStage[] = [];
  private startTime: number = Date.now();
  private lastStageTime: number = Date.now();
  private isPreviewMode: boolean = false;

  constructor() {
    // Détecter mode preview
    this.isPreviewMode = (window as any).__CALMI_PREVIEW_MODE || false;
    if (this.isPreviewMode) {
      console.log('[BootMonitor] Mode preview - stockage mémoire uniquement');
    }
    
    // Exposer globalement pour l'UI d'urgence
    (window as any).__CALMI_BOOT_MONITOR = this;
  }

  log(stage: string) {
    const now = Date.now();
    const elapsed = now - this.startTime;
    const duration = now - this.lastStageTime;
    
    this.stages.push({ stage, timestamp: elapsed, duration });
    this.lastStageTime = now;
    
    console.log(`[Boot] ${stage} (+${elapsed}ms, Δ${duration}ms)`);
    
    // Marquer les étapes lentes
    if (duration > 1000) {
      console.warn(`[Boot] ⚠️ Étape lente détectée: ${stage} (${duration}ms)`);
    }
  }

  report() {
    console.log('[Boot] === BOOT REPORT ===');
    console.table(this.stages);
    
    if (this.stages.length > 0) {
      const total = this.stages[this.stages.length - 1].timestamp;
      console.log(`[Boot] Total time: ${total}ms`);
      
      // Analyse des performances
      const slowStages = this.stages.filter(s => (s.duration || 0) > 1000);
      if (slowStages.length > 0) {
        console.warn('[Boot] Étapes lentes détectées:');
        console.table(slowStages);
      }
    }
  }

  getStages(): BootStage[] {
    return [...this.stages];
  }

  getLastStages(count: number = 10): BootStage[] {
    return this.stages.slice(-count);
  }

  getTotalTime(): number {
    if (this.stages.length === 0) return 0;
    return this.stages[this.stages.length - 1].timestamp;
  }

  reset() {
    this.stages = [];
    this.startTime = Date.now();
    this.lastStageTime = Date.now();
  }
}

export const bootMonitor = new BootMonitor();
