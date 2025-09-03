import BattleEvent from "./BattleEvent";
import BattleRoom from "./BattleRoom";
import Player from "./Player";

export default interface Battle {
  room: BattleRoom;
  participants: Player[];
  turnOrder: Player[];
  currentTurn: Player;
  turnTime: number;
  actionLog: BattleEvent[];
}
