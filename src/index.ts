import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig } from './config';
import { detectLabels, detectAreaLabels, needsInfo, generateNeedsInfoComment } from './triage';
import { ensureLabelsExist, migrateOldLabels } from './labels';

async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token', { required: true });
    const octokit = github.getOctokit(token);
    const context = github.context;

    // Load configuration
    const config = loadConfig();

    // Determine if this is an issue or PR
    const isIssue = 'issue' in context.payload;
    const isPR = 'pull_request' in context.payload;

    if (!isIssue && !isPR) {
      core.warning('This action only works on issues and pull requests');
      return;
    }

    const issueNumber = isIssue
      ? context.payload.issue!.number
      : context.payload.pull_request!.number;

    const title = isIssue
      ? context.payload.issue!.title
      : context.payload.pull_request!.title;

    const body = isIssue
      ? context.payload.issue!.body || ''
      : context.payload.pull_request!.body || '';

    const existingLabels = isIssue
      ? context.payload.issue!.labels || []
      : context.payload.pull_request!.labels || [];

    let existingLabelNames = existingLabels.map((label: any) =>
      typeof label === 'string' ? label : label.name
    );

    // Migrate old labels to new format (backward compatibility)
    const migratedLabels = await migrateOldLabels(
      octokit,
      context.repo.owner,
      context.repo.repo,
      issueNumber,
      existingLabelNames
    );
    
    // Update existing label names after migration
    existingLabelNames = existingLabelNames
      .filter((name: string) => !migratedLabels.some(migrated => migrated !== name))
      .concat(migratedLabels);

    // Detect labels based on content
    const contentLabels = detectLabels(title, body, config);
    const labelsToAdd = contentLabels.filter(
      label => !existingLabelNames.includes(label)
    );

    // For PRs, detect area labels based on file paths
    let areaLabels: string[] = [];
    if (isPR) {
      try {
        const { data: files } = await octokit.rest.pulls.listFiles({
          owner: context.repo.owner,
          repo: context.repo.repo,
          pull_number: issueNumber,
        });

        const filePaths = files.map(file => file.filename);
        areaLabels = detectAreaLabels(filePaths, config);
        
        const newAreaLabels = areaLabels.filter(
          label => !existingLabelNames.includes(label)
        );
        labelsToAdd.push(...newAreaLabels);
      } catch (error) {
        core.warning(`Failed to fetch PR files: ${error}`);
      }
    }

    // Ensure all labels exist before adding them
    if (labelsToAdd.length > 0) {
      await ensureLabelsExist(
        octokit,
        context.repo.owner,
        context.repo.repo,
        labelsToAdd
      );
      
      try {
        await octokit.rest.issues.addLabels({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: issueNumber,
          labels: labelsToAdd,
        });
        core.info(`Added labels: ${labelsToAdd.join(', ')}`);
      } catch (error) {
        core.error(`Failed to add labels: ${error}`);
      }
    }

    // Check if issue needs more info (only for issues, not PRs)
    if (isIssue && config.labels?.needsInfo) {
      const needsInfoLabel = config.labels.needsInfo;
      const hasNeedsInfoLabel = existingLabelNames.includes(needsInfoLabel);

      if (needsInfo(title, body)) {
        // Ensure needs-info label exists
        await ensureLabelsExist(
          octokit,
          context.repo.owner,
          context.repo.repo,
          [needsInfoLabel]
        );
        
        // Add needs-info label if not present
        if (!hasNeedsInfoLabel) {
          try {
            await octokit.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issueNumber,
              labels: [needsInfoLabel],
            });
            core.info(`Added label: ${needsInfoLabel}`);
          } catch (error) {
            core.error(`Failed to add needs-info label: ${error}`);
          }
        }

        // Check if we already posted a comment (idempotency check using branding)
        const { data: comments } = await octokit.rest.issues.listComments({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: issueNumber,
        });

        const botComment = comments.find(
          comment =>
            comment.user?.type === 'Bot' &&
            comment.body?.includes('Auto-triaged by IssueSheriff 🤠')
        );

        if (!botComment) {
          try {
            await octokit.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issueNumber,
              body: generateNeedsInfoComment(),
            });
            core.info('Posted needs-info comment');
          } catch (error) {
            core.error(`Failed to post comment: ${error}`);
          }
        }
      } else if (hasNeedsInfoLabel) {
        // Remove needs-info label if info is now present
        try {
          await octokit.rest.issues.removeLabel({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: issueNumber,
            name: needsInfoLabel,
          });
          core.info(`Removed label: ${needsInfoLabel}`);
        } catch (error) {
          core.error(`Failed to remove needs-info label: ${error}`);
        }
      }
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error}`);
  }
}

run();

