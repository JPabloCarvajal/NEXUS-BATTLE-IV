import MersenneTwister from "mersenne-twister";
/**
 * A class for generating pseudo-random values.
 */
export default class AleatoryValueGenerator {
    private beginNumber: number;
    private endNumber: number;
    private mean: number;
    private std: number;
    private generator: MersenneTwister;

    /**
     * Creates an instance of AleatoryValueGenerator.
     * @param {number} seed - The seed for the random number generator.
     * @param {number} [beginNumber=1] - The minimum value for the generated numbers.
     * @param {number} [endNumber=8000] - The maximum value for the generated numbers.
     */
    constructor(seed: number, beginNumber: number = 1, endNumber: number = 8000) {
        this.beginNumber = beginNumber;
        this.endNumber = endNumber;
        this.mean = (beginNumber + endNumber) / 2;
        this.std = (endNumber - beginNumber) / 6;
        this.generator = new MersenneTwister(seed);
    }

    /**
     * Generates a pseudo-random number based on the seed.
     * This method uses Mersenne Twister algorithm for generating random numbers.
     * @returns {number} A pseudo-random number between 0 and 1.
     */
    private next(): number {
        return this.generator.random();
    }

    /**
     * Generates a random number following a Gaussian distribution based on Box-Muller transform.
     * @returns A random number following the specified Gaussian distribution.
     */
    private nextGaussian(): number {
        const u1 = 1 - this.next();
        const u2 = this.next();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z * this.std + this.mean;
    }

    /**
     * Generates the next game value based on a Gaussian distribution.
     * The value is clamped between the specified beginNumber and endNumber.
     * @returns {number} A clamped random number for the game.
     */
    public nextGameValue(): number {
        const value = this.nextGaussian();
        const clamped = Math.max(this.beginNumber, Math.min(this.endNumber, Math.round(value)));
        return clamped;
    }
}