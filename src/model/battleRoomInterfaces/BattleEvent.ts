import { BattleEventType } from "../Enums";
import Effect from "../gameInterfaces/Effect";
import Player from "./Player";

export default interface BattleEvent {
    origin: Player
    appliedEffect: Effect
    target: Player
    outCome: string // describes the complete event in text (A hits B for 10 damage bla bla bla)
    eventType: BattleEventType
}