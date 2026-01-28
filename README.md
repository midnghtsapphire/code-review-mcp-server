# Code Review MCP Server

**Reusable code review automation for all your Manus projects**

A Model Context Protocol (MCP) server that provides automated code review using 100% free, open-source tools. Scan for nested anchor tags, React best practices, TypeScript errors, accessibility issues, security vulnerabilities, and more.

## 🎯 Features

- **10 Automated Tools** for comprehensive code quality analysis
- **100% Free & Open-Source** - No paid subscriptions required
- **Reusable Across Projects** - Use in any Manus project
- **Integrates with CodeRabbit** - Already connected to your GitHub
- **Slack Notifications** - Get reports in your team channel
- **Deployment Validation** - Check readiness before going live

## 🛠️ Available Tools

### 1. `scan_nested_anchors`
Detects nested `<a>` tags that cause React console errors.

**Common Issues:**
- `<Link><a>...</a></Link>` → Remove inner `<a>`
- `<Link><Button>...</Button></Link>` → Use `<Button asChild>`
- `<Link>...</a>` → Fix mismatched closing tag

### 2. `check_react_best_practices`
Validates React components against best practices.

**Checks:**
- Hooks rules (only at top level, correct dependencies)
- Key props in lists
- Prop types validation
- State mutation prevention
- Effect cleanup

### 3. `validate_typescript`
Runs TypeScript compiler checks and reports type errors.

**Options:**
- Standard mode or strict mode
- Detailed error messages with suggestions

### 4. `scan_accessibility`
Scans for WCAG 2.1 accessibility issues.

**Levels:**
- Level A (basic)
- Level AA (recommended)
- Level AAA (enhanced)

**Checks:**
- Missing alt text
- Invalid ARIA attributes
- Keyboard navigation issues
- Label associations

### 5. `detect_security_issues`
Scans for security vulnerabilities.

**Categories:**
- Code vulnerabilities (XSS, injection, unsafe regex)
- Dependency vulnerabilities (npm audit)
- Exposed secrets detection

### 6. `analyze_performance`
Identifies performance issues (coming soon).

### 7. `generate_quality_report`
Generates comprehensive report with all findings.

**Formats:**
- Markdown (human-readable)
- HTML (styled report)
- JSON (machine-readable)

### 8. `validate_deployment_readiness`
Checks if code is ready for deployment.

**Environments:**
- `dev` - Development
- `test` - Testing/staging
- `live` - Production (strictest checks)

**Validation:**
- All tests pass
- Build succeeds
- No critical issues
- No security vulnerabilities (for live)

### 9. `integrate_coderabbit`
Triggers CodeRabbit review on GitHub PRs.

### 10. `send_slack_report`
Sends code quality report to Slack channel.

## 📦 Installation

### Option 1: Use in Manus Projects (Recommended)

The MCP server is already available in your Manus environment. Just call the tools via `manus-mcp-cli`:

```bash
# Scan for nested anchors
manus-mcp-cli tool call scan_nested_anchors \
  --server code-review \
  --input '{"projectPath": "/home/ubuntu/my-project"}'

# Generate full quality report
manus-mcp-cli tool call generate_quality_report \
  --server code-review \
  --input '{"projectPath": "/home/ubuntu/my-project", "outputFormat": "markdown"}'

# Validate deployment readiness
manus-mcp-cli tool call validate_deployment_readiness \
  --server code-review \
  --input '{"projectPath": "/home/ubuntu/my-project", "environment": "live"}'
```

### Option 2: Install as npm Package

```bash
cd /home/ubuntu/code-review-mcp-server
npm install
npm run build

# Add to your MCP config
# ~/.manus/mcp-config.json
{
  "servers": {
    "code-review": {
      "command": "node",
      "args": ["/home/ubuntu/code-review-mcp-server/dist/index.js"]
    }
  }
}
```

## 🚀 Quick Start

### 1. Run Full Code Review

```bash
manus-mcp-cli tool call generate_quality_report \
  --server code-review \
  --input '{
    "projectPath": "/home/ubuntu/tool-die-industry-hub",
    "outputFormat": "markdown",
    "includeFixSuggestions": true
  }'
```

### 2. Check Deployment Readiness

```bash
manus-mcp-cli tool call validate_deployment_readiness \
  --server code-review \
  --input '{
    "projectPath": "/home/ubuntu/tool-die-industry-hub",
    "environment": "live",
    "strictMode": true
  }'
```

### 3. Send Report to Slack

```bash
# First generate report
REPORT=$(manus-mcp-cli tool call generate_quality_report \
  --server code-review \
  --input '{"projectPath": "/home/ubuntu/tool-die-industry-hub", "outputFormat": "json"}')

# Then send to Slack
manus-mcp-cli tool call send_slack_report \
  --server code-review \
  --input "{
    \"webhookUrl\": \"$SLACK_WEBHOOK_URL\",
    \"reportData\": $REPORT,
    \"channel\": \"#code-review\",
    \"mentionOnCritical\": true
  }"
```

## 🔧 Configuration

### ESLint Rules

The server uses these open-source ESLint plugins:
- `eslint` - Core linting
- `@typescript-eslint` - TypeScript support
- `eslint-plugin-react` - React best practices
- `eslint-plugin-react-hooks` - Hooks rules
- `eslint-plugin-jsx-a11y` - Accessibility
- `eslint-plugin-security` - Security checks

### Custom Rules

To customize rules, edit the baseConfig in each tool file under `src/tools/`.

## 📊 Example Output

### Nested Anchors Report

```json
{
  "issues": [
    {
      "file": "/client/src/components/Footer.tsx",
      "line": 266,
      "severity": "critical",
      "message": "Nested anchor tags detected: <Link> contains <a>",
      "suggestion": "Remove the inner <a> tag and use only <Link>"
    }
  ],
  "summary": {
    "totalFiles": 45,
    "filesWithIssues": 2,
    "totalIssues": 3,
    "criticalIssues": 3
  }
}
```

### Deployment Readiness

```json
{
  "ready": false,
  "environment": "live",
  "blockers": [
    {
      "category": "code-quality",
      "severity": "critical",
      "message": "3 critical code issues must be fixed"
    },
    {
      "category": "security",
      "severity": "critical",
      "message": "Security vulnerabilities must be resolved before live deployment"
    }
  ],
  "summary": {
    "testsPass": true,
    "buildSucceeds": true,
    "noCriticalIssues": false,
    "noSecurityVulnerabilities": false
  }
}
```

## 🎓 Integration with Dev/Test/Live Workflow

This MCP server enforces your mandatory code review process:

1. **Dev Environment** - Run checks frequently during development
2. **Test Environment** - Validate before merging to main
3. **Live Environment** - Strict validation before production deployment

```bash
# Development: Quick checks
manus-mcp-cli tool call scan_nested_anchors --server code-review \
  --input '{"projectPath": "/home/ubuntu/my-project"}'

# Testing: Full review
manus-mcp-cli tool call generate_quality_report --server code-review \
  --input '{"projectPath": "/home/ubuntu/my-project"}'

# Live: Strict validation
manus-mcp-cli tool call validate_deployment_readiness --server code-review \
  --input '{"projectPath": "/home/ubuntu/my-project", "environment": "live", "strictMode": true}'
```

## 🤝 Integration with CodeRabbit

CodeRabbit is already connected to your GitHub account and provides free automated code reviews. This MCP server complements CodeRabbit by:

- Running checks locally before pushing
- Validating deployment readiness
- Generating custom reports
- Enforcing project-specific rules

## 📝 Attribution

**Code review provided by free open-source tools:**
- ESLint (MIT License)
- TypeScript (Apache 2.0)
- jsx-a11y (MIT License)
- eslint-plugin-security (Apache 2.0)
- CodeRabbit (Free for open-source)

## 🔒 Privacy

All code scanning happens locally in your Manus sandbox. No code is sent to external services except:
- GitHub (when using CodeRabbit integration)
- Slack (when using Slack notifications)

Your code remains private as per your preferences.

## 📚 Learn More

- [Model Context Protocol](https://modelcontextprotocol.io)
- [ESLint Documentation](https://eslint.org)
- [CodeRabbit](https://coderabbit.ai)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🐛 Troubleshooting

### "Module not found" errors

```bash
cd /home/ubuntu/code-review-mcp-server
npm install
npm run build
```

### "Permission denied" errors

```bash
chmod +x /home/ubuntu/code-review-mcp-server/dist/index.js
```

### ESLint config conflicts

The MCP server uses its own ESLint config. If your project has a conflicting `.eslintrc`, the MCP config takes precedence.

## 📄 License

MIT License - Free to use in all your projects

---

**Built for Mechatronopolis** | Powered by free open-source software
