import { Player } from "./Player";

export class Team {
  constructor(
    public id: string,
    public players: Player[]
  ) {}

  
  static fromJSON(data: any): Team {
    const players = data.players.map((p: any) => Player.fromJSON(p));
    return new Team(data.id, players);
  }
  
  findPlayer(playerUsername: string): Player | undefined {
    return this.players.find(player => player.username === playerUsername);
  }
}
