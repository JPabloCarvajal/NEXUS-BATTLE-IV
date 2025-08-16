import { Room } from "../../domain/entities/Room";

export interface RoomRepository {
  save(room: Room): void;
  findById(id: string): Room | undefined;
}
