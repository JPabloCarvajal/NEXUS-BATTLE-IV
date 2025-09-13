// src/app/services/RewardService.ts
import { Battle } from "../../domain/entities/Battle";
import { Team } from "../../domain/entities/Team";
import { RoomRepository } from "../useCases/rooms/RoomRepository";
import { BattleRepository } from "../useCases/battle/BattleRepository";
import { InventoryApiClient, RewardPayload } from "../../infra/clients/InventoryApiClient";

type GameMode = "1v1" | "2v2" | "3v3";

export class RewardService {
  constructor(
    private roomRepo: RoomRepository,
    private battleRepo: BattleRepository,
    private inventory = new InventoryApiClient()
  ) {}

  /** Reparte créditos al finalizar la batalla. Excluye abandonos si se pasan activos. */
  async awardBattleEnd(roomId: string, activeUsernames?: string[]): Promise<void> {
    const battle = await this.battleRepo.findById(roomId);
    if (!battle || !battle.winner) return;

    const room = await this.roomRepo.findById(battle.roomId);
    const mode = (room?.config.mode ?? "1v1") as GameMode;

    const participants = this.getAllParticipants(battle);
    const winners = this.getTeamUsernames(battle, battle.winner);
    const eligible = new Set(activeUsernames && activeUsernames.length ? activeUsernames : participants);

    // Créditos por modalidad: 1v1 => 2, grupal => 4; demás => 1.
    const winnerCredits = mode === "1v1" ? 2 : 4;

    // Pagar a ganadores
    for (const username of winners) {
      if (!eligible.has(username)) continue; // no recibe si abandonó
      await this.inventory.sendReward(this.buildPayload(username, winnerCredits, 0));
    }

    // Pagar a participantes no ganadores
    for (const username of participants) {
      if (winners.includes(username)) continue;
      if (!eligible.has(username)) continue; // abandonó
      await this.inventory.sendReward(this.buildPayload(username, 1, 0));
    }
  }

  /** Otorga EXP al atacante cuando deja KO a un enemigo (NPC o jugador). */
  async awardKillExp(killerUsername: string, victimUsername: string, maybeItemName?: string): Promise<number> {
    const die = 1 + Math.floor(Math.random() * 8); // 1d8
    const exp = Math.round(10 * Math.pow(1.2, die)); // fórmula del PDF  :contentReference[oaicite:4]{index=4}

    const payload: RewardPayload = {
      Rewards: { playerRewarded: killerUsername, credits: 0, exp },
      WonItem: maybeItemName
        ? { originPlayer: victimUsername, itemName: maybeItemName }
        : { originPlayer: victimUsername, itemName: "" }, // respeta estructura
    };

    await this.inventory.sendReward(payload);
    return exp;
  }

  // ------------ helpers ------------
  private buildPayload(player: string, credits: number, exp: number): RewardPayload {
    return {
      Rewards: { playerRewarded: player, credits, exp },
      WonItem: { originPlayer: "", itemName: "" }, // estructura requerida por el otro equipo
    };
  }

  private getAllParticipants(battle: Battle): string[] {
    return (battle.teams || []).flatMap((t: Team) => (t.players || []).map(p => p.username));
  }

  private getTeamUsernames(battle: Battle, teamId: string | null): string[] {
    if (!teamId || teamId === "DRAW") return []; // empate => nadie como ganador
    const team = (battle.teams || []).find(t => t.id === teamId);
    return team ? team.players.map(p => p.username) : [];
  }
}
