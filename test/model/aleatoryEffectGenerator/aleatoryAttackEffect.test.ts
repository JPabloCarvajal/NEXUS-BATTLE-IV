import AleatoryAttackEffect from "../../../src/model/aleatoryEffectsGenerator/impl/aleatoryAttackEffect";
import AleatoryVariableGenerationManager from "../../../src/model/aleatoryValueGenerator/aleatoryVariableGenerationManager";
import AleatoryValueGenerator from "../../../src/model/aleatoryValueGenerator/aleatoryValue";


jest.mock("../../../src/model/aleatoryValueGenerator/aleatoryVariableGenerationManager");

/**
 * Test suite for AleatoryAttackEffect based on 'Guerrero Armas' probabilities.
 * This suite tests the generation of aleatory attack effects based on predefined probabilities and outcomes.
 * It ensures that the effects are generated correctly based on the random values produced by the AleatoryValueGenerator.
 * The probabilities and outcomes are based on the 'Guerrero Armas' scenario.
 * The tests cover various scenarios including expected outcomes for specific random values, ensuring that the effects are generated as intended.
 */
describe("AleatoryAttackEffect based on 'Guerrero Armas' probabilities", () => {
    /**
     * Test to ensure that the effect 'Causar daño' is returned when the random value is within the specified range.
     * The random value is set to 4700, which should correspond to the 'Causar daño' outcome based on the probabilities.
     */
    it("Should return 'Causar daño' as the correct effect value", () => {
        const mockGenerator = {
            nextGameValue: jest.fn().mockReturnValue(4700),
        } as unknown as AleatoryValueGenerator;

        (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);

        const probabilities = [0.6, 0.05, 0.03, 0, 0.02];
        const outcomes = ["Causar daño", "Causar daño crítico", "Evaden el golpe", "Resisten el golpe", "Escapan al golpe"];
        const effect = new AleatoryAttackEffect(probabilities, outcomes);

        const result = effect.generateAleatoryEffect();

        expect(result).toBe("Causar daño");
        expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1);
    });

    /**
     * Test to ensure that the effect 'Causar daño crítico' is returned when the random value is within the specified range.
     * The random value is set to 5000, which should correspond to the 'Causar daño crítico' outcome based on the probabilities.
     */
    it("Should return 'Causar daño crítico' as the correct effect value", () => {
        const mockGenerator = {
            nextGameValue: jest.fn().mockReturnValue(5000),
        } as unknown as AleatoryValueGenerator;

        (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);

        const probabilities = [0.6, 0.05, 0.03, 0, 0.02];
        const outcomes = ["Causar daño", "Causar daño crítico", "Evaden el golpe", "Resisten el golpe", "Escapan al golpe"];
        const effect = new AleatoryAttackEffect(probabilities, outcomes);

        const result = effect.generateAleatoryEffect();

        expect(result).toBe("Causar daño crítico");
        expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1);
    });

    /**
     * Test to ensure that the effect 'Evaden el golpe' is returned when the random value is within the specified range.
     * The random value is set to 5300, which should correspond to the 'Evaden el golpe' outcome based on the probabilities.
     */
    it("Should return 'Evaden el golpe' as the correct effect value", () => {
        const mockGenerator = {
            nextGameValue: jest.fn().mockReturnValue(5300),
        } as unknown as AleatoryValueGenerator;

        (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);

        const probabilities = [0.6, 0.05, 0.03, 0, 0.02];
        const outcomes = ["Causar daño", "Causar daño crítico", "Evaden el golpe", "Resisten el golpe", "Escapan al golpe"];
        const effect = new AleatoryAttackEffect(probabilities, outcomes);

        const result = effect.generateAleatoryEffect();

        expect(result).toBe("Evaden el golpe");
        expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1);
    });

    /**
     * Test to ensure that the effect 'Escapan al golpe' is returned when the random value is within the specified range.
     * The random value is set to 5500, which should correspond to the 'Escapan al golpe' outcome based on the probabilities.
     */
    it("Should return 'Escapan al golpe' as the correct effect value", () => {
        const mockGenerator = {
            nextGameValue: jest.fn().mockReturnValue(5500),
        } as unknown as AleatoryValueGenerator;

        (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);

        const probabilities = [0.6, 0.05, 0.03, 0, 0.02];
        const outcomes = ["Causar daño", "Causar daño crítico", "Evaden el golpe", "Resisten el golpe", "Escapan al golpe"];
        const effect = new AleatoryAttackEffect(probabilities, outcomes);

        const result = effect.generateAleatoryEffect();

        expect(result).toBe("Escapan al golpe");
        expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1);
    });

    /**
     * Test to ensure that the effect 'Resisten el golpe' is never returned as a valid outcome.
     * This is to ensure that the effect 'Resisten el golpe' is not a valid outcome based on the probabilities.
     */
    it("Should never return 'Resisten el golpe' as the correct effect value", () => {
        for (let i = 0; i < 6000; i++) {
            const mockGenerator = {
                nextGameValue: jest.fn().mockReturnValue(i),
            } as unknown as AleatoryValueGenerator;
            (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);
            const probabilities = [0.6, 0.05, 0.03, 0, 0.02];
            const outcomes = ["Causar daño", "Causar daño crítico", "Evaden el golpe", "Resisten el golpe", "Escapan al golpe"];
            const effect = new AleatoryAttackEffect(probabilities, outcomes);
            const result = effect.generateAleatoryEffect();
            expect(result).not.toBe("Resisten el golpe");
            expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1);
        }
    });

        /**
     * Test to ensure that the effect 'No causa daño' is returned when the random value is outside the specified ranges.
     * The random value is set to 7900, which should correspond to the 'No causa daño' outcome based on the probabilities.
     */
    it("Should return 'No causa daño' when no effect matches", () => {
        const mockGenerator = {
            nextGameValue: jest.fn().mockReturnValue(7900),
        } as unknown as AleatoryValueGenerator;

        (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);

        const probabilities = [0.6, 0.05, 0.03, 0, 0.02];
        const outcomes = ["Causar daño", "Causar daño crítico", "Evaden el golpe", "Resisten el golpe", "Escapan al golpe"];
        const effect = new AleatoryAttackEffect(probabilities, outcomes);

        const result = effect.generateAleatoryEffect();

        expect(result).toBe("No causa daño");
        expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1);
    });
});
