import { BattleRepository } from "../../app/useCases/battle/BattleRepository";
import { createClient } from "redis";
import { Battle } from "../../domain/entities/Battle";
export default class RedisBattleRepository implements BattleRepository {
    private redisClient;
    private static RedisBattleRepositoryInstance: RedisBattleRepository;

    constructor() {
        this.redisClient = createClient({
            url: "redis://nexus-battle-iv-redis:6379"
        });

        this.redisClient.on("error", (err) => console.error("Redis Client Error", err));

        this.redisClient.connect();
    }

    public static getInstance(): RedisBattleRepository {
        if (!RedisBattleRepository.RedisBattleRepositoryInstance) {
            RedisBattleRepository.RedisBattleRepositoryInstance = new RedisBattleRepository();
        }
        return RedisBattleRepository.RedisBattleRepositoryInstance;
    }

    async save(battle: Battle): Promise<void> {
        const battleData = {
            ...battle,
            initialPowers: Object.fromEntries(battle.initialPowers)
        };
        await this.redisClient.set(`battle:${battle.id}`, JSON.stringify(battleData));
    }
    async findById(battleId: string): Promise<Battle | undefined> {
        const data = await this.redisClient.get(`battle:${battleId}`);
        const parsed = data ? JSON.parse(data) : undefined;

        if (!parsed) return undefined;

        return Battle.fromJSON(parsed);
    }

    async delete(battleId: string): Promise<void> {
        await this.redisClient.del(`battle:${battleId}`);
    }


}