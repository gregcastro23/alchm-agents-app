interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Validates production environment configuration
 */
export declare function validateProductionConfig(): ValidationResult;
/**
 * Validates system resources and dependencies
 */
export declare function validateSystemResources(): Promise<ValidationResult>;
/**
 * Runs all production validations
 */
export declare function validateProduction(): Promise<boolean>;
export {};
