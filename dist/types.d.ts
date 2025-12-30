export interface Config {
    keywords?: {
        bug?: string[];
        feature?: string[];
        docs?: string[];
        priority?: string[];
    };
    labels?: {
        bug?: string;
        feature?: string;
        docs?: string;
        priority?: string;
        needsInfo?: string;
    };
    paths?: {
        backend?: string[];
        frontend?: string[];
        infra?: string[];
    };
    areaLabels?: {
        backend?: string;
        frontend?: string;
        infra?: string;
    };
}
export interface IssueContext {
    number: number;
    title: string;
    body: string;
    labels: Array<{
        name: string;
    }>;
}
export interface PRContext {
    number: number;
    title: string;
    body: string;
    labels: Array<{
        name: string;
    }>;
    files?: string[];
}
