import { RoomRepository } from "./RoomRepository";

export class SetPlayerReady {
  constructor(private repo: RoomRepository) {}

  execute(roomId: string, playerId: string, team: "A" | "B"): boolean {
    const room = this.repo.findById(roomId);
    if (!room) throw new Error("Room not found in DB");

    room.setPlayerReady(playerId, team);
    this.repo.save(room);

    return room.allPlayersReady();
  }
}
