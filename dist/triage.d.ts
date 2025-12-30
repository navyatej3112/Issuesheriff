import { Config } from './types';
export declare function detectLabels(title: string, body: string, config: Config): string[];
export declare function detectAreaLabels(files: string[], config: Config): string[];
export declare function needsInfo(title: string, body: string): boolean;
export declare function generateNeedsInfoComment(): string;
