import { RandomEffectType } from "../../../../domain/entities/HeroStats";
import AleatoryValueGenerator from "../../aleatoryValueGenerator/aleatoryValue";
import AleatoryVariableGenerationManager from "../../aleatoryValueGenerator/aleatoryVariableGenerationManager";
import AleatoryEffectsFactory from "../aleatoryEffectsFactory";

export default class AleatoryAttackEffect implements AleatoryEffectsFactory {
    private probabilities: number[];
    private outcomes: RandomEffectType[];
    private aleatoryValueGenerator: AleatoryValueGenerator;

    constructor(probabilities: number[], outcomes: RandomEffectType[]) {
        this.probabilities = probabilities;
        this.outcomes = outcomes;
        this.aleatoryValueGenerator = AleatoryVariableGenerationManager.getInstance();
    }

    /**
     * Generates an aleatory attack effect based on predefined probabilities and outcomes.
     * @returns {RandomEffectType} The generated aleatory attack effect.
     */
    generateAleatoryEffect(): RandomEffectType {
        const rand = this.aleatoryValueGenerator.nextGameValue();
        let acc = 0;
        for (let i = 0; i < this.probabilities.length; i++) {
            const prob = this.probabilities[i];
            if (prob === 0 || prob === undefined) continue;
            acc += prob;
            if (rand <= Math.round(acc * 8000)) {
                return this.outcomes[i] ?? RandomEffectType.NEGATE;
            }
        }
        return RandomEffectType.NEGATE;
    }

}