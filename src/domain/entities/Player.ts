import { HeroStats } from "./HeroStats";

export class Player {
  username: string;
  heroLevel: number;
  ready: boolean;
  heroStats: HeroStats;

  constructor(username: string, heroLevel: number, ready: boolean, heroStats: HeroStats) {
    this.username = username;
    this.heroLevel = heroLevel;
    this.ready = ready;
    this.heroStats = heroStats;
  }

  static fromJSON(data: any): Player {
    return new Player(
      data.username,
      data.heroLevel,
      data.ready,
      HeroStats.fromJSON(data.heroStats)
    );
  }
}
