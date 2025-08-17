import { Room } from "../../domain/entities/Room";

// driven
export interface RoomRepository {
  save(room: Room): void;
  findById(id: string): Room | undefined;
  delete(id: string): void; 
  findAll(): Room[];
}
