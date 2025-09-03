import { EffectType } from "../Enums";

export default interface Effect {
  effectType: EffectType;
  value: string;
  durationTurns: number;
}
