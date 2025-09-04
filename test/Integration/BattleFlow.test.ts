import { BattleManager } from "../../src/core/BattleManager"
import { BattleEngine } from "../../src/core/BattleEngine"
import type { Battle } from "../../src/model/battleRoomInterfaces/Battle"
import type { Hero } from "../../src/model/gameInterfaces/Hero"
import { BattleStatus, BattleEventType } from "../../src/model/Enums"

describe("Battle Flow Integration", () => {
    let battleManager: BattleManager
    let battleEngine: BattleEngine
    let mockBattle: Battle

    beforeEach(() => {
        battleManager = new BattleManager()
        battleEngine = new BattleEngine()

        const hero1: Hero = {
            id: "hero1",
            name: "Warrior",
            health: 50,
            maxHealth: 100,
            power: 3,
            maxPower: 10,
            attack: 30,
            defense: 10,
            speed: 15,
            isAlive: true,
            effects: [],
        }

        const hero2: Hero = {
            id: "hero2",
            name: "Mage",
            health: 40,
            maxHealth: 80,
            power: 8,
            maxPower: 8,
            attack: 25,
            defense: 5,
            speed: 12,
            isAlive: true,
            effects: [],
        }

        mockBattle = {
            id: "integration-battle",
            player1: {
                id: "player1",
                name: "Player 1",
                heroes: [hero1],
                isReady: true,
            },
            player2: {
                id: "player2",
                name: "Player 2",
                heroes: [hero2],
                isReady: true,
            },
            status: BattleStatus.IN_PROGRESS,
            currentTurn: 0,
            turnOrder: ["hero1", "hero2"],
            events: [],
        }
    })

    test("Complete battle scenario with elimination and power regeneration", () => {
        // Turn 1: Hero1 attacks Hero2
        let events = battleManager.processTurn(mockBattle, "hero1", {
            type: "attack",
            targetId: "hero2",
        })

        // Check power regeneration occurred
        expect(mockBattle.player1.heroes[0].power).toBe(5) // 3 + 2
        expect(events.some((e) => e.type === BattleEventType.POWER_REGENERATION)).toBe(true)

        // Turn 2: Hero2 attacks Hero1 (should eliminate Hero1)
        events = battleManager.processTurn(mockBattle, "hero2", {
            type: "attack",
            targetId: "hero1",
        })

        // Check if Hero1 was eliminated
        expect(mockBattle.player1.heroes[0].isAlive).toBe(false)
        expect(events.some((e) => e.type === BattleEventType.HERO_ELIMINATED)).toBe(true)

        // Check game over
        const isGameOver = battleManager.checkGameOver(mockBattle)
        expect(isGameOver).toBe(true)
        expect(mockBattle.status).toBe(BattleStatus.FINISHED)
    })

    test("Power regeneration limits and edge cases", () => {
        // Set hero2 to max power
        mockBattle.player2.heroes[0].power = 8

        const events = battleManager.processTurn(mockBattle, "hero2", {
            type: "defend",
        })

        // Should not regenerate power when at max
        expect(mockBattle.player2.heroes[0].power).toBe(8)
        expect(events.some((e) => e.type === BattleEventType.POWER_REGENERATION)).toBe(false)
    })

    test("Revival mechanics integration", () => {
        // Eliminate hero1
        mockBattle.player1.heroes[0].isAlive = false
        mockBattle.player1.heroes[0].health = 0

        // Revive hero1
        const events = battleEngine.reviveHero(mockBattle.player1.heroes[0], 30)

        expect(mockBattle.player1.heroes[0].isAlive).toBe(true)
        expect(mockBattle.player1.heroes[0].health).toBe(30)
        expect(events.some((e) => e.type === BattleEventType.HERO_REVIVED)).toBe(true)

        // Game should continue
        const isGameOver = battleManager.checkGameOver(mockBattle)
        expect(isGameOver).toBe(false)
    })
})
