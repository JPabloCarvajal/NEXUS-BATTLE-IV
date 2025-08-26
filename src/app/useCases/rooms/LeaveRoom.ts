import { RoomRepository } from "./RoomRepository";

export class LeaveRoom {
  constructor(private repo: RoomRepository) {}

  async execute(roomId: string, playerId: string): Promise<boolean> {
    const room = await this.repo.findById(roomId);
    if (!room) throw new Error("Room not found");

    room.removePlayer(playerId);
    if (room.Players.length === 0) {

      this.repo.delete(roomId);
      return true;
    } else {

      this.repo.save(room);
      return false;
    }
  }
}
