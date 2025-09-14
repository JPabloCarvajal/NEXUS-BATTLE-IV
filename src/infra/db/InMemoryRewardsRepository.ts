import { RewardsRepository } from "../../app/useCases/rooms/RewardsRepository";
import { RewardPayload } from "../clients/InventoryApiClient";

export default class InMemoryRewardsRepository implements RewardsRepository{

    private rewards: Map<string, RewardPayload[]> = new Map();
    private static instance: InMemoryRewardsRepository;

    public static getInstance(): InMemoryRewardsRepository {
        if (!InMemoryRewardsRepository.instance) {
            InMemoryRewardsRepository.instance = new InMemoryRewardsRepository();
        }
        return InMemoryRewardsRepository.instance;
    }

    constructor() {}

    async awardBattleEnd(roomId: string, reward: RewardPayload): Promise<void> {
        if (!this.rewards.has(roomId)) {
            this.rewards.set(roomId, []);
        }
        this.rewards.get(roomId)!.push(reward);
    }

    async deleteAward(roomId: string, playerRevived: string): Promise<void> {
        const rewardsForRoom = this.rewards.get(roomId);
        if (rewardsForRoom) {
            this.rewards.set(roomId, rewardsForRoom.filter(r => r.WonItem?.originPlayer !== playerRevived));
        }
    }

    async getAwards(roomId: string, playerRewarded: string): Promise<RewardPayload[]> {
        const rewardsForRoom = this.rewards.get(roomId) || [];
        return rewardsForRoom.filter(r => r.Rewards.playerRewarded === playerRewarded);
    }
}