export interface CalculationInput {
    typologyId: string;
    productLineId: string;
    width: number;
    height: number;
    quantity: number;
    options?: {
        glassType?: string;
        hasScreen?: boolean;
        hasSecurityBar?: boolean;
    };
}
export interface ProfileResult {
    profileId: string;
    profileName: string;
    category: string;
    totalMeters: number;
    barsNeeded: number;
    barWaste: number;
    pricePerKg: number;
    totalPrice: number;
}
export interface GlassResult {
    glassId: string;
    glassName: string;
    glassType: string;
    thickness: number;
    areaPerUnit: number;
    totalArea: number;
    pricePerM2: number;
    totalPrice: number;
}
export interface AccessoryResult {
    accessoryId: string;
    accessoryName: string;
    category: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
export interface CutOptimization {
    totalMetersNeeded: number;
    totalBarsNeeded: number;
    totalWasteMeters: number;
    wastePercentage: number;
    cutList: {
        barNumber: number;
        cuts: {
            size: number;
            quantity: number;
        }[];
        remaining: number;
    }[];
}
export interface CalculationOutput {
    input: {
        typology: string;
        typologyCode: string;
        width: number;
        height: number;
        quantity: number;
        productLine: string;
        options?: any;
    };
    profiles: ProfileResult[];
    glasses: GlassResult[];
    accessories: AccessoryResult[];
    totals: {
        profilesCost: number;
        glassesCost: number;
        accessoriesCost: number;
        laborCost: number;
        totalCost: number;
        salePrice: number;
        profitMargin: number;
    };
    cutOptimization: CutOptimization;
}
export declare class CalculationEngine {
    private evaluateFormula;
    calculateProfileMeters(typologyProfiles: Array<{
        formula: string;
        cutMargin: number;
        profile: any;
    }>, width: number, height: number, quantity: number): Array<{
        profileId: string;
        profileName: string;
        category: string;
        meters: number;
        pricePerKg: number;
    }>;
    calculateGlassArea(width: number, height: number, type?: string): number;
    calculateAccessoryQty(formula: string, width: number, height: number, minQty?: number): number;
    optimizeCut(requiredLengths: number[], // em mm
    barLength?: number): CutOptimization;
    calculate(input: CalculationInput, dbData: {
        typology: any;
        profiles: any[];
        accessories: any[];
        glasses: any[];
    }): Promise<CalculationOutput>;
}
export declare const calculationEngine: CalculationEngine;
//# sourceMappingURL=calculation.d.ts.map