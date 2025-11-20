/**
 * 🔍 BOOT MONITOR
 * Logger et diagnostiquer chaque étape du boot de l'application
 */

interface BootStage {
  stage: string;
  timestamp: number;
}

class BootMonitor {
  private stages: BootStage[] = [];
  private startTime: number = Date.now();

  log(stage: string) {
    const now = Date.now();
    const elapsed = now - this.startTime;
    this.stages.push({ stage, timestamp: elapsed });
    console.log(`[Boot] ${stage} (+${elapsed}ms)`);
  }

  report() {
    console.log('[Boot] === BOOT REPORT ===');
    console.table(this.stages);
    
    if (this.stages.length > 0) {
      const total = this.stages[this.stages.length - 1].timestamp;
      console.log(`[Boot] Total time: ${total}ms`);
    }
  }

  getStages(): BootStage[] {
    return [...this.stages];
  }

  reset() {
    this.stages = [];
    this.startTime = Date.now();
  }
}

export const bootMonitor = new BootMonitor();
