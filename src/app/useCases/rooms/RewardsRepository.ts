import { RewardPayload } from "../../../infra/clients/InventoryApiClient";

export interface RewardsRepository {
    awardBattleEnd(roomId: string, reward: RewardPayload): Promise<void>;

    deleteAward(roomId: string, playerRevived: string): Promise<void>;

    getAwards(roomId: string, playerRewarded: string): Promise<RewardPayload[]>;
}