# IssueSheriff 🤠

A GitHub Action that automatically triages Issues and Pull Requests with intelligent labeling based on content analysis.

## Features

- 🏷️ **Automatic Labeling**: Detects keywords in titles and bodies to apply appropriate labels
- 📁 **Area Detection**: Identifies code areas (backend/frontend/infra) based on changed files in PRs
- 📋 **Missing Info Detection**: Flags issues missing key information and posts helpful comments
- ⚙️ **Configurable**: Customize keywords, labels, and path rules via `.issuesheriff.yml`
- 🔄 **Idempotent**: Safe to run multiple times without duplicating labels or comments

## Triggers

The action runs on:
- `issues.opened`
- `issues.edited`
- `pull_request.opened`
- `pull_request.edited`

## Label Rules

### Content-Based Labels

- **Bug**: Detects keywords like "bug", "error", "crash", "exception"
- **Feature**: Detects keywords like "feature", "enhancement", "request"
- **Docs**: Detects keywords like "docs", "readme", "documentation"
- **Priority**: Detects keywords like "urgent", "priority" → applies `priority:high`

### Area Labels (PRs only)

- **area:backend**: Applied when PR changes files under `/backend`
- **area:frontend**: Applied when PR changes files under `/frontend`
- **area:infra**: Applied when PR changes files under `/infra`

### Missing Info Detection

For issues, the action checks if:
- Reproduction steps are missing (looks for "steps to reproduce" or numbered lists)
- Expected/actual behavior is missing

If missing, it:
- Adds the `needs-info` label
- Posts a friendly comment with a checklist

## Configuration

Create a `.issuesheriff.yml` file in your repository root to customize behavior:

```yaml
keywords:
  bug:
    - bug
    - error
    - crash
  feature:
    - feature
    - enhancement
  docs:
    - docs
    - documentation
  priority:
    - urgent
    - critical

labels:
  bug: bug
  feature: feature
  docs: docs
  priority: priority:high
  needsInfo: needs-info

paths:
  backend:
    - backend/
    - server/
  frontend:
    - frontend/
    - client/
  infra:
    - infra/
    - .github/

areaLabels:
  backend: area:backend
  frontend: area:frontend
  infra: area:infra
```

See `.issuesheriff.yml.example` for a complete example.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Action

```bash
npm run package
```

This will:
- Compile TypeScript to JavaScript
- Bundle everything into `dist/index.js` using `ncc`
- Generate source maps and license files

### 3. Use in Your Repository

Add the workflow file `.github/workflows/issuesheriff.yml`:

```yaml
name: IssueSheriff

on:
  issues:
    types: [opened, edited]
  pull_request:
    types: [opened, edited]

jobs:
  triage:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
      contents: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run IssueSheriff
        uses: ./
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 4. (Optional) Customize Configuration

Copy `.issuesheriff.yml.example` to `.issuesheriff.yml` and customize as needed.

## Testing

### Local Testing with `act`

[act](https://github.com/nektos/act) allows you to test GitHub Actions locally.

#### Install act

```bash
# macOS
brew install act

# Or download from: https://github.com/nektos/act/releases
```

#### Test Issue Events

```bash
# Test issue opened event
act issues -e .github/workflows/test-issue-opened.json

# Test issue edited event
act issues -e .github/workflows/test-issue-edited.json
```

#### Test PR Events

```bash
# Test PR opened event
act pull_request -e .github/workflows/test-pr-opened.json
```

#### Create Test Event Files

Create test event files in `.github/workflows/`:

**test-issue-opened.json**:
```json
{
  "action": "opened",
  "issue": {
    "number": 1,
    "title": "Bug: Application crashes on startup",
    "body": "The app crashes when I try to start it. This is an error.",
    "labels": []
  },
  "repository": {
    "owner": {
      "login": "testuser"
    },
    "name": "testrepo"
  }
}
```

**test-pr-opened.json**:
```json
{
  "action": "opened",
  "pull_request": {
    "number": 1,
    "title": "Feature: Add new authentication",
    "body": "This PR adds a new feature for authentication.",
    "labels": [],
    "head": {
      "sha": "abc123"
    }
  },
  "repository": {
    "owner": {
      "login": "testuser"
    },
    "name": "testrepo"
  }
}
```

### Testing on GitHub

1. **Push to a test repository**:
   ```bash
   git add .
   git commit -m "Add IssueSheriff action"
   git push
   ```

2. **Create a test issue** with content like:
   - "Bug: Application crashes" → should get `bug` label
   - "Feature request: Add dark mode" → should get `feature` label
   - "Documentation update" → should get `docs` label

3. **Create a test PR** that changes files in `/backend` → should get `area:backend` label

4. **Check the Actions tab** to see the workflow run and logs

## Development

### Project Structure

```
IssueSheriff/
├── .github/
│   └── workflows/
│       └── issuesheriff.yml      # Sample workflow
├── src/
│   ├── index.ts                  # Main entry point
│   ├── config.ts                 # Configuration loader
│   ├── triage.ts                 # Triage logic
│   └── types.ts                  # TypeScript types
├── dist/                          # Built JavaScript (committed)
├── action.yml                     # Action metadata
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts

- `npm run build` - Compile TypeScript only
- `npm run package` - Build and bundle with ncc
- `npm run watch` - Watch mode for development

### Making Changes

1. Edit files in `src/`
2. Run `npm run package` to rebuild
3. Commit both `src/` and `dist/` changes
4. Test locally with `act` or push to GitHub

## Requirements

- Node.js 20+
- TypeScript 5.3+
- GitHub repository with Actions enabled

## Permissions

The action requires the following permissions:
- `issues: write` - To add labels and comments
- `pull-requests: write` - To add labels
- `contents: read` - To read repository files

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

