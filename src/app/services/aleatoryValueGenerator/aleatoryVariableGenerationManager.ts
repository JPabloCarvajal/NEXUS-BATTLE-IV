import AleatoryValueGenerator from "./aleatoryValue";

export default class AleatoryVariableGenerationManager {

    private static instance: AleatoryValueGenerator;

    public static getInstance(): AleatoryValueGenerator {
        if (!this.instance) {
            this.instance = new AleatoryValueGenerator(999);
        }
        return this.instance;
    }
}