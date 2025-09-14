// src/app/services/RewardService.ts
import { Battle } from "../../domain/entities/Battle";
import { Team } from "../../domain/entities/Team";
import { RoomRepository } from "../useCases/rooms/RoomRepository";
import { BattleRepository } from "../useCases/battle/BattleRepository";
import { InventoryApiClient, RewardPayload, RewardsRequest } from "../../infra/clients/InventoryApiClient";
import { RewardsRepository } from "../useCases/rooms/RewardsRepository";
import AleatoryDropRateEffect from "./aleatoryEffectsGenerator/impl/aleatoryDropRateEffect";

type GameMode = "1v1" | "2v2" | "3v3";

export class RewardService {
  constructor(
    private roomRepo: RoomRepository,
    private rewardRepo: RewardsRepository,
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
      const rewardsPayload = this.rewardRepo.getAwards(roomId, username);
      const totalExp = rewardsPayload.then(rewards => rewards.reduce((sum, r) => sum + r.Rewards.exp, 0));
      const totalCredits = rewardsPayload.then(rewards => rewards.reduce((sum, r) => sum + r.Rewards.credits, 0));
      const originPlayers = rewardsPayload.then(rewards => rewards.map(r => r.WonItem.originPlayer));
      const itemNames = rewardsPayload.then(rewards => rewards.map(r => r.WonItem.itemName));
      await this.inventory.sendReward(this.buildPayload(username, winnerCredits + await totalCredits, await totalExp, await originPlayers, await itemNames));

    }

    // Pagar a participantes no ganadores
    for (const username of participants) {
      if (winners.includes(username)) continue;
      if (!eligible.has(username)) continue; // abandonó
      const rewardsPayload = this.rewardRepo.getAwards(roomId, username);
      const totalExp = rewardsPayload.then(rewards => rewards.reduce((sum, r) => sum + r.Rewards.exp, 0));
      const totalCredits = rewardsPayload.then(rewards => rewards.reduce((sum, r) => sum + r.Rewards.credits, 0));
      const originPlayers = rewardsPayload.then(rewards => rewards.map(r => r.WonItem.originPlayer));
      const itemNames = rewardsPayload.then(rewards => rewards.map(r => r.WonItem.itemName));
      await this.inventory.sendReward(this.buildPayload(username, 1 + await totalCredits, await totalExp, await originPlayers, await itemNames));
    }
  }

  /** Otorga EXP al atacante cuando deja KO a un enemigo (NPC o jugador). */
  async awardKillExp(roomId: string, killerUsername: string, victimUsername: string): Promise<number> {
    const die = 1 + Math.floor(Math.random() * 8); // 1d8
    const exp = Math.round(10 * Math.pow(1.2, die)); // fórmula del PDF  :contentReference[oaicite:4]{index=4}

    const victimPlayer = await this.battleRepo.findById(roomId).then(b => b?.findPlayer(victimUsername));
    const armorsName = victimPlayer?.heroStats?.equipped?.armors.map(a => a.name) || [];
    const armorProb = victimPlayer?.heroStats?.equipped?.armors.map(a => a.dropRate) || [];
    const weaponsName = victimPlayer?.heroStats?.equipped?.weapons.map(w => w.name) || [];
    const weaponProb = victimPlayer?.heroStats?.equipped?.weapons.map(w => w.dropRate) || [];
    const itemName = victimPlayer?.heroStats?.equipped?.items.map(i => i.name) || [];
    const itemProb = victimPlayer?.heroStats?.equipped?.items.map(i => i.dropRate) || [];
    const epicName = victimPlayer?.heroStats?.equipped?.epicAbilites.map(e => e.name) || [];
    const epicProb = victimPlayer?.heroStats?.equipped?.epicAbilites.map(e => e.masterChance) || [];
    const maybeItemName = [...armorsName, ...weaponsName, ...itemName, ...epicName];
    const maybeItemProb = [...armorProb, ...weaponProb, ...itemProb, ...epicProb];
    const aleatoryRewardEffect = new AleatoryDropRateEffect(
      maybeItemProb,
      maybeItemName
    );

    const lostItem = aleatoryRewardEffect.generateAleatoryEffect();
    const payload: RewardPayload = {
      Rewards: { playerRewarded: killerUsername, credits: 0, exp },
      WonItem: 
        { originPlayer: victimUsername, itemName: lostItem }
    };
    console.log("RewardService: awarding kill exp with payload", payload);
    await this.rewardRepo.awardBattleEnd(roomId, payload);
    return exp;
  }

  async deleteAward(roomId: string, playerRevived: string): Promise<void> {
    await this.rewardRepo.deleteAward(roomId, playerRevived);
  }

  // ------------ helpers ------------
  private buildPayload(player: string, credits: number, exp: number, originPlayer: string[], itemName: string[]): RewardsRequest {
    return {
      Rewards: { playerRewarded: player, credits, exp },
      WonItem: originPlayer.map((op, i) => ({ originPlayer: op, itemName: itemName[i] ?? "" })) || []
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
