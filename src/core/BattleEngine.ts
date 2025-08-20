import type Battle from "../model/battleRoomInterfaces/Battle"
import type BattleEvent from "../model/battleRoomInterfaces/BattleEvent"
import type Player from "../model/battleRoomInterfaces/Player"
import type Hero from "../model/gameInterfaces/Hero"
import type Effect from "../model/gameInterfaces/Effect"
import { BattleEventType, EffectType, HeroState, RoomState } from "../model/Enums"
import AleatoryValueGenerator from "../model/aleatoryValueGenerator/aleatoryValue"

/**
 * BattleEngine: Core battle system that handles combat mechanics,
 * damage calculation, hero elimination, and game state management.
 */
export default class BattleEngine {
    private battle: Battle
    private randomGenerator: AleatoryValueGenerator

    constructor(battle: Battle) {
        this.battle = battle
        this.randomGenerator = new AleatoryValueGenerator(Date.now())
    }

    /**
     * Processes an attack from one player to another, handling damage calculation,
     * hero elimination, and revival mechanics according to the user story requirements.
     */
    public processAttack(attacker: Player, target: Player, effect: Effect): BattleEvent {
        const damage = this.calculateDamage(attacker.selectedHero, target.selectedHero, effect)
        const originalHealth = target.selectedHero.health

        // Apply damage to target hero
        target.selectedHero.health = Math.max(0, target.selectedHero.health - damage)

        let outcome = `${attacker.name}'s ${attacker.selectedHero.heroType} attacks ${target.name}'s ${target.selectedHero.heroType} for ${damage} damage`

        if (target.selectedHero.health === 0 && originalHealth > 0) {
            outcome += `. ${target.name}'s hero is eliminated from combat!`

            // Check for revival abilities before eliminating
            const hasRevivalAbility = this.checkForRevivalAbility(target)

            if (hasRevivalAbility) {
                this.reviveHero(target)
                outcome += ` But ${target.name}'s hero is revived and rejoins the battle!`
            } else {
                this.eliminateHero(target)

                // Check if this was the last hero of the team
                if (this.isTeamEliminated(target)) {
                    outcome += ` ${target.name} has been defeated - no heroes remaining!`
                    this.endBattle(target)
                }
            }
        }

        const battleEvent: BattleEvent = {
            origin: attacker,
            appliedEffect: effect,
            target: target,
            outCome: outcome,
            eventType: target.selectedHero.health === 0 ? BattleEventType.DEATH : BattleEventType.ATTACK,
        }

        this.battle.actionLog.push(battleEvent)
        return battleEvent
    }

    /**
     * Calculates damage based on hero stats and dice notation (e.g., "1d6", "10 + 1d8")
     */
    private calculateDamage(attacker: Hero, defender: Hero, effect: Effect): number {
        let baseDamage = 0

        // Parse damage from effect value or hero damage stat
        const damageValue = effect.effectType === EffectType.DAMAGE ? effect.value : attacker.damage.toString()
        baseDamage = this.parseDiceNotation(damageValue)

        // Apply attack vs defense calculation
        const attackRoll = this.parseDiceNotation(attacker.attack.toString())
        const finalDamage = Math.max(1, baseDamage + attackRoll - defender.defense)

        return finalDamage
    }

    /**
     * Parses dice notation strings like "1d6", "10 + 1d8", "2d4" into actual values
     */
    private parseDiceNotation(notation: string): number {
        if (!notation || notation === "null") return 0

        let total = 0
        const parts = notation.split("+").map((part) => part.trim())

        for (const part of parts) {
            if (part.includes("d")) {
                const [count, sides] = part.split("d").map((n) => Number.parseInt(n.trim()))
                for (let i = 0; i < count; i++) {
                    total += (this.randomGenerator.nextGameValue() % sides) + 1
                }
            } else {
                total += Number.parseInt(part) || 0
            }
        }

        return total
    }

    /**
     * Checks if the hero has any revival abilities or items
     */
    private checkForRevivalAbility(player: Player): boolean {
        const hero = player.selectedHero

        // Check special actions for revival abilities
        for (const action of hero.specialActions) {
            if (action.effect.effectType === EffectType.REVIVE && action.isAvailable) {
                return true
            }
        }

        // Check equipment for revival items (would need to implement equipment checking)
        // This is a placeholder for future revival item implementation

        return false
    }

    /**
     * Revives a hero with appropriate health restoration
     */
    private reviveHero(player: Player): void {
        const hero = player.selectedHero

        // Find and use revival ability
        for (const action of hero.specialActions) {
            if (action.effect.effectType === EffectType.REVIVE && action.isAvailable) {
                // Parse revival value (e.g., "100% heal", "20% HP")
                if (action.effect.value.includes("100%")) {
                    hero.health = this.getMaxHealth(hero)
                } else if (action.effect.value.includes("20%")) {
                    hero.health = Math.floor(this.getMaxHealth(hero) * 0.2)
                } else {
                    hero.health = Math.floor(this.getMaxHealth(hero) * 0.5) // Default 50%
                }

                hero.state = HeroState.ALIVE
                action.isAvailable = false // Use up the revival ability
                break
            }
        }
    }

    /**
     * Eliminates a hero from combat, setting state to DEAD and clearing temporary effects
     */
    private eliminateHero(player: Player): void {
        const hero = player.selectedHero
        hero.state = HeroState.DEAD
        hero.health = 0

        this.clearHeroStatistics(hero)
    }

    /**
     * Clears temporary effects and resets combat-related statistics for eliminated hero
     */
    private clearHeroStatistics(hero: Hero): void {
        // Reset special action availability
        hero.specialActions.forEach((action) => {
            action.cooldown = 0
            if (action.effect.effectType !== EffectType.REVIVE) {
                action.isAvailable = true
            }
        })

        // Clear any temporary stat modifications (would expand based on effect system)
        // This is where temporary boosts, debuffs, etc. would be cleared
    }

    /**
     * Checks if all heroes of a player's team are eliminated
     */
    private isTeamEliminated(player: Player): boolean {
        // In this implementation, each player has one hero
        // For team-based battles, this would check all team members
        return player.selectedHero.state === HeroState.DEAD
    }

    /**
     * Ends the battle when a team is completely eliminated
     */
    private endBattle(defeatedPlayer: Player): void {
        // Set battle room state to finished
        this.battle.room.state = RoomState.FINISHED

        // Log final battle event
        const finalEvent: BattleEvent = {
            origin: defeatedPlayer,
            appliedEffect: { effectType: EffectType.DAMAGE, value: "0", durationTurns: 0 },
            target: defeatedPlayer,
            outCome: `Battle ended - ${defeatedPlayer.name} has been defeated!`,
            eventType: BattleEventType.DEATH,
        }

        this.battle.actionLog.push(finalEvent)
    }

    /**
     * Gets the maximum health for a hero based on their type and level
     */
    private getMaxHealth(hero: Hero): number {
        // This would typically be calculated based on hero type, level, and equipment
        // For now, using the base health values from the database
        const baseHealthMap: { [key: string]: number } = {
            TANK: 44,
            WEAPONS_PAL: 44,
            FIRE_MAGE: 40,
            ICE_MAGE: 40,
            POISON_ROGUE: 36,
            SHAMAN: 28,
            MEDIC: 28,
        }

        return baseHealthMap[hero.heroType.toString()] || 30
    }

    /**
     * Processes healing effects on a hero
     */
    public processHeal(healer: Player, target: Player, effect: Effect): BattleEvent {
        const healAmount = this.parseDiceNotation(effect.value)
        const maxHealth = this.getMaxHealth(target.selectedHero)
        const originalHealth = target.selectedHero.health

        target.selectedHero.health = Math.min(maxHealth, target.selectedHero.health + healAmount)
        const actualHeal = target.selectedHero.health - originalHealth

        const outcome = `${healer.name} heals ${target.name} for ${actualHeal} health`

        const battleEvent: BattleEvent = {
            origin: healer,
            appliedEffect: effect,
            target: target,
            outCome: outcome,
            eventType: BattleEventType.SPECIAL_ACTION,
        }

        this.battle.actionLog.push(battleEvent)
        return battleEvent
    }

    /**
     * Checks if a hero can perform actions (must be alive)
     */
    public canHeroAct(player: Player): boolean {
        return player.selectedHero.state === HeroState.ALIVE && player.selectedHero.health > 0
    }

    /**
     * Regenerates power for a hero at the end of their turn.
     * Heroes automatically recover 2 power points per turn, up to their maximum.
     */
    public regeneratePower(player: Player): BattleEvent | null {
        const hero = player.selectedHero

        // Don't regenerate power for dead heroes
        if (hero.state === HeroState.DEAD || hero.health <= 0) {
            return null
        }

        const maxPower = this.getMaxPower(hero)
        const currentPower = hero.power
        const powerToRegenerate = 2

        // Don't regenerate if already at maximum power
        if (currentPower >= maxPower) {
            return null
        }

        // Apply power regeneration, capped at maximum
        const newPower = Math.min(maxPower, currentPower + powerToRegenerate)
        const actualRegeneration = newPower - currentPower
        hero.power = newPower

        const outcome = `${player.name}'s ${hero.heroType} regenerates ${actualRegeneration} power points (${currentPower} → ${newPower})`

        const battleEvent: BattleEvent = {
            origin: player,
            appliedEffect: {
                effectType: EffectType.POWER_REGENERATION,
                value: actualRegeneration.toString(),
                durationTurns: 0,
            },
            target: player,
            outCome: outcome,
            eventType: BattleEventType.POWER_REGENERATION,
        }

        this.battle.actionLog.push(battleEvent)
        return battleEvent
    }

    /**
     * Gets the maximum power for a hero based on their type and level
     */
    private getMaxPower(hero: Hero): number {
        // Base power values from the database
        const basePowerMap: { [key: string]: number } = {
            TANK: 10,
            WEAPONS_PAL: 8,
            FIRE_MAGE: 8,
            ICE_MAGE: 10,
            POISON_ROGUE: 8,
            SHAMAN: 10,
            MEDIC: 10,
        }

        return basePowerMap[hero.heroType.toString()] || 8
    }
}
