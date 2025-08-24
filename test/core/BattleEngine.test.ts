import { BattleEngine } from "../../src/core/BattleEngine"
import type { Hero } from "../../src/model/gameInterfaces/Hero"
import { BattleEventType } from "../../src/model/Enums"

describe("BattleEngine", () => {
    let battleEngine: BattleEngine
    let mockHero: Hero

    beforeEach(() => {
        battleEngine = new BattleEngine()
        mockHero = {
            id: "hero1",
            name: "Test Hero",
            health: 100,
            maxHealth: 100,
            power: 8,
            maxPower: 10,
            attack: 20,
            defense: 10,
            speed: 15,
            isAlive: true,
            effects: [],
        }
    })

    describe("Hero Elimination", () => {
        test("should eliminate hero when health reaches 0", () => {
            const events = battleEngine.applyDamage(mockHero, 100)

            expect(mockHero.health).toBe(0)
            expect(mockHero.isAlive).toBe(false)
            expect(events).toContainEqual(
                expect.objectContaining({
                    type: BattleEventType.HERO_ELIMINATED,
                    heroId: "hero1",
                }),
            )
        })

        test("should not eliminate hero when health is above 0", () => {
            const events = battleEngine.applyDamage(mockHero, 50)

            expect(mockHero.health).toBe(50)
            expect(mockHero.isAlive).toBe(true)
            expect(events).not.toContainEqual(
                expect.objectContaining({
                    type: BattleEventType.HERO_ELIMINATED,
                }),
            )
        })

        test("should prevent negative health values", () => {
            const events = battleEngine.applyDamage(mockHero, 150)

            expect(mockHero.health).toBe(0)
            expect(mockHero.isAlive).toBe(false)
        })
    })

    describe("Power Regeneration", () => {
        test("should regenerate 2 power points for alive hero", () => {
            mockHero.power = 5
            const events = battleEngine.regeneratePower(mockHero)

            expect(mockHero.power).toBe(7)
            expect(events).toContainEqual(
                expect.objectContaining({
                    type: BattleEventType.POWER_REGENERATION,
                    heroId: "hero1",
                    powerGained: 2,
                }),
            )
        })

        test("should not exceed maximum power", () => {
            mockHero.power = 9
            mockHero.maxPower = 10
            const events = battleEngine.regeneratePower(mockHero)

            expect(mockHero.power).toBe(10)
            expect(events).toContainEqual(
                expect.objectContaining({
                    powerGained: 1,
                }),
            )
        })

        test("should not regenerate power for dead heroes", () => {
            mockHero.isAlive = false
            mockHero.power = 5
            const events = battleEngine.regeneratePower(mockHero)

            expect(mockHero.power).toBe(5)
            expect(events).toHaveLength(0)
        })

        test("should not regenerate power when already at maximum", () => {
            mockHero.power = 10
            mockHero.maxPower = 10
            const events = battleEngine.regeneratePower(mockHero)

            expect(mockHero.power).toBe(10)
            expect(events).toHaveLength(0)
        })
    })

    describe("Revival Mechanics", () => {
        test("should revive hero with revival ability", () => {
            mockHero.isAlive = false
            mockHero.health = 0

            const events = battleEngine.reviveHero(mockHero, 50)

            expect(mockHero.isAlive).toBe(true)
            expect(mockHero.health).toBe(50)
            expect(events).toContainEqual(
                expect.objectContaining({
                    type: BattleEventType.HERO_REVIVED,
                    heroId: "hero1",
                }),
            )
        })

        test("should not revive already alive hero", () => {
            const events = battleEngine.reviveHero(mockHero, 50)

            expect(events).toHaveLength(0)
        })
    })
})
