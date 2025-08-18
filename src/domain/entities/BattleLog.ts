export interface BattleLog {
  timestamp: number;
  attacker: string;
  target: string;
  value: number;
  effect: string | null;
  extra?: any;
}
