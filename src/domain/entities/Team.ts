import { Player } from "./Player";

export class Team {
  constructor(
    public id: string,
    public players: Player[]
  ) {}

  findPlayer(playerUsername: string): Player | undefined {
    return this.players.find(player => player.username === playerUsername);
  }
}
