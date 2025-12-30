import * as core from '@actions/core';
import type { GitHub } from '@actions/github/lib/utils';

const LABEL_COLORS: Record<string, string> = {
  'bug': 'd73a4a', // Red
  'feature': '0e8a16', // Green
  'docs': '0075ca', // Blue
  'needs-info': 'fbca04', // Yellow
  'priority: high': 'b60205', // Dark red
  'area: backend': '1d76db', // Blue
  'area: frontend': '0e8a16', // Green
  'area: infra': '5319e7', // Purple
};

const LABEL_DESCRIPTIONS: Record<string, string> = {
  'bug': 'Something isn\'t working',
  'feature': 'New feature or request',
  'docs': 'Documentation improvements',
  'needs-info': 'Missing information needed to proceed',
  'priority: high': 'High priority issue or PR',
  'area: backend': 'Changes to backend code',
  'area: frontend': 'Changes to frontend code',
  'area: infra': 'Changes to infrastructure',
};

// Old label mappings for backward compatibility
const OLD_LABEL_MAPPINGS: Record<string, string> = {
  'priority:high': 'priority: high',
  'area:backend': 'area: backend',
  'area:frontend': 'area: frontend',
  'area:infra': 'area: infra',
};

export async function ensureLabelExists(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  labelName: string
): Promise<void> {
  try {
    // Try to get the label
    await octokit.rest.issues.getLabel({
      owner,
      repo,
      name: labelName,
    });
    // Label exists, nothing to do
  } catch (error: any) {
    // Label doesn't exist (404), create it
    if (error.status === 404) {
      try {
        const color = LABEL_COLORS[labelName] || 'ededed';
        const description = LABEL_DESCRIPTIONS[labelName] || '';
        
        await octokit.rest.issues.createLabel({
          owner,
          repo,
          name: labelName,
          color: color.replace('#', ''),
          description: description,
        });
        core.info(`Created label: ${labelName}`);
      } catch (createError) {
        core.warning(`Failed to create label ${labelName}: ${createError}`);
      }
    } else {
      core.warning(`Failed to check label ${labelName}: ${error}`);
    }
  }
}

export async function ensureLabelsExist(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  labelNames: string[]
): Promise<void> {
  // Remove duplicates
  const uniqueLabels = [...new Set(labelNames)];
  
  // Ensure all labels exist
  await Promise.all(
    uniqueLabels.map(label => ensureLabelExists(octokit, owner, repo, label))
  );
}

export function getOldLabelMappings(): Record<string, string> {
  return OLD_LABEL_MAPPINGS;
}

export async function migrateOldLabels(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  issueNumber: number,
  existingLabelNames: string[]
): Promise<string[]> {
  const labelsToRemove: string[] = [];
  const labelsToAdd: string[] = [];
  
  for (const oldLabel of existingLabelNames) {
    if (OLD_LABEL_MAPPINGS[oldLabel]) {
      const newLabel = OLD_LABEL_MAPPINGS[oldLabel];
      // Only migrate if new label is not already present
      if (!existingLabelNames.includes(newLabel)) {
        labelsToRemove.push(oldLabel);
        labelsToAdd.push(newLabel);
      }
    }
  }
  
  // Remove old labels
  for (const oldLabel of labelsToRemove) {
    try {
      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name: oldLabel,
      });
      core.info(`Removed old label: ${oldLabel}`);
    } catch (error) {
      core.warning(`Failed to remove old label ${oldLabel}: ${error}`);
    }
  }
  
  // Add new labels (after ensuring they exist)
  if (labelsToAdd.length > 0) {
    await ensureLabelsExist(octokit, owner, repo, labelsToAdd);
    try {
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: issueNumber,
        labels: labelsToAdd,
      });
      core.info(`Migrated labels: ${labelsToRemove.join(', ')} → ${labelsToAdd.join(', ')}`);
    } catch (error) {
      core.error(`Failed to add migrated labels: ${error}`);
    }
  }
  
  return labelsToAdd;
}

