import { BattleLogger } from "../../shared/utils/BattleLogger";
import { BattleLog } from "./BattleLog";
import { Player } from "./Player";
import { Team } from "./Team";

export class Battle {
  constructor(
    public id: string,
    public roomId: string,
    public teams: Team[],
    public turnOrder: string[],
    public currentTurnIndex = 0,
    public state: "WAITING" | "IN_PROGRESS" | "FINISHED" = "WAITING",
    public battleLogger: BattleLogger = new BattleLogger(),
    public initialPowers: Map<string, number> = new Map(),
    public winner: string | null = null,
    public isEnded = false
  ) {
    teams.forEach((team) => {
      team.players.forEach((player) => {
        const hero = player.heroStats?.hero;
        if (hero) {
          this.initialPowers.set(player.username, hero.power ?? 0);
        }
      });
    });
  }

  static fromJSON(data: {
    id: string;
    roomId: string;
    teams: Team[];
    turnOrder: string[];
    currentTurnIndex: number;
    state: "WAITING" | "IN_PROGRESS" | "FINISHED";
    battleLogger: { logs: BattleLog[] };
    initialPowers?: Record<string, number>;
    winner?: string | null;
    isEnded?: boolean;
  }): Battle {
    const teams = data.teams.map((t) => Team.fromJSON(t));
    const battle = new Battle(data.id, data.roomId, teams, data.turnOrder);
    battle.currentTurnIndex = data.currentTurnIndex;
    battle.state = data.state;
    battle.battleLogger = new BattleLogger(data.battleLogger.logs);
    battle.initialPowers = new Map(Object.entries(data.initialPowers || {}));
    battle.winner = data.winner ?? null;
    battle.isEnded = data.isEnded ?? false;
    return battle;
  }

  startBattle() {
    this.state = "IN_PROGRESS";
    this.currentTurnIndex = 0;
  }

  getCurrentActor(): string {
    const actor = this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
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
