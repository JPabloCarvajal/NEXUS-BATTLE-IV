import { Player } from "./Player";

export type GameMode = "1v1" | "2v2" | "3v3";

export type RoomPhase = "LOBBY" | "PREPARING" | "IN_PROGRESS" | "FINISHED";

export interface RoomConfig {
  id: string;
  mode: GameMode;
  allowAI: boolean;
  credits: number;
  heroLevel: number;
  ownerId: string;
}

export class Room {
  private players: Player[] = [];
  private teamA: Player[] = [];
  private teamB: Player[] = [];
  private phase: RoomPhase = "LOBBY";
  private config: RoomConfig;

  constructor(config: RoomConfig) {
    if (config.heroLevel < 1 || config.heroLevel > 8) {
      throw new Error("Hero level must be between 1 and 8");
    }
    this.config = config;
  }

  static fromJSON(data: any): Room {
    const room = new Room({
      id: data.config.id,
      mode: data.config.mode,
      allowAI: data.config.allowAI,
      credits: data.config.credits,
      heroLevel: data.config.heroLevel,
      ownerId: data.config.ownerId,
    });

    room.players = data.players.map((p: any) => Player.fromJSON(p));
    room.teamA = data.teamA.map((p: any) => Player.fromJSON(p));
    room.teamB = data.teamB.map((p: any) => Player.fromJSON(p));
    room.phase = data.phase;

    return room;
  }

  get id() {
    return this.config.id;
  }

  get settings() {
    return this.config;
  }

  get currentPlayers() {
    return this.players;
  }

  get capacity() {
    switch (this.config.mode) {
      case "1v1": return 2;
      case "2v2": return 4;
      case "3v3": return 6;
    }
  }

  get TeamA(){
    return this.teamA;
  }

  get TeamB(){
    return this.teamB;
  }

  get Phase() {
      return this.phase;
  }

  get Players() {
      return this.players;
  }

  set Players(players: Player[]) {
      this.players = players;
  }

  set TeamA(players: Player[]) {
      this.teamA = players;
  }

  set TeamB(players: Player[]) {
      this.teamB = players;
  }

  set Phase(phase: RoomPhase) {
      this.phase = phase;
  }

  addPlayer(player: Player) {
    if (this.players.length >= this.capacity) {
      throw new Error("Room is full");
    }
    if (this.players.find(item => item.username === player.username)){
      throw new Error("User already in the room");
    }
    if (player.heroLevel !== this.config.heroLevel) {
      throw new Error("Player does not meet the hero level");
    }
    this.players.push(player);
  }

  setHeroStats(username: string, stats: NonNullable<Player["heroStats"]>) {
    const player = this.players.find(p => p.username === username);
    if (!player) throw new Error("Player not in room");
    player.heroStats = stats;
  }

  setPlayerReady(username: string, team: "A" | "B") {
      const player = this.players.find(p => p.username === username);
      if (!player) throw new Error("Player not in room");
      switch(team){
        case "A":
          if (this.teamA.length < this.capacity / 2) {
            this.teamA.push(player);
          } else {
            throw new Error("Team A is full");
          }
          break;
        case "B":
          if (this.teamB.length < this.capacity / 2) {
            this.teamB.push(player);
          } else {
            throw new Error("Team B is full");
          }
          break;
      }
      player.ready = true;

      if (this.players.length === this.capacity && this.players.every(p => p.ready)) {
      this.phase = "PREPARING";
      }
  }

  allPlayersReady(): boolean {
      return this.players.length === this.capacity && this.players.every(p => p.ready);
  }

  removePlayer(username: string): void {
    
    const index = this.players.findIndex(p => p.username === username);

    if (index === -1) throw new Error("Player not in room");
    this.players.splice(index, 1);


    this.teamA = this.teamA.filter(p => p.username !== username);
    this.teamB = this.teamB.filter(p => p.username !== username);

    if (!this.allPlayersReady()) {
      this.phase = "LOBBY";
    }

    if (this.players.length === 0) {
      this.phase = "FINISHED";
    }
  }




}
