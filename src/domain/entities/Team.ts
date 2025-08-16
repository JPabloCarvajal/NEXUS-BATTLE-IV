import { Player } from "./Player";

export class Team {
  constructor(
    public id: string,
    public players: Player[]
  ) {}
}
