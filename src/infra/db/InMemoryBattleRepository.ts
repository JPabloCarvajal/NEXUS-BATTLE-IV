import { BattleRepository } from "../../app/useCases/battle/BattleRepository";
import { Battle } from "../../domain/entities/Battle";

export default class InMemoryBattleRepository implements BattleRepository{
    private battles: Map<String, Battle>;
    private static instance: InMemoryBattleRepository;
    constructor(){
        this.battles = new Map<String, Battle>();
    }

    public static getInstance(){
        if (!this.instance){
            this.instance = new InMemoryBattleRepository();
        }
        return this.instance;
    }


    save(battle: Battle): void {
        this.battles.set(battle.id, battle);
    }
    findById(battleId: string): Battle | undefined {
        return this.battles.get(battleId);
    }
    delete(battleId: string): void {
        this.battles.delete(battleId);
    }
    
}