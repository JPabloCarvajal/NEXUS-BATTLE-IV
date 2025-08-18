import { Room } from "../../domain/entities/Room";
import { RoomRepository } from "../../app/useCases/rooms/RoomRepository";

export class InMemoryRoomRepository implements RoomRepository {
  private static instance: InMemoryRoomRepository;
  private rooms: Map<string, Room>;

  private constructor() {
    this.rooms = new Map<string, Room>();
  }

  public static getInstance(): InMemoryRoomRepository {
    if (!InMemoryRoomRepository.instance) {
      InMemoryRoomRepository.instance = new InMemoryRoomRepository();
    }
    return InMemoryRoomRepository.instance;
  }

  save(room: Room): void {
    this.rooms.set(room.id, room);
  }

  findById(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  delete(id: string): void {
    this.rooms.delete(id);
  }

  findAll(): Room[] {
    return Array.from(this.rooms.values());
  }
}

