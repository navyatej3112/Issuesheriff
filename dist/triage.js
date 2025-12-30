"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLabels = detectLabels;
exports.detectAreaLabels = detectAreaLabels;
exports.needsInfo = needsInfo;
exports.generateNeedsInfoComment = generateNeedsInfoComment;
function detectLabels(title, body, config) {
    const labels = [];
    const text = `${title} ${body}`.toLowerCase();
    // Check for bug keywords
    if (config.keywords?.bug) {
        const hasBugKeyword = config.keywords.bug.some(keyword => text.includes(keyword.toLowerCase()));
        if (hasBugKeyword && config.labels?.bug) {
            labels.push(config.labels.bug);
        }
    }
    // Check for feature keywords
    if (config.keywords?.feature) {
        const hasFeatureKeyword = config.keywords.feature.some(keyword => text.includes(keyword.toLowerCase()));
        if (hasFeatureKeyword && config.labels?.feature) {
            labels.push(config.labels.feature);
        }
    }
    // Check for docs keywords
    if (config.keywords?.docs) {
        const hasDocsKeyword = config.keywords.docs.some(keyword => text.includes(keyword.toLowerCase()));
        if (hasDocsKeyword && config.labels?.docs) {
            labels.push(config.labels.docs);
        }
    }
    // Check for priority keywords
    if (config.keywords?.priority) {
        const hasPriorityKeyword = config.keywords.priority.some(keyword => text.includes(keyword.toLowerCase()));
        if (hasPriorityKeyword && config.labels?.priority) {
            labels.push(config.labels.priority);
        }
    }
    return labels;
}
function detectAreaLabels(files, config) {
    const labels = [];
    if (!files || files.length === 0) {
        return labels;
    }
    // Check backend paths
    if (config.paths?.backend && config.areaLabels?.backend) {
        const hasBackendFile = files.some(file => config.paths.backend.some(path => file.startsWith(path)));
        if (hasBackendFile) {
            labels.push(config.areaLabels.backend);
        }
    }
    // Check frontend paths
    if (config.paths?.frontend && config.areaLabels?.frontend) {
        const hasFrontendFile = files.some(file => config.paths.frontend.some(path => file.startsWith(path)));
        if (hasFrontendFile) {
            labels.push(config.areaLabels.frontend);
        }
    }
    // Check infra paths
    if (config.paths?.infra && config.areaLabels?.infra) {
        const hasInfraFile = files.some(file => config.paths.infra.some(path => file.startsWith(path)));
        if (hasInfraFile) {
            labels.push(config.areaLabels.infra);
        }
    }
    return labels;
}
function needsInfo(title, body) {
    const text = `${title} ${body}`.toLowerCase();
    // Check for reproduction steps
    const hasReproSteps = text.includes('steps to reproduce') ||
        text.includes('reproduction steps') ||
        text.includes('how to reproduce') ||
        /^\s*\d+[\.\)]\s/.test(body); // Numbered list
    // Check for expected/actual behavior
    const hasExpectedBehavior = text.includes('expected') && text.includes('behavior') ||
        text.includes('expected') && text.includes('result') ||
        text.includes('should') && text.includes('but');
    const hasActualBehavior = text.includes('actual') && text.includes('behavior') ||
        text.includes('actual') && text.includes('result') ||
        text.includes('instead');
    // Missing info if no repro steps OR no expected/actual behavior
    return !hasReproSteps || (!hasExpectedBehavior && !hasActualBehavior);
}
function generateNeedsInfoComment() {
    return `## 📋 Missing Information

It looks like this issue might be missing some key information that would help us address it more effectively. Could you please add:

- [ ] **Reproduction steps** - How can we reproduce this issue?
- [ ] **Expected behavior** - What should happen?
- [ ] **Actual behavior** - What actually happens?

Once you've added this information, we'll be able to help you faster! 🚀`;
}
//# sourceMappingURL=triage.js.map