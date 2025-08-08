import AleatoryDropRateEffect from "../../../src/model/aleatoryEffectsGenerator/impl/aleatoryDropRateEffect";
import AleatoryVariableGenerationManager from "../../../src/model/aleatoryValueGenerator/aleatoryVariableGenerationManager";
import AleatoryValueGenerator from "../../../src/model/aleatoryValueGenerator/aleatoryValue";


jest.mock("../../../src/model/aleatoryValueGenerator/aleatoryVariableGenerationManager");

/**
 * Test suite for AleatoryDropRateEffect based on 'Guerrero Armas' products probabilities.
 * This suite tests the generation of aleatory drop rate effects based on predefined probabilities and outcomes.
 * It ensures that the effects are generated correctly based on the random values produced by the AleatoryValueGenerator.
 * The probabilities and outcomes are based on the 'Guerrero Armas' products scenario.
 * The tests cover various scenarios including expected outcomes for specific random values, ensuring that the effects are generated as intended.
 */
describe("AleatoryDropRateEffect based on 'Guerrero Armas' products probabilities", () => {
    /**
     * Test to ensure that the effect 'Piedra de afilar' is returned when the random value is within the specified range.
     * The random value is set to 150, which should correspond to the 'Piedra de afilar' outcome based on the probabilities.
     */
    it("Should return 'Piedra de afilar' as the correct effect drop rate value", () => {
        const mockGenerator = {
            nextGameValue: jest.fn().mockReturnValue(150),
        } as unknown as AleatoryValueGenerator;

        (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);

        const probabilities = [0.02, 0.02, 0.02, 0.1, 0.0001];
        const outcomes = ["Piedra de afilar", "Puño lúcido", "Puños en llamas", "Empuñadura de Furia", "Segundo Impulso"];
        const effect = new AleatoryDropRateEffect(probabilities, outcomes);

        const result = effect.generateAleatoryEffect();

        expect(result).toBe("Piedra de afilar");
        expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1);
    });

    /**
     * Test to ensure that the effect 'Puño lúcido' is returned when the random value is within the specified range.
     * The random value is set to 300, which should correspond to the 'Puño lúcido' outcome based on the probabilities.
     */
    it("Should return 'Puño lúcido' as the correct effect drop rate value", () => {
        const mockGenerator = {
            nextGameValue: jest.fn().mockReturnValue(300),
        } as unknown as AleatoryValueGenerator;

        (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);

        const probabilities = [0.02, 0.02, 0.02, 0.1, 0.0001];
        const outcomes = ["Piedra de afilar", "Puño lúcido", "Puños en llamas", "Empuñadura de Furia", "Segundo Impulso"];
        const effect = new AleatoryDropRateEffect(probabilities, outcomes);

        const result = effect.generateAleatoryEffect();

        expect(result).toBe("Puño lúcido");
        expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1);
    });

    /**
     * Test to ensure that the effect 'Puños en llamas' is returned when the random value is within the specified range.
     * The random value is set to 450, which should correspond to the 'Puños en llamas' outcome based on the probabilities.
     */
    it("Should return 'Puños en llamas' as the correct effect value", () => {
        const mockGenerator = {
            nextGameValue: jest.fn().mockReturnValue(450),
        } as unknown as AleatoryValueGenerator;

        (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);

        const probabilities = [0.02, 0.02, 0.02, 0.1, 0.0001];
        const outcomes = ["Piedra de afilar", "Puño lúcido", "Puños en llamas", "Empuñadura de Furia", "Segundo Impulso"];
        const effect = new AleatoryDropRateEffect(probabilities, outcomes);

        const result = effect.generateAleatoryEffect();

        expect(result).toBe("Puños en llamas");
        expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1);
    });

    /**
     * Test to ensure that the effect 'Empuñadura de Furia' is returned when the random value is within the specified range.
     * The random value is set to 800, which should correspond to the 'Empuñadura de Furia' outcome based on the probabilities.
     */
    it("Should return 'Empuñadura de Furia' as the correct effect value", () => {
        const mockGenerator = {
            nextGameValue: jest.fn().mockReturnValue(800),
        } as unknown as AleatoryValueGenerator;

        (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);

        const probabilities = [0.02, 0.02, 0.02, 0.1, 0.0001];
        const outcomes = ["Piedra de afilar", "Puño lúcido", "Puños en llamas", "Empuñadura de Furia", "Segundo Impulso"];
        const effect = new AleatoryDropRateEffect(probabilities, outcomes);

        const result = effect.generateAleatoryEffect();

        expect(result).toBe("Empuñadura de Furia");
        expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1);
    });

    /**
     * Test to ensure that the effect 'Segundo Impulso' is returned when the random value is within the specified range.
     * The random value is set to 1281, which should correspond to the 'Segundo Impulso' outcome based on the probabilities.
     */
    it("Should return 'Segundo Impulso' as the correct effect value", () => {
        const mockGenerator = {
            nextGameValue: jest.fn().mockReturnValue(1281),
        } as unknown as AleatoryValueGenerator;

        (AleatoryVariableGenerationManager.getInstance as jest.Mock).mockReturnValue(mockGenerator);

        const probabilities = [0.02, 0.02, 0.02, 0.1, 0.0001];
        const outcomes = ["Piedra de afilar", "Puño lúcido", "Puños en llamas", "Empuñadura de Furia", "Segundo Impulso"];
        const effect = new AleatoryDropRateEffect(probabilities, outcomes);

        const result = effect.generateAleatoryEffect();

        expect(result).toBe("Segundo Impulso");
        expect(mockGenerator.nextGameValue).toHaveBeenCalledTimes(1); 
    });  
});
