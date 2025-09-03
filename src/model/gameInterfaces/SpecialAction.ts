import Effect from "./Effect";
import { ActionType } from "../Enums";

export default interface SpecialAction {
  name: string;
  actionType: ActionType;
  powerCost: number;
  effect: Effect;
  cooldown: number;
  isAvailable: boolean;
}
