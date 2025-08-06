import Hero from "../gameInterfaces/Hero"

export default interface Player{
    playerId: string
    name: string
    isLoggedIn: boolean
    credits: number // it also could be declared on the inventory section but for now it is here
    selectedHero: Hero
    inventory: string[] // to change
}