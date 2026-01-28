import { scanNestedAnchors } from './nested-anchors.js';
import { checkReactBestPractices } from './react-best-practices.js';
import { validateTypeScript } from './typescript-validator.js';
import { scanAccessibility } from './accessibility-scanner.js';
import { detectSecurityIssues } from './security-detector.js';

export async function generateQualityReport(args: any) {
  const { projectPath, outputFormat = 'markdown', includeFixSuggestions = true } = args;

  try {
    // Run all checks
    const [anchors, react, typescript, a11y, security] = await Promise.all([
      scanNestedAnchors({ projectPath }),
      checkReactBestPractices({ projectPath }),
      validateTypeScript({ projectPath }),
      scanAccessibility({ projectPath }),
      detectSecurityIssues({ projectPath }),
    ]);

    const anchorData = JSON.parse(anchors.content[0].text);
    const reactData = JSON.parse(react.content[0].text);
    const tsData = JSON.parse(typescript.content[0].text);
    const a11yData = JSON.parse(a11y.content[0].text);
    const securityData = JSON.parse(security.content[0].text);

    const report = {
      timestamp: new Date().toISOString(),
      projectPath,
      summary: {
        totalIssues: 
          (anchorData.summary?.totalIssues || 0) +
          (reactData.summary?.totalIssues || 0) +
          (tsData.issues?.length || 0) +
          (a11yData.summary?.totalIssues || 0) +
          (securityData.summary?.totalIssues || 0),
        criticalIssues: 
          (anchorData.summary?.criticalIssues || 0) +
          (securityData.summary?.criticalIssues || 0),
        categories: {
          nestedAnchors: anchorData.summary?.totalIssues || 0,
          reactBestPractices: reactData.summary?.totalIssues || 0,
          typescript: tsData.issues?.length || 0,
          accessibility: a11yData.summary?.totalIssues || 0,
          security: securityData.summary?.totalIssues || 0,
        },
      },
      details: {
        nestedAnchors: anchorData,
        reactBestPractices: reactData,
        typescript: tsData,
        accessibility: a11yData,
        security: securityData,
      },
    };

    if (outputFormat === 'markdown') {
      const markdown = generateMarkdownReport(report, includeFixSuggestions);
      return {
        content: [{ type: 'text', text: markdown }],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error generating quality report: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

function generateMarkdownReport(report: any, includeSuggestions: boolean): string {
  const { summary, details } = report;
  
  let md = `# Code Quality Report\n\n`;
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Total Issues:** ${summary.totalIssues}\n`;
  md += `- **Critical Issues:** ${summary.criticalIssues}\n\n`;
  md += `### Issues by Category\n\n`;
  md += `| Category | Count |\n`;
  md += `|----------|-------|\n`;
  Object.entries(summary.categories).forEach(([cat, count]) => {
    md += `| ${cat} | ${count} |\n`;
  });
  md += `\n`;

  if (summary.criticalIssues > 0) {
    md += `## ⚠️ Critical Issues\n\n`;
    
    if (details.nestedAnchors.issues) {
      details.nestedAnchors.issues
        .filter((i: any) => i.severity === 'critical')
        .forEach((issue: any) => {
          md += `### ${issue.file}:${issue.line}\n`;
          md += `${issue.message}\n\n`;
          if (includeSuggestions) {
            md += `**Fix:** ${issue.suggestion}\n\n`;
          }
        });
    }
    
    if (details.security.issues) {
      details.security.issues
        .filter((i: any) => i.severity === 'critical')
        .forEach((issue: any) => {
          md += `### ${issue.file}:${issue.line}\n`;
          md += `${issue.message}\n\n`;
          if (includeSuggestions) {
            md += `**Fix:** ${issue.suggestion}\n\n`;
          }
        });
    }
  }

  md += `\n---\n\n`;
  md += `*Code review provided by free open-source tools: ESLint, TypeScript, jsx-a11y, eslint-plugin-security*\n`;

  return md;
}
