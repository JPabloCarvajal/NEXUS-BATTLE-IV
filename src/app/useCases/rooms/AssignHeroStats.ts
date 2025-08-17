import { RoomRepository } from "./RoomRepository";
import { HeroStats } from "../../../domain/entities/HeroStats";

export class AssignHeroStats {
  constructor(private repo: RoomRepository) {}

  execute(roomId: string, playerId: string, stats: HeroStats): void {
    const room = this.repo.findById(roomId);
    if (!room) throw new Error("Room not found");

    room.setHeroStats(playerId, stats);
    this.repo.save(room);
  }
}
