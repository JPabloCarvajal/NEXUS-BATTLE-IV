import { BattleManager } from "../../src/core/BattleManager"
import type { Battle } from "../../src/model/battleRoomInterfaces/Battle"
import type { Hero } from "../../src/model/gameInterfaces/Hero"
import { BattleEventType, BattleStatus } from "../../src/model/Enums"

describe("BattleManager", () => {
    let battleManager: BattleManager
    let mockBattle: Battle
    let mockHeroes: Hero[]

    beforeEach(() => {
        battleManager = new BattleManager()

        mockHeroes = [
            {
                id: "hero1",
                name: "Hero 1",
                health: 100,
                maxHealth: 100,
                power: 8,
                maxPower: 10,
                attack: 20,
                defense: 10,
                speed: 15,
                isAlive: true,
                effects: [],
            },
            {
                id: "hero2",
                name: "Hero 2",
                health: 80,
                maxHealth: 100,
                power: 6,
                maxPower: 8,
                attack: 25,
                defense: 8,
                speed: 12,
                isAlive: true,
                effects: [],
            },
        ]

        mockBattle = {
            id: "battle1",
            player1: {
                id: "player1",
                name: "Player 1",
                heroes: [mockHeroes[0]],
                isReady: true,
            },
            player2: {
                id: "player2",
                name: "Player 2",
                heroes: [mockHeroes[1]],
                isReady: true,
            },
            status: BattleStatus.IN_PROGRESS,
            currentTurn: 0,
            turnOrder: ["hero1", "hero2"],
            events: [],
        }
    })

    describe("Turn Processing", () => {
        test("should process turn and regenerate power", () => {
            mockHeroes[0].power = 5
            const events = battleManager.processTurn(mockBattle, "hero1", {
                type: "attack",
                targetId: "hero2",
            })

            expect(mockHeroes[0].power).toBe(7) // 5 + 2 regeneration
            expect(events.some((e) => e.type === BattleEventType.POWER_REGENERATION)).toBe(true)
        })

        test("should advance to next turn", () => {
            const initialTurn = mockBattle.currentTurn
            battleManager.processTurn(mockBattle, "hero1", {
                type: "attack",
                targetId: "hero2",
            })

            expect(mockBattle.currentTurn).toBe(initialTurn + 1)
        })
    })

    describe("Game Over Detection", () => {
        test("should detect game over when all player heroes are eliminated", () => {
            mockBattle.player1.heroes[0].isAlive = false

            const isGameOver = battleManager.checkGameOver(mockBattle)

            expect(isGameOver).toBe(true)
            expect(mockBattle.status).toBe(BattleStatus.FINISHED)
        })

        test("should not detect game over when both players have alive heroes", () => {
            const isGameOver = battleManager.checkGameOver(mockBattle)

            expect(isGameOver).toBe(false)
            expect(mockBattle.status).toBe(BattleStatus.IN_PROGRESS)
        })
    })

    describe("Battle State Management", () => {
        test("should update battle events correctly", () => {
            const initialEventCount = mockBattle.events.length

            battleManager.processTurn(mockBattle, "hero1", {
                type: "attack",
                targetId: "hero2",
            })

            expect(mockBattle.events.length).toBeGreaterThan(initialEventCount)
        })

        test("should maintain turn order correctly", () => {
            const currentHero = mockBattle.turnOrder[mockBattle.currentTurn % mockBattle.turnOrder.length]
            expect(currentHero).toBe("hero1")

            battleManager.processTurn(mockBattle, "hero1", {
                type: "attack",
                targetId: "hero2",
            })

            const nextHero = mockBattle.turnOrder[mockBattle.currentTurn % mockBattle.turnOrder.length]
            expect(nextHero).toBe("hero2")
        })
    })
})
