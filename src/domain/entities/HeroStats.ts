export enum HeroType {
    TANK,
    WEAPONS_PAL,
    FIRE_MAGE,
    ICE_MAGE,
    POISON_ROGUE,
    SHAMAN,
    MEDIC,
    GUERRERO_ARMAS
}

export enum HeroState {
    ALIVE,
    DEAD
}

export enum EffectType {
    DAMAGE,
    HEAL,
    BOOST_ATTACK,
    BOOST_DEFENSE,
    REVIVE,
    DODGE,
    DEFENSE
}

export enum ArmorType {
    HELMET,
    CHEST,
    GLOVERS,
    BRACERS,
    BOOTS,
    PANTS
}

export enum ActionType {
    ATTACK,
    DEFENSE,
    HEAL
}

export enum RandomEffectType {
  DAMAGE,
  CRITIC_DAMAGE,
  EVADE,
  RESIST,
  ESCAPE,
  NEGATE
}

export enum TargetType {
  SELF,
  ALLY,
  ENEMY
}

export interface Effect {
  effectType: string;
  value: number;
  durationTurns: number;
  target: TargetType
}

export interface AttackBoost {
  min: number;
  max: number;
}

export interface Damage {
  min: number;
  max: number;
}

export interface SpecialAction {
  name: string;
  actionType: ActionType;
  powerCost: number;
  effect: Effect[];
  cooldown: number;
  isAvailable: boolean;
}

export interface RandomEffect {
  randomEffectType: RandomEffectType;
  percentage: number;
  valueApply: AttackBoost;
}

export interface Hero {
  heroType: HeroType;
  level: number;
  power: number;
  health: number;
  defense: number;
  attack: number;
  attackBoost: AttackBoost;
  damage: Damage;
  specialActions: SpecialAction[];
  randomEffects: RandomEffect[]
}

export interface Item {
  name: string;
  effects: Effect[];
  dropRate: number;
}

export interface Armor {
  name: string;
  effects: Effect[];
  dropRate: number;
}

export interface Weapon {
  name: string;
  effects: Effect[];
  dropRate: number;
}

export interface EpicAbility {
  name: string;
  compatibleHeroType: HeroType;
  effects: Effect[];
  cooldown: number;
  isAvailable: boolean;
  masterChance: number;
}

export interface Equipped {
  items: Item[];
  armors: Armor[];
  weapons: Weapon[];
  epicAbilites: EpicAbility[];
}

export class HeroStats {
    hero: Hero;
  equipped: Equipped;

  constructor(hero: Hero, equipped: Equipped) {
    this.hero = hero;
    this.equipped = equipped;
  }

  static fromJSON(parsed: any): HeroStats {
    const hero: Hero = {
      heroType: parsed.hero.heroType,
      level: parsed.hero.level,
      power: parsed.hero.power,
      health: parsed.hero.health,
      defense: parsed.hero.defense,
      attack: parsed.hero.attack,
      attackBoost: parsed.hero.attackBoost as AttackBoost,
      damage: parsed.hero.damage as Damage,
      specialActions: (parsed.hero.specialActions || []).map(
        (sa: any): SpecialAction => ({
          name: sa.name,
          actionType: sa.actionType,
          powerCost: sa.powerCost,
          effect: sa.effect as Effect[],
          cooldown: sa.cooldown,
          isAvailable: sa.isAvailable,
        })
      ),
      randomEffects: (parsed.hero.randomEffects || []).map(
        (re: any): RandomEffect => ({
          randomEffectType: re.randomEffectType,
          percentage: re.percentage,
          valueApply: re.valueApply as AttackBoost,
        })
      )
    };

    const equipped: Equipped = {
      items: (parsed.equipped?.items || []).map(
        (i: any): Item => ({
          name: i.name,
          effects: i.effects as Effect[],
          dropRate: i.dropRate,
        })
      ),
      armors: (parsed.equipped?.armors || []).map(
        (a: any): Armor => ({
          name: a.name,
          effects: a.effects as Effect[],
          dropRate: a.dropRate,
        })
      ),
      weapons: (parsed.equipped?.weapons || []).map(
        (w: any): Weapon => ({
          name: w.name,
          effects: w.effects as Effect[],
          dropRate: w.dropRate,
        })
      ),
      epicAbilites: (parsed.equipped?.epicAbilites || []).map(
        (ea: any): EpicAbility => ({
          name: ea.name,
          compatibleHeroType: ea.compatibleHeroType,
          effects: ea.effects as Effect[],
          cooldown: ea.cooldown,
          isAvailable: ea.isAvailable,
          masterChance: ea.masterChance,
        })
      )
    };

    return new HeroStats(hero, equipped);
  }
}

