import { RoomRepository } from "./RoomRepository";

export class LeaveRoom {
  constructor(private repo: RoomRepository) {}

  execute(roomId: string, playerId: string): boolean {
    const room = this.repo.findById(roomId);
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
