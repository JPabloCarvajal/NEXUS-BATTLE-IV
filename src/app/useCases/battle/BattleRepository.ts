import { Battle } from "../../../domain/entities/Battle";

export interface BattleRepository {
    save(battle: Battle): Promise<void>;
    findById(battleId: string): Promise<Battle | undefined>;
    delete(battleId: string): Promise<void>;
}