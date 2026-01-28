#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { scanNestedAnchors } from './tools/nested-anchors.js';
import { checkReactBestPractices } from './tools/react-best-practices.js';
import { validateTypeScript } from './tools/typescript-validator.js';
import { scanAccessibility } from './tools/accessibility-scanner.js';
import { detectSecurityIssues } from './tools/security-detector.js';
import { analyzePerformance } from './tools/performance-analyzer.js';
import { generateQualityReport } from './tools/report-generator.js';
import { validateDeploymentReadiness } from './tools/deployment-validator.js';
import { integrateCodeRabbit } from './tools/coderabbit-integration.js';
import { sendSlackReport } from './tools/slack-notifier.js';
const server = new Server({
    name: 'code-review',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'scan_nested_anchors',
                description: 'Scans React components for nested <a> tags that cause console errors',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: {
                            type: 'string',
                            description: 'Absolute path to the project root directory',
                        },
                        filePatterns: {
                            type: 'array',
                            items: { type: 'string' },
                            description: "File patterns to scan (e.g., ['**/*.tsx', '**/*.jsx'])",
                            default: ['**/*.tsx', '**/*.jsx'],
                        },
                    },
                    required: ['projectPath'],
                },
            },
            {
                name: 'check_react_best_practices',
                description: 'Validates React components against best practices (hooks rules, prop types, key props, etc.)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: { type: 'string' },
                        checks: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Specific checks to run',
                            default: ['hooks', 'keys', 'props', 'state', 'effects'],
                        },
                    },
                    required: ['projectPath'],
                },
            },
            {
                name: 'validate_typescript',
                description: 'Runs TypeScript compiler checks and reports type errors',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: { type: 'string' },
                        strict: {
                            type: 'boolean',
                            description: 'Enable strict mode checks',
                            default: false,
                        },
                    },
                    required: ['projectPath'],
                },
            },
            {
                name: 'scan_accessibility',
                description: 'Scans for WCAG 2.1 accessibility issues (missing alt text, aria labels, keyboard navigation)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: { type: 'string' },
                        level: {
                            type: 'string',
                            enum: ['A', 'AA', 'AAA'],
                            description: 'WCAG compliance level',
                            default: 'AA',
                        },
                    },
                    required: ['projectPath'],
                },
            },
            {
                name: 'detect_security_issues',
                description: 'Scans for common security vulnerabilities (XSS, SQL injection, exposed secrets)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: { type: 'string' },
                        checkDependencies: {
                            type: 'boolean',
                            description: 'Check npm dependencies for known vulnerabilities',
                            default: true,
                        },
                    },
                    required: ['projectPath'],
                },
            },
            {
                name: 'analyze_performance',
                description: 'Identifies performance issues (large bundles, unnecessary re-renders, memory leaks)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: { type: 'string' },
                        bundleAnalysis: {
                            type: 'boolean',
                            description: 'Analyze bundle size and dependencies',
                            default: true,
                        },
                    },
                    required: ['projectPath'],
                },
            },
            {
                name: 'generate_quality_report',
                description: 'Generates comprehensive code quality report with all findings',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: { type: 'string' },
                        outputFormat: {
                            type: 'string',
                            enum: ['markdown', 'html', 'json'],
                            default: 'markdown',
                        },
                        includeFixSuggestions: {
                            type: 'boolean',
                            default: true,
                        },
                    },
                    required: ['projectPath'],
                },
            },
            {
                name: 'validate_deployment_readiness',
                description: 'Checks if code is ready for deployment (all tests pass, no critical issues, build succeeds)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectPath: { type: 'string' },
                        environment: {
                            type: 'string',
                            enum: ['dev', 'test', 'live'],
                            description: 'Target deployment environment',
                        },
                        strictMode: {
                            type: 'boolean',
                            description: 'Fail on any warnings (not just errors)',
                            default: false,
                        },
                    },
                    required: ['projectPath', 'environment'],
                },
            },
            {
                name: 'integrate_coderabbit',
                description: 'Triggers CodeRabbit review on GitHub pull request',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repoOwner: { type: 'string' },
                        repoName: { type: 'string' },
                        prNumber: { type: 'number' },
                        waitForReview: {
                            type: 'boolean',
                            description: 'Wait for CodeRabbit to complete review',
                            default: false,
                        },
                    },
                    required: ['repoOwner', 'repoName', 'prNumber'],
                },
            },
            {
                name: 'send_slack_report',
                description: 'Sends code quality report to Slack channel',
                inputSchema: {
                    type: 'object',
                    properties: {
                        webhookUrl: { type: 'string' },
                        reportData: { type: 'object' },
                        channel: { type: 'string', default: '#code-review' },
                        mentionOnCritical: {
                            type: 'boolean',
                            description: 'Mention @channel if critical issues found',
                            default: true,
                        },
                    },
                    required: ['webhookUrl', 'reportData'],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'scan_nested_anchors':
                return await scanNestedAnchors(args);
            case 'check_react_best_practices':
                return await checkReactBestPractices(args);
            case 'validate_typescript':
                return await validateTypeScript(args);
            case 'scan_accessibility':
                return await scanAccessibility(args);
            case 'detect_security_issues':
                return await detectSecurityIssues(args);
            case 'analyze_performance':
                return await analyzePerformance(args);
            case 'generate_quality_report':
                return await generateQualityReport(args);
            case 'validate_deployment_readiness':
                return await validateDeploymentReadiness(args);
            case 'integrate_coderabbit':
                return await integrateCodeRabbit(args);
            case 'send_slack_report':
                return await sendSlackReport(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Code Review MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map