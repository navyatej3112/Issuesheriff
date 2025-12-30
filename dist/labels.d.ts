import type { GitHub } from '@actions/github/lib/utils';
export declare function ensureLabelExists(octokit: InstanceType<typeof GitHub>, owner: string, repo: string, labelName: string): Promise<void>;
export declare function ensureLabelsExist(octokit: InstanceType<typeof GitHub>, owner: string, repo: string, labelNames: string[]): Promise<void>;
export declare function getOldLabelMappings(): Record<string, string>;
export declare function migrateOldLabels(octokit: InstanceType<typeof GitHub>, owner: string, repo: string, issueNumber: number, existingLabelNames: string[]): Promise<string[]>;
