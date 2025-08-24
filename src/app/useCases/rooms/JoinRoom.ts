import { RoomRepository } from "./RoomRepository";
import { Player } from "../../../domain/entities/Player";

export class JoinRoom {
  constructor(private repo: RoomRepository) {}

  async execute(roomId: string, player: Player): Promise<void> {
    const room = await this.repo.findById(roomId);
    if (!room) throw new Error("Room not found");
    room.addPlayer(player);
    await this.repo.save(room);
  }
}
