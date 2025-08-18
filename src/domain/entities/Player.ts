import { HeroStats } from "./HeroStats";

export interface Player {
  username: string;
  heroLevel: number;
  ready: boolean;
  heroStats: HeroStats
}
