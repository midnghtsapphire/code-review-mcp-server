import { ESLint } from 'eslint';
export async function scanAccessibility(args) {
    const { projectPath, level = 'AA' } = args;
    // @ts-ignore
    const eslint = new ESLint({
        cwd: projectPath,
        overrideConfig: {
            // @ts-ignore - ESLint config type mismatch
            extends: ['plugin:jsx-a11y/recommended'],
            plugins: ['jsx-a11y'],
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            rules: {
                // WCAG 2.1 Level A rules
                'jsx-a11y/alt-text': 'error',
                'jsx-a11y/aria-props': 'error',
                'jsx-a11y/aria-proptypes': 'error',
                'jsx-a11y/aria-unsupported-elements': 'error',
                'jsx-a11y/role-has-required-aria-props': 'error',
                'jsx-a11y/role-supports-aria-props': 'error',
                // WCAG 2.1 Level AA rules
                'jsx-a11y/anchor-is-valid': level !== 'A' ? 'error' : 'off',
                'jsx-a11y/click-events-have-key-events': level !== 'A' ? 'error' : 'off',
                'jsx-a11y/no-static-element-interactions': level !== 'A' ? 'warn' : 'off',
                'jsx-a11y/label-has-associated-control': level !== 'A' ? 'error' : 'off',
                // WCAG 2.1 Level AAA rules
                'jsx-a11y/no-autofocus': level === 'AAA' ? 'warn' : 'off',
                'jsx-a11y/no-distracting-elements': level === 'AAA' ? 'error' : 'off',
            },
        },
    });
    try {
        const results = await eslint.lintFiles([`${projectPath}/**/*.{tsx,jsx}`]);
        const issues = results.flatMap(result => result.messages.map(msg => ({
            file: result.filePath.replace(projectPath, ''),
            line: msg.line,
            column: msg.column,
            severity: msg.severity === 2 ? 'high' : 'medium',
            message: msg.message,
            ruleId: msg.ruleId,
            wcagLevel: getWCAGLevel(msg.ruleId),
            suggestion: getAccessibilitySuggestion(msg.ruleId),
        })));
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        issues,
                        summary: {
                            totalIssues: issues.length,
                            levelAIssues: issues.filter(i => i.wcagLevel === 'A').length,
                            levelAAIssues: issues.filter(i => i.wcagLevel === 'AA').length,
                            levelAAAIssues: issues.filter(i => i.wcagLevel === 'AAA').length,
                            targetLevel: level,
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
                    text: `Error running accessibility scan: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}
function getWCAGLevel(ruleId) {
    const levelAARules = [
        'jsx-a11y/anchor-is-valid',
        'jsx-a11y/click-events-have-key-events',
        'jsx-a11y/label-has-associated-control',
    ];
    const levelAAARules = [
        'jsx-a11y/no-autofocus',
        'jsx-a11y/no-distracting-elements',
    ];
    if (ruleId && levelAAARules.includes(ruleId))
        return 'AAA';
    if (ruleId && levelAARules.includes(ruleId))
        return 'AA';
    return 'A';
}
function getAccessibilitySuggestion(ruleId) {
    const suggestions = {
        'jsx-a11y/alt-text': 'Add descriptive alt text to all images: <img alt="Description" />',
        'jsx-a11y/aria-props': 'Use valid ARIA properties. Check spelling and supported attributes.',
        'jsx-a11y/anchor-is-valid': 'Anchors must have href or use button element for click handlers.',
        'jsx-a11y/click-events-have-key-events': 'Add onKeyDown/onKeyUp handler for keyboard accessibility.',
        'jsx-a11y/label-has-associated-control': 'Associate label with form control using htmlFor or nesting.',
        'jsx-a11y/no-static-element-interactions': 'Use semantic HTML (button) instead of div with onClick.',
        'jsx-a11y/no-autofocus': 'Avoid autofocus as it can disorient keyboard/screen reader users.',
    };
    return suggestions[ruleId || ''] || 'See jsx-a11y documentation for this rule.';
}
//# sourceMappingURL=accessibility-scanner.js.map