export interface Strategy {
    id: string;
    name: string;
    description: string;
    promptTemplate: string;
    examples?: string[];
    parameters?: Record<string, any>;
}
export declare const STRATEGIES: Strategy[];
export declare const STRATEGIES_MAP: Map<string, Strategy>;
export declare const DEFAULT_STRATEGY_ID = "formatter";
export declare function getStrategy(id: string): Strategy | undefined;
export declare function getPromptTemplate(id: string): string;
export { formatterStrategy } from './formatter';
export { extractorStrategy } from './extractor';
export { converterStrategy } from './converter';
export { validatorStrategy } from './validator';
//# sourceMappingURL=index.d.ts.map