import { RoomRepository } from "../../app/useCases/rooms/RoomRepository";
import { Room } from "../../domain/entities/Room";
import { createClient } from "redis";

export default class RedisRoomRepository implements RoomRepository {
    private redisClient;
    private static RedisRoomRepositoryInstance: RedisRoomRepository;

    constructor() {
        this.redisClient = createClient({
            url: "redis://nexus-battle-iv-redis:6379"
        });

        this.redisClient.on("error", (err) => console.error("Redis Client Error", err));

        this.redisClient.connect();
    }

    public static getInstance(): RedisRoomRepository {
        if (!RedisRoomRepository.RedisRoomRepositoryInstance) {
            RedisRoomRepository.RedisRoomRepositoryInstance = new RedisRoomRepository();
        }
        return RedisRoomRepository.RedisRoomRepositoryInstance;
    }

    async save(room: Room): Promise<void> {
        await this.redisClient.set(`room:${room.id}`, JSON.stringify(room));
    }

    async findById(id: string): Promise<Room | undefined> {
        const roomData = await this.redisClient.get(`room:${id}`);
        const parsed = roomData ? JSON.parse(roomData) : undefined;
        const room = parsed ? Room.fromJSON(parsed) : undefined;
        return room;
    }

    async delete(id: string): Promise<void> {
        await this.redisClient.del(`room:${id}`);
    }

    async findAll(): Promise<Room[]> {
        const keys = await this.redisClient.keys("room:*");
        const rooms: Room[] = [];

        for (const key of keys) {
            const roomData = await this.redisClient.get(key);
            if (roomData) {
                const parsed = JSON.parse(roomData);
                const room = Room.fromJSON(parsed);
                rooms.push(room);
            }
        }

        return rooms;
    }
}