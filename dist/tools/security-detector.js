import { ESLint } from 'eslint';
import { execSync } from 'child_process';
export async function detectSecurityIssues(args) {
    const { projectPath, checkDependencies = true } = args;
    // @ts-ignore
    const eslint = new ESLint({
        cwd: projectPath,
        overrideConfig: {
            // @ts-ignore - ESLint config type mismatch
            extends: ['plugin:security/recommended'],
            plugins: ['security'],
            rules: {
                'security/detect-object-injection': 'warn',
                'security/detect-non-literal-regexp': 'warn',
                'security/detect-unsafe-regex': 'error',
                'security/detect-buffer-noassert': 'error',
                'security/detect-child-process': 'warn',
                'security/detect-disable-mustache-escape': 'error',
                'security/detect-eval-with-expression': 'error',
                'security/detect-no-csrf-before-method-override': 'error',
                'security/detect-non-literal-fs-filename': 'warn',
                'security/detect-non-literal-require': 'warn',
                'security/detect-possible-timing-attacks': 'warn',
                'security/detect-pseudoRandomBytes': 'error',
            },
        },
    });
    const issues = [];
    try {
        // Run ESLint security checks
        const results = await eslint.lintFiles([`${projectPath}/**/*.{ts,tsx,js,jsx}`]);
        results.forEach(result => {
            result.messages.forEach(msg => {
                issues.push({
                    file: result.filePath.replace(projectPath, ''),
                    line: msg.line,
                    column: msg.column,
                    severity: msg.severity === 2 ? 'critical' : 'high',
                    category: 'code',
                    message: msg.message,
                    ruleId: msg.ruleId,
                    suggestion: getSecuritySuggestion(msg.ruleId),
                });
            });
        });
        // Check dependencies for vulnerabilities
        if (checkDependencies) {
            try {
                const auditOutput = execSync('npm audit --json', {
                    cwd: projectPath,
                    encoding: 'utf-8',
                });
                const audit = JSON.parse(auditOutput);
                if (audit.vulnerabilities) {
                    Object.entries(audit.vulnerabilities).forEach(([pkg, data]) => {
                        if (data.severity === 'critical' || data.severity === 'high') {
                            issues.push({
                                file: 'package.json',
                                line: 0,
                                column: 0,
                                severity: data.severity,
                                category: 'dependency',
                                message: `${pkg}: ${data.via[0]?.title || 'Security vulnerability'}`,
                                suggestion: `Run: npm update ${pkg} or npm audit fix`,
                            });
                        }
                    });
                }
            }
            catch (auditError) {
                // npm audit may fail if no package.json, ignore
            }
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        issues,
                        summary: {
                            totalIssues: issues.length,
                            criticalIssues: issues.filter(i => i.severity === 'critical').length,
                            highIssues: issues.filter(i => i.severity === 'high').length,
                            codeIssues: issues.filter(i => i.category === 'code').length,
                            dependencyIssues: issues.filter(i => i.category === 'dependency').length,
                        },
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error running security scan: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}
function getSecuritySuggestion(ruleId) {
    const suggestions = {
        'security/detect-object-injection': 'Validate object keys before accessing to prevent prototype pollution.',
        'security/detect-unsafe-regex': 'Use a safer regex pattern to prevent ReDoS attacks.',
        'security/detect-eval-with-expression': 'Never use eval(). Use safer alternatives like JSON.parse().',
        'security/detect-non-literal-fs-filename': 'Validate and sanitize file paths to prevent directory traversal.',
        'security/detect-child-process': 'Avoid child_process.exec(). Use execFile() with validated inputs.',
        'security/detect-pseudoRandomBytes': 'Use crypto.randomBytes() instead of Math.random() for security.',
    };
    return suggestions[ruleId || ''] || 'Review code for potential security vulnerability.';
}
//# sourceMappingURL=security-detector.js.map