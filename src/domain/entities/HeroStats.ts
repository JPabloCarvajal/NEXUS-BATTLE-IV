export enum HeroType {
    TANK,
    WEAPONS_PAL,
    FIRE_MAGE,
    ICE_MAGE,
    POISON_ROGUE,
    SHAMAN,
    MEDIC
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

export interface Effect {
  effectType: string;
  value: number;
  durationTurns: number;
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
  effect: Effect;
  cooldown: number;
  isAvailable: boolean;
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

export interface HeroStats {
  hero: Hero;
  equipped: Equipped;
}

