import { RoomRepository } from "./RoomRepository";
import { HeroStats } from "../../../domain/entities/HeroStats";

export class AssignHeroStats {
  constructor(private repo: RoomRepository) {}

  async execute(roomId: string, playerId: string, stats: HeroStats): Promise<void> {
    const room = await this.repo.findById(roomId);
    if (!room) throw new Error("Room not found");

    room.setHeroStats(playerId, stats);
    await this.repo.save(room);
  }
}
