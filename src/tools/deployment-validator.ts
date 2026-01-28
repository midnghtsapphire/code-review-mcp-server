import { generateQualityReport } from './report-generator.js';
import { execSync } from 'child_process';

export async function validateDeploymentReadiness(args: any) {
  const { projectPath, environment, strictMode = false } = args;

  const blockers: any[] = [];
  const warnings: any[] = [];

  try {
    // 1. Run all quality checks
    const report = await generateQualityReport({ projectPath, outputFormat: 'json' });
    const reportData = JSON.parse(report.content[0].text);

    if (reportData.summary.criticalIssues > 0) {
      blockers.push({
        category: 'code-quality',
        severity: 'critical',
        message: `${reportData.summary.criticalIssues} critical code issues must be fixed`,
      });
    }

    if (strictMode && reportData.summary.totalIssues > reportData.summary.criticalIssues) {
      blockers.push({
        category: 'code-quality',
        severity: 'high',
        message: `${reportData.summary.totalIssues - reportData.summary.criticalIssues} warnings in strict mode`,
      });
    }

    // 2. Run tests
    let testsPass = false;
    try {
      execSync('npm test', { cwd: projectPath, stdio: 'pipe' });
      testsPass = true;
    } catch (error) {
      blockers.push({
        category: 'tests',
        severity: 'critical',
        message: 'Test suite failed',
      });
    }

    // 3. Check build
    let buildSucceeds = false;
    try {
      execSync('npm run build', { cwd: projectPath, stdio: 'pipe' });
      buildSucceeds = true;
    } catch (error) {
      blockers.push({
        category: 'build',
        severity: 'critical',
        message: 'Build failed',
      });
    }

    // 4. Environment-specific checks
    if (environment === 'live') {
      // Extra strict checks for production
      if (reportData.details.security.summary.totalIssues > 0) {
        blockers.push({
          category: 'security',
          severity: 'critical',
          message: 'Security vulnerabilities must be resolved before live deployment',
        });
      }
    }

    const ready = blockers.length === 0;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ready,
            environment,
            blockers,
            warnings,
            summary: {
              testsPass,
              buildSucceeds,
              noCriticalIssues: reportData.summary.criticalIssues === 0,
              noSecurityVulnerabilities: reportData.details.security.summary.totalIssues === 0,
            },
            message: ready 
              ? `✅ Code is ready for ${environment} deployment`
              : `❌ ${blockers.length} blocker(s) prevent ${environment} deployment`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error validating deployment readiness: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
