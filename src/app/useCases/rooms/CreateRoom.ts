import { Room, RoomConfig } from "../../../domain/entities/Room";
import { RoomRepository } from "./RoomRepository";

export class CreateRoom {
  constructor(private repo: RoomRepository) {}

  execute(config: RoomConfig): Room {
    const room = new Room(config);
    this.repo.save(room);
    return room;
  }
}
