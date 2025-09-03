import Hero from "../gameInterfaces/Hero";

export default interface Player {
  playerId: string;
  name: string;
  isLoggedIn: boolean;
  credits: number;
  selectedHero: Hero;
  inventory: string[];
}
