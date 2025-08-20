import type Battle from "../model/battleRoomInterfaces/Battle"
import type BattleRoom from "../model/battleRoomInterfaces/BattleRoom"
import type Player from "../model/battleRoomInterfaces/Player"
import BattleEngine from "./BattleEngine"
import { RoomState } from "../model/Enums"
import type { Server } from "socket.io"

/**
 * BattleManager: Orchestrates battles, manages turns, and coordinates
 * between the battle engine and socket communications.
 */
export default class BattleManager {
    private battles: Map<string, Battle> = new Map()
    private battleEngines: Map<string, BattleEngine> = new Map()

    constructor(private io: Server) {}

    /**
     * Starts a battle in the given room
     */
    public startBattle(room: BattleRoom): Battle | null {
        if (room.participants.length < 2) {
            return null
        }

        const battle: Battle = {
            room: room,
            participants: [...room.participants],
            turnOrder: this.shufflePlayers([...room.participants]),
            currentTurn: room.participants[0],
            turnTime: 30, // 30 seconds per turn
            actionLog: [],
        }

        const battleEngine = new BattleEngine(battle)

        this.battles.set(room.id, battle)
        this.battleEngines.set(room.id, battleEngine)

        room.state = RoomState.IN_BATTLE

        // Notify all participants that battle has started
        this.io.to(room.id).emit("battleStarted", {
            battle: battle,
            message: "Battle has begun! Heroes, prepare for combat!",
        })

        return battle
    }

    /**
     * Processes a player's action during their turn
     */
    public processPlayerAction(roomId: string, player: Player, actionType: string, targetPlayer?: Player): boolean {
        const battle = this.battles.get(roomId)
        const battleEngine = this.battleEngines.get(roomId)

        if (!battle || !battleEngine) {
            return false
        }

        if (!battleEngine.canHeroAct(player)) {
            this.io.to(player.playerId).emit("actionFailed", {
                message: "Your hero cannot act - they have been eliminated from combat!",
            })
            return false
        }

        // Check if it's the player's turn
        if (battle.currentTurn.playerId !== player.playerId) {
            this.io.to(player.playerId).emit("actionFailed", {
                message: "It's not your turn!",
            })
            return false
        }

        let battleEvent

        // Process different action types
        switch (actionType) {
            case "attack":
                if (!targetPlayer) return false
                const damageEffect = { effectType: require("../model/Enums").EffectType.DAMAGE, value: "1d6", durationTurns: 1 }
                battleEvent = battleEngine.processAttack(player, targetPlayer, damageEffect)
                break

            case "heal":
                if (!targetPlayer) return false
                const healEffect = { effectType: require("../model/Enums").EffectType.HEAL, value: "1d4", durationTurns: 1 }
                battleEvent = battleEngine.processHeal(player, targetPlayer, healEffect)
                break

            default:
                return false
        }

        // Broadcast the battle event to all participants
        this.io.to(roomId).emit("battleEvent", {
            event: battleEvent,
            battle: battle,
        })

        if (battle.room.state === RoomState.FINISHED) {
            this.endBattle(roomId)
            return true
        }

        // Move to next turn
        this.nextTurn(battle)

        return true
    }

    /**
     * Advances to the next player's turn, skipping eliminated heroes
     */
    private nextTurn(battle: Battle): void {
        const battleEngine = this.battleEngines.get(battle.room.id)
        if (!battleEngine) return

        const powerRegenEvent = battleEngine.regeneratePower(battle.currentTurn)
        if (powerRegenEvent) {
            // Broadcast power regeneration event to all participants
            this.io.to(battle.room.id).emit("battleEvent", {
                event: powerRegenEvent,
                battle: battle,
            })
        }

        let nextPlayerIndex = battle.turnOrder.findIndex((p) => p.playerId === battle.currentTurn.playerId) + 1

        let attempts = 0
        while (attempts < battle.turnOrder.length) {
            if (nextPlayerIndex >= battle.turnOrder.length) {
                nextPlayerIndex = 0
            }

            const nextPlayer = battle.turnOrder[nextPlayerIndex]
            if (battleEngine.canHeroAct(nextPlayer)) {
                battle.currentTurn = nextPlayer
                break
            }

            nextPlayerIndex++
            attempts++
        }

        // Notify whose turn it is
        this.io.to(battle.room.id).emit("turnChanged", {
            currentPlayer: battle.currentTurn,
            message: `It's ${battle.currentTurn.name}'s turn!`,
            powerLevel: battle.currentTurn.selectedHero.power,
        })
    }

    /**
     * Ends a battle and cleans up resources
     */
    private endBattle(roomId: string): void {
        const battle = this.battles.get(roomId)
        if (!battle) return

        // Notify all participants that battle has ended
        this.io.to(roomId).emit("battleEnded", {
            battle: battle,
            message: "Battle has ended!",
        })

        // Clean up battle resources
        this.battles.delete(roomId)
        this.battleEngines.delete(roomId)
    }

    /**
     * Shuffles the player array to randomize turn order
     */
    private shufflePlayers(players: Player[]): Player[] {
        const shuffled = [...players]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }

    /**
     * Gets the current battle state for a room
     */
    public getBattle(roomId: string): Battle | undefined {
        return this.battles.get(roomId)
    }
}
