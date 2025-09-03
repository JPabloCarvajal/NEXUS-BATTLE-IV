import {
  Armor,
  AttackBoost,
  Damage,
  EpicAbility,
  HeroStats,
  HeroType,
  Item,
  RandomEffect,
  SpecialAction,
  Weapon,
} from "./HeroStats";

export class Player {
  username: string;
  heroLevel: number;
  ready: boolean;
  heroStats: HeroStats;

  constructor(
    username: string,
    heroLevel: number,
    ready: boolean,
    heroStats: HeroStats
  ) {
    this.username = username;
    this.heroLevel = heroLevel;
    this.ready = ready;
    this.heroStats = heroStats;
  }

  static fromJSON(data: {
    username: string;
    heroLevel: number;
    ready: boolean;
    heroStats: {
      hero: {
        heroType: HeroType;
        level: number;
        power: number;
        health: number;
        defense: number;
        attack: number;
        attackBoost: AttackBoost;
        damage: Damage;
        specialActions?: SpecialAction[];
        randomEffects?: RandomEffect[];
      };
      equipped?: {
        items?: Item[];
        armors?: Armor[];
        weapons?: Weapon[];
        epicAbilites?: EpicAbility[];
      };
    };
  }): Player {
    return new Player(
      data.username,
      data.heroLevel,
      data.ready,
      HeroStats.fromJSON(data.heroStats)
    );
  }
}
