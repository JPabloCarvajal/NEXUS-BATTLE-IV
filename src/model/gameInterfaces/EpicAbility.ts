import Effect from "./Effect";
import { HeroType } from "../Enums";

export default interface EpicAbility {
  name: string;
  compatibleHeroType: HeroType;
  effects: Effect[];
  cooldown: number;
  isAvailable: boolean;
}
