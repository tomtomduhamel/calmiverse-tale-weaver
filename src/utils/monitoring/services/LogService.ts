
export class LogService {
  static record(event: string, storyId: string, data: any): void {
    console.log(`[Monitoring] ${event}:`, {
      storyId,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  static error(event: string, data: any): void {
    console.error(`[ALERT] ${event}:`, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}
