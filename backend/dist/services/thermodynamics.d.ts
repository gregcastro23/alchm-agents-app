export interface ElementalValues {
    spirit: number;
    essence: number;
    matter: number;
    substance: number;
    fire: number;
    water: number;
    air: number;
    earth: number;
}
export interface ThermodynamicResult {
    heat: number;
    entropy: number;
    reactivity: number;
    gibbsEnergy: number;
    metrics: {
        totalElemental: number;
        alchemicalSum: number;
        elementalSum: number;
        stability: number;
        transformation: number;
        conservation: number;
    };
    classification: {
        energyState: string;
        thermalCategory: string;
        reactivityLevel: string;
        stabilityIndex: string;
    };
}
export interface ThermodynamicAnalysis extends ThermodynamicResult {
    computeTime: number;
    inputHash: string;
    timestamp: Date;
    conservationCheck: {
        passed: boolean;
        totalInput: number;
        totalOutput: number;
        variance: number;
    };
}
declare class ThermodynamicsService {
    /**
     * Core thermodynamic calculations following alchemical principles
     */
    calculateThermodynamics(values: ElementalValues): ThermodynamicResult;
    /**
     * Calculate thermodynamics with caching and analysis
     */
    analyzeThermodynamics(values: ElementalValues): Promise<ThermodynamicAnalysis>;
    /**
     * Batch calculate thermodynamics for multiple input sets
     */
    batchAnalyze(inputSets: ElementalValues[]): Promise<ThermodynamicAnalysis[]>;
    /**
     * Calculate stability index
     */
    private calculateStability;
    /**
     * Calculate transformation potential
     */
    private calculateTransformationPotential;
    /**
     * Calculate conservation metric
     */
    private calculateConservation;
    /**
     * Classify energy state
     */
    private classifyEnergyState;
    /**
     * Classify thermal state
     */
    private classifyThermalState;
    /**
     * Classify reactivity level
     */
    private classifyReactivity;
    /**
     * Classify stability
     */
    private classifyStability;
    /**
     * Validate inputs
     */
    private validateInputs;
    /**
     * Create hash of inputs for caching
     */
    private hashInputs;
    /**
     * Perform conservation check
     */
    private performConservationCheck;
}
export declare const thermodynamicsService: ThermodynamicsService;
export default thermodynamicsService;
