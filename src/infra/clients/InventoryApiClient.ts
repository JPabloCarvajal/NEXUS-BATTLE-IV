export interface RewardPayload {
  Rewards: {
    playerRewarded: string;
    credits: number; // 0 si solo EXP
    exp: number;     // 0 si solo créditos
  };
  WonItem: {
    originPlayer: string;
    itemName: string; // "" si no aplica
  };
}

export interface RewardsRequest {
    Rewards: {
      playerRewarded: string;
      credits: number;
      exp: number;
    };
    WonItem:{
      originPlayer: string;
      itemName: string;
    }[];
}


export class InventoryApiClient {
  constructor(
    // TODO especificar la url
    private rewardsUrl = "AGREGAR DESPUES",
    private apiKey = "AGREGAR DESPUES"
  ) {
    if (!this.rewardsUrl) {
      throw new Error("Missing INVENTORY_REWARDS_URL");
    }
  }

  async sendReward(payload: RewardsRequest): Promise<void> {
    const res = await fetch(this.rewardsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Inventory API ${res.status}: ${text}`);
    }
  }
}
