import { Player } from "./Player";
import { Team } from "./Team";

export class Battle {
  constructor(
    public id: string,
    public roomId: string,
    public teams: Team[],
    public turnOrder: string[],
    public currentTurnIndex: number = 0,
    public state: "WAITING" | "IN_PROGRESS" | "FINISHED" = "WAITING"
  ) {}

  startBattle() {
    this.state = "IN_PROGRESS";
    this.currentTurnIndex = 0;
  }

  getCurrentActor(): string {
    const actor = this.turnOrder[this.currentTurnIndex];
    if (actor === undefined) {
      throw new Error("Current actor is undefined.");
    }
    return actor;
  }

  findPlayer(playerUsername: string): Player | undefined {
    for (const team of this.teams) {
      const player = team.findPlayer(playerUsername);
      if (player) return player;
    }
    return undefined;
  }

  advanceTurn() {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
  }
}
