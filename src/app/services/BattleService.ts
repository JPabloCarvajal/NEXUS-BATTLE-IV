// application/services/BattleService.ts
import { Battle } from "../../domain/entities/Battle";
import { Team } from "../../domain/entities/Team";
import { RoomRepository } from "../rooms/RoomRepository";

export class BattleService {
  constructor(private roomRepository: RoomRepository) {}

  createBattleFromRoom(roomId: string): Battle {
    const room = this.roomRepository.findById(roomId);
    if (!room) throw new Error("Room not found");

    const teamA = new Team("A", room.TeamA);
    const teamB = new Team("B", room.TeamB);

    const turnOrder =  this.generateTurnOrder(teamA, teamB);

    const battle = new Battle(
      room.id,
      room.id,
      [teamA, teamB],
      turnOrder
    );

    battle.startBattle();
    return battle;
  }

  generateTurnOrder(teamA: Team, teamB: Team): string[] {

    const firstTeam = Math.random() < 0.5 ? teamA : teamB;
    const secondTeam = firstTeam === teamA ? teamB : teamA;

    const order: string[] = [];
    const maxLen = Math.max(teamA.players.length, teamB.players.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < firstTeam.players.length) order.push(firstTeam.players[i]?.username || "");
      if (i < secondTeam.players.length) order.push(secondTeam.players[i]?.username || "");
    }

    return order;
  }
}
