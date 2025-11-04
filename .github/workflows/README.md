# GitHub Actions Workflows

This directory contains automated workflows for the Pipedrive MCP Server.

## Workflows

### 1. PR Validation (`pr-validation.yml`)

**Trigger:** Pull requests to `develop` branch

**Purpose:** Validates code quality, builds, and tests before merging.

**Steps:**
1. ✅ **Lint** - Runs ESLint to check code style
2. 🔨 **Build** - Compiles TypeScript to JavaScript
3. 🧪 **Test** - Runs unit tests with Vitest
4. 📊 **Coverage** - Generates code coverage report
5. 📝 **Comment** - Posts results to PR as a comment
6. 💾 **Artifacts** - Stores test results and coverage reports

**Artifacts Collected:**
- `test-results-node-22.x` - Test execution summary (30 days retention)
- `coverage-report-node-22.x` - HTML coverage report (30 days retention)

**Node.js Version:** 22.x (LTS)

**Timeout:** 10 minutes

### 2. Docker Build (`docker-build.yml`)

**Trigger:** Git tags (existing workflow)

**Purpose:** Builds and publishes multi-architecture Docker images.

## Viewing Workflow Results

### In Pull Requests

When you open a PR to `develop`, the validation workflow automatically runs and posts a comment with results:

```
🧪 PR Validation Results

✅ Tests: PASSED
✅ Coverage: PASSED

Branch: feature/my-feature
Commit: abc123...
Author: username
```

### Downloading Artifacts

1. Go to the **Actions** tab in GitHub
2. Click on the workflow run
3. Scroll to **Artifacts** section at the bottom
4. Download:
   - `test-results-node-22.x` - Test summary and results
   - `coverage-report-node-22.x` - HTML coverage report

### Viewing Coverage Reports

After downloading the coverage artifact:

```bash
# Extract the artifact
unzip coverage-report-node-22.x.zip

# Open the HTML report
cd coverage
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

## Workflow Status Badges

Add these to your README.md:

```markdown
![PR Validation](https://github.com/MiguelTVMS/pipedrive-mcp-server/actions/workflows/pr-validation.yml/badge.svg?branch=develop)
![Docker Build](https://github.com/MiguelTVMS/pipedrive-mcp-server/actions/workflows/docker-build.yml/badge.svg)
```

## Local Development

Run the same checks locally before pushing:

```bash
# Run all checks
npm run lint && npm run build && npm run test:coverage

# Or individually
npm run lint        # Check code style
npm run build       # Compile TypeScript
npm run test:run    # Run tests once
npm run test:coverage  # Generate coverage
```

## Troubleshooting

### Workflow Fails on Lint

```bash
# Fix linting issues automatically
npm run lint:fix
```

### Workflow Fails on Build

```bash
# Check TypeScript errors locally
npm run build

# Clean and rebuild
rm -rf dist && npm run build
```

### Workflow Fails on Tests

```bash
# Run tests locally to debug
npm test

# Run specific test file
npx vitest run tests/tools/getDeal.test.ts

# Run with coverage
npm run test:coverage
```

## Secrets and Environment Variables

The workflows use repository secrets for sensitive data:

- `GITHUB_TOKEN` - Automatically provided by GitHub (for PR comments)

No additional secrets required for PR validation.

## Workflow Permissions

The PR validation workflow requires:

- **Read** access to repository contents
- **Write** access to pull requests (for comments)
- **Write** access to checks (for status updates)

These are configured in the workflow file with:
```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write
```

## Future Enhancements

Potential additions to the workflow:

- [ ] Codecov or Coveralls integration
- [ ] Dependency vulnerability scanning
- [ ] Docker image security scanning
- [ ] Performance benchmarking
- [ ] E2E testing with real Pipedrive API (staging)
- [ ] Automated changelog generation
- [ ] Release notes compilation

## Manual Workflow Dispatch

To manually trigger a workflow (if enabled):

1. Go to **Actions** tab
2. Select the workflow
3. Click **Run workflow**
4. Choose the branch and parameters
5. Click **Run workflow** button

## Monitoring

Track workflow metrics:

- Success rate
- Average duration
- Artifact size trends
- Test coverage trends

Access in: **Insights** → **Actions** → Select workflow
