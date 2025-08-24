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

  save(room: Room): Promise<void> {
    this.rooms.set(room.id, room);
    return Promise.resolve();
  }

  findById(id: string): Promise<Room | undefined> {
    return Promise.resolve(this.rooms.get(id));
  }

  delete(id: string): Promise<void> {
    this.rooms.delete(id);
    return Promise.resolve();
  }

  findAll(): Promise<Room[]> {
    return Promise.resolve(Array.from(this.rooms.values()));
  }
}

