import { RoomRepository } from "./RoomRepository";
import { Room } from "../../../domain/entities/Room";

export class GetAllRooms {
  constructor(private repo: RoomRepository) {}

  async execute(): Promise<Room[]> {
    return await this.repo.findAll();
  }
}
