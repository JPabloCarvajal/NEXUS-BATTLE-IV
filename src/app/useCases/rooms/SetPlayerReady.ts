import { RoomRepository } from "./RoomRepository";

export class SetPlayerReady {
  constructor(private repo: RoomRepository) {}

  async execute(roomId: string, playerId: string, team: "A" | "B"): Promise<boolean> {
    const room = await this.repo.findById(roomId);
    if (!room) throw new Error("Room not found in DB");

    room.setPlayerReady(playerId, team);
    await this.repo.save(room);

    return room.allPlayersReady();
  }
}
