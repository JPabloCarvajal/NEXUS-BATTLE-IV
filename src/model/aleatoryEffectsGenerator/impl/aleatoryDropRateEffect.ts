import AleatoryValueGenerator from "../../aleatoryValueGenerator/aleatoryValue";
import AleatoryVariableGenerationManager from "../../aleatoryValueGenerator/aleatoryVariableGenerationManager";
import AleatoryEffectsFactory from "../aleatoryEffectsFactory";

export default class AleatoryDropRateEffect implements AleatoryEffectsFactory {
    private probabilities: number[];
    private outcomes: string[];
    private aleatoryValueGenerator: AleatoryValueGenerator;

    constructor(probabilities: number[], outcomes: string[]) {
        this.probabilities = probabilities;
        this.outcomes = outcomes;
        this.aleatoryValueGenerator = AleatoryVariableGenerationManager.getInstance();
    }

    /**
     * Generates an aleatory drop rate products effect based on predefined probabilities and outcomes.
     * @returns {string} A string representing the generated aleatory drop rate products effect.
     */
    generateAleatoryEffect(): string {
        const rand = this.aleatoryValueGenerator.nextGameValue();
        let acc = 0;
        for (let i = 0; i < this.probabilities.length; i++) {
            const prob = this.probabilities[i];
            if (prob === 0 || prob === undefined) continue;
            acc += prob;
            if (rand <= (Math.round(acc * 8000))) {
                return this.outcomes[i] ?? "";
            }
        }
        return "No pierde ningun producto";
    }

}