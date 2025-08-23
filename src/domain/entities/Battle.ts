import { BattleLogger } from "../../shared/utils/BattleLogger";
import { Player } from "./Player";
import { Team } from "./Team";

export class Battle {
  constructor(
    public id: string,
    public roomId: string,
    public teams: Team[],
    public turnOrder: string[],
    public currentTurnIndex: number = 0,
    public state: "WAITING" | "IN_PROGRESS" | "FINISHED" = "WAITING",
    public battleLogger: BattleLogger = new BattleLogger(),
    public readonly initialPowers: Map<string, number> = new Map(),
    public winner: string | null = null,
    public isEnded: boolean = false
  ) {
      teams.forEach(team => {
      team.players.forEach(player => {
        const hero = player.heroStats?.hero;
        if (hero) {
          this.initialPowers.set(player.username, hero.power ?? 0);
        }
      });
    });
  }

  startBattle() {
    this.state = "IN_PROGRESS";
    this.currentTurnIndex = 0;
  }

  getCurrentActor(): string {
    const actor = this.turnOrder[this.currentTurnIndex % this.turnOrder.length] ;
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
    this.currentTurnIndex = this.currentTurnIndex + 1;
  }

  endBattle(winner: string) {
    this.winner = winner;
    this.isEnded = true;
    this.state = "FINISHED"; // Si tienes una propiedad status
  }
}
