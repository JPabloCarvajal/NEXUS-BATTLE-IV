import Effect from "./Effect";
import { ArmorType } from "../Enums";

export default interface Armor {
  name: string;
  armorType: ArmorType;
  effects: Effect[];
}
