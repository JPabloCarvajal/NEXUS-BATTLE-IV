import { Battle } from "../../../domain/entities/Battle";

export interface BattleRepository {
    save(battle: Battle): void;
    findById(battleId: string): Battle | undefined;
    delete(battleId: string): void;
}