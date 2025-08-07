import { describe, it, expect } from "@jest/globals";
import AleatoryValueGenerator from "../../../src/model/aleatoryValueGenerator/aleatoryValue";

describe("AleatoryValueGenerator", () => {
    it("Should produce the same first value for the same seed", () => {
        const seed = 999;
        const g1 = new AleatoryValueGenerator(seed);
        const g2 = new AleatoryValueGenerator(seed);

        const v1 = g1.nextGameValue();
        const v2 = g2.nextGameValue();

        expect(v1).toBe(v2);
    });

    it("Should produce the same sequence of values", () => {
        const seed = 999;
        const g1 = new AleatoryValueGenerator(seed);
        const g2 = new AleatoryValueGenerator(seed);

        const sequence1 = Array.from({ length: 10 }, () => g1.nextGameValue());
        const sequence2 = Array.from({ length: 10 }, () => g2.nextGameValue());

        expect(sequence1).toEqual(sequence2);
    });

    it("Should produce different values for different seeds", () => {
        const g1 = new AleatoryValueGenerator(999);
        const g2 = new AleatoryValueGenerator(888);

        const value1 = g1.nextGameValue();
        const value2 = g2.nextGameValue();

        expect(value1).not.toBe(value2);
    });

    it("Should generate different values for different time calls with the same seed", () => {
        const seed = 42;
        const generator = new AleatoryValueGenerator(seed);
        const values = new Set<number>();
        for (let i = 0; i < 8000; i++) {
            values.add(generator.nextGameValue());
        }
        expect(values.size).toBeGreaterThan(4000);
    });

    it("Should generate values within the specified range", () => {
        const generator = new AleatoryValueGenerator(999, 10, 100);
        for (let i = 0; i < 100; i++) {
            const value = generator.nextGameValue();
            expect(value).toBeGreaterThanOrEqual(10);
            expect(value).toBeLessThanOrEqual(100);
        }
    });

    it("Should clamp values between beginNumber and endNumber", () => {
        const generator = new AleatoryValueGenerator(999);

        for (let i = 0; i < 8000; i++) {
            const value = generator.nextGameValue();
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(8000);
        }
    });
});
