import { RoomRepository } from "./RoomRepository";
import { Player } from "../../../domain/entities/Player";

export class JoinRoom {
  constructor(private repo: RoomRepository) {}

  execute(roomId: string, player: Player): void {
    const room = this.repo.findById(roomId);
    if (!room) throw new Error("Room not found");
    room.addPlayer(player);
    this.repo.save(room);
  }
}
