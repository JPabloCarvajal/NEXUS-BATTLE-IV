import { GameMode, RoomState } from "../Enums";
import Player from "./Player";

export default interface BattleRoom {
  id: string;
  maxPlayers: number;
  includesAi: boolean;
  rewardCredits: number;
  participants: Player[];
  mode: GameMode;
  state: RoomState;
}
