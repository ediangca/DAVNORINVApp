import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})

export class LogsService {
  private logsMap: Map<string, any[]> = new Map<string, any[]>();;

  printLogs(logType: string, label: string, log: any[] | any) {

    if (environment.production) {
      switch (logType.toLowerCase()) {
        case 'i':
          logType = "INFORMATION"
          console.info(label, log);
          break;
        case 'w':
          logType = "WARNING"
          console.warn(label, log);
          break;
        case 'e':
          logType = "ERROR"
          console.error(label, log);
          break;
      }
      this.storeLog(logType, log);
    }

  }

  private storeLog(logType: string, log: any[] | any) {
    if (this.logsMap.has(logType)) {
      this.logsMap.get(logType)?.push(log);
    } else {
      this.logsMap.set(logType, [log]);
    }
  }

  getLogs(logType: string): string[] | undefined {
    return this.logsMap.get(logType);
  }

  getAllLogs(): Map<string, string[]> {
    return this.logsMap;
  }
}
