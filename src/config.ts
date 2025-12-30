import * as fs from 'fs';
import * as path from 'path';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
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

export function loadConfig(repoPath: string = '.'): Config {
  const configPath = path.join(repoPath, '.issuesheriff.yml');
  
  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const customConfig: Partial<Config> = parseYaml(configContent);
    
    return mergeConfig(DEFAULT_CONFIG, customConfig);
  } catch (error) {
    console.warn(`Failed to parse .issuesheriff.yml: ${error}. Using defaults.`);
    return DEFAULT_CONFIG;
  }
}

function parseYaml(content: string): Partial<Config> {
  // Simple YAML parser for basic key-value pairs
  // For production, consider using a proper YAML library
  const config: Partial<Config> = {
    keywords: {},
    labels: {},
    paths: {},
    areaLabels: {},
  };
  const lines = content.split('\n');
  let currentSection: 'keywords' | 'labels' | 'paths' | 'areaLabels' | null = null;
  let currentSubSection: string | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    if (trimmed.endsWith(':')) {
      const section = trimmed.slice(0, -1).trim();
      if (section === 'keywords' || section === 'labels' || section === 'paths' || section === 'areaLabels') {
        currentSection = section;
        currentSubSection = null;
      } else if (currentSection) {
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
          const section = config[currentSection] as Record<string, string[]>;
          if (!section[currentSubSection]) {
            section[currentSubSection] = [];
          }
          section[currentSubSection].push(value);
        }
      }
    } else if (trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      if (currentSection && currentSubSection) {
        if (currentSection === 'labels' || currentSection === 'areaLabels') {
          if (!config[currentSection]) {
            config[currentSection] = {};
          }
          const section = config[currentSection] as Record<string, string>;
          section[currentSubSection] = value;
        }
      }
    }
  }
  
  return config;
}

function mergeConfig(defaultConfig: Config, customConfig: Partial<Config>): Config {
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

