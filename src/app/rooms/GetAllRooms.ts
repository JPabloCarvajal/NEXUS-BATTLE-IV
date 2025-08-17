import { RoomRepository } from "./RoomRepository";
import { Room } from "../../domain/entities/Room";

export class GetAllRooms {
  constructor(private repo: RoomRepository) {}

  execute(): Room[] {
    return this.repo.findAll();
  }
}
