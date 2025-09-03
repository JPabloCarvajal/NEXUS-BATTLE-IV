import { HeroState, HeroType } from "../Enums";
import Equipment from "./Equipment";
import SpecialAction from "./SpecialAction";

export default interface Hero {
  id: string;
  heroType: HeroType;
  level: number;
  experience: number;
  health: number;
  power: number;
  attack: number;
  defense: number;
  damage: number;
  equipment: Equipment;
  specialActions: SpecialAction[];
  state: HeroState;
}
