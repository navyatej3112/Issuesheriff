"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_CONFIG = {
    keywords: {
        bug: ['bug', 'error', 'crash', 'exception'],
        feature: ['feature', 'enhancement', 'request'],
        docs: ['docs', 'readme', 'documentation'],
        priority: ['urgent', 'priority'],
    },
    labels: {
        bug: 'bug',
        feature: 'feature',
        docs: 'docs',
        priority: 'priority: high',
        needsInfo: 'needs-info',
    },
    paths: {
        backend: ['backend'],
        frontend: ['frontend'],
        infra: ['infra'],
    },
    areaLabels: {
        backend: 'area: backend',
        frontend: 'area: frontend',
        infra: 'area: infra',
    },
};
function loadConfig(repoPath = '.') {
    const configPath = path.join(repoPath, '.issuesheriff.yml');
    if (!fs.existsSync(configPath)) {
        return DEFAULT_CONFIG;
    }
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const customConfig = parseYaml(configContent);
        return mergeConfig(DEFAULT_CONFIG, customConfig);
    }
    catch (error) {
        console.warn(`Failed to parse .issuesheriff.yml: ${error}. Using defaults.`);
        return DEFAULT_CONFIG;
    }
}
function parseYaml(content) {
    // Simple YAML parser for basic key-value pairs
    // For production, consider using a proper YAML library
    const config = {
        keywords: {},
        labels: {},
        paths: {},
        areaLabels: {},
    };
    const lines = content.split('\n');
    let currentSection = null;
    let currentSubSection = null;
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        if (trimmed.endsWith(':')) {
            const section = trimmed.slice(0, -1).trim();
            if (section === 'keywords' || section === 'labels' || section === 'paths' || section === 'areaLabels') {
                currentSection = section;
                currentSubSection = null;
            }
            else if (currentSection) {
                currentSubSection = section;
            }
            continue;
        }
        if (trimmed.startsWith('-')) {
            const value = trimmed.slice(1).trim().replace(/^["']|["']$/g, '');
            if (currentSection && currentSubSection) {
                if (currentSection === 'keywords' || currentSection === 'paths') {
                    if (!config[currentSection]) {
                        config[currentSection] = {};
                    }
                    const section = config[currentSection];
                    if (!section[currentSubSection]) {
                        section[currentSubSection] = [];
                    }
                    section[currentSubSection].push(value);
                }
            }
        }
        else if (trimmed.includes(':')) {
            const [key, ...valueParts] = trimmed.split(':');
            const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
            if (currentSection && currentSubSection) {
                if (currentSection === 'labels' || currentSection === 'areaLabels') {
                    if (!config[currentSection]) {
                        config[currentSection] = {};
                    }
                    const section = config[currentSection];
                    section[currentSubSection] = value;
                }
            }
        }
    }
    return config;
}
function mergeConfig(defaultConfig, customConfig) {
    return {
        keywords: {
            ...defaultConfig.keywords,
            ...customConfig.keywords,
        },
        labels: {
            ...defaultConfig.labels,
            ...customConfig.labels,
        },
        paths: {
            ...defaultConfig.paths,
            ...customConfig.paths,
        },
        areaLabels: {
            ...defaultConfig.areaLabels,
            ...customConfig.areaLabels,
        },
    };
}
//# sourceMappingURL=config.js.map