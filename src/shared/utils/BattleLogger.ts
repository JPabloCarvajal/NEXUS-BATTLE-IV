import { BattleLog } from "../../domain/entities/BattleLog";

export class BattleLogger {
  private logs: BattleLog[] = [];

  constructor(initialLogs: BattleLog[] = []) {
    this.logs = initialLogs;
  }

  addLog(entry: BattleLog) {
    this.logs.push(entry);
  }

  getLogs(): BattleLog[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }
}
