// domain/valueObjects/Action.ts
export type ActionType = "BASIC_ATTACK" | "SPECIAL_SKILL" | "MASTER_SKILL";

export interface Action {
  type: ActionType;
  sourcePlayerId: string;
  targetPlayerId: string;
  skillId?: string;
}
