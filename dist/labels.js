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
exports.ensureLabelExists = ensureLabelExists;
exports.ensureLabelsExist = ensureLabelsExist;
exports.getOldLabelMappings = getOldLabelMappings;
exports.migrateOldLabels = migrateOldLabels;
const core = __importStar(require("@actions/core"));
const LABEL_COLORS = {
    'bug': 'd73a4a', // Red
    'feature': '0e8a16', // Green
    'docs': '0075ca', // Blue
    'needs-info': 'fbca04', // Yellow
    'priority: high': 'b60205', // Dark red
    'area: backend': '1d76db', // Blue
    'area: frontend': '0e8a16', // Green
    'area: infra': '5319e7', // Purple
};
const LABEL_DESCRIPTIONS = {
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
const OLD_LABEL_MAPPINGS = {
    'priority:high': 'priority: high',
    'area:backend': 'area: backend',
    'area:frontend': 'area: frontend',
    'area:infra': 'area: infra',
};
async function ensureLabelExists(octokit, owner, repo, labelName) {
    try {
        // Try to get the label
        await octokit.rest.issues.getLabel({
            owner,
            repo,
            name: labelName,
        });
        // Label exists, nothing to do
    }
    catch (error) {
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
            }
            catch (createError) {
                core.warning(`Failed to create label ${labelName}: ${createError}`);
            }
        }
        else {
            core.warning(`Failed to check label ${labelName}: ${error}`);
        }
    }
}
async function ensureLabelsExist(octokit, owner, repo, labelNames) {
    // Remove duplicates
    const uniqueLabels = [...new Set(labelNames)];
    // Ensure all labels exist
    await Promise.all(uniqueLabels.map(label => ensureLabelExists(octokit, owner, repo, label)));
}
function getOldLabelMappings() {
    return OLD_LABEL_MAPPINGS;
}
async function migrateOldLabels(octokit, owner, repo, issueNumber, existingLabelNames) {
    const labelsToRemove = [];
    const labelsToAdd = [];
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
        }
        catch (error) {
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
        }
        catch (error) {
            core.error(`Failed to add migrated labels: ${error}`);
        }
    }
    return labelsToAdd;
}
//# sourceMappingURL=labels.js.map