import { Room } from "../../../domain/entities/Room";

// driven
export interface RoomRepository {
  save(room: Room): Promise<void>;
  findById(id: string): Promise<Room | undefined>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Room[]>;
}
