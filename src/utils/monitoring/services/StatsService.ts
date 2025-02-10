
export class StatsService {
  private static errorCounts: { [key: string]: number } = {};
  private static totalOperations = 0;

  static incrementErrorCount(hour: string): void {
    this.errorCounts[hour] = (this.errorCounts[hour] || 0) + 1;
  }

  static incrementOperations(): void {
    this.totalOperations++;
  }

  static calculateErrorRate(hour: string): number {
    return this.totalOperations > 0 ? (this.errorCounts[hour] || 0) / this.totalOperations : 0;
  }

  static calculateErrorRates(): { [key: string]: number } {
    const rates: { [key: string]: number } = {};
    Object.entries(this.errorCounts).forEach(([hour, count]) => {
      rates[hour] = count / Math.max(this.totalOperations, 1);
    });
    return rates;
  }

  static getCurrentHour(): string {
    return new Date().toISOString().slice(0, 13);
  }
}
