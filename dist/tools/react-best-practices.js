import { ESLint } from 'eslint';
export async function checkReactBestPractices(args) {
    const { projectPath, checks = ['hooks', 'keys', 'props', 'state', 'effects'] } = args;
    // @ts-ignore
    const eslint = new ESLint({
        cwd: projectPath,
        overrideConfig: {
            // @ts-ignore - ESLint config type mismatch
            extends: [
                'eslint:recommended',
                'plugin:react/recommended',
                'plugin:react-hooks/recommended',
            ],
            plugins: ['react', 'react-hooks'],
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            rules: {
                // Hooks rules
                'react-hooks/rules-of-hooks': checks.includes('hooks') ? 'error' : 'off',
                'react-hooks/exhaustive-deps': checks.includes('hooks') ? 'warn' : 'off',
                // Keys in lists
                'react/jsx-key': checks.includes('keys') ? 'error' : 'off',
                // Prop types
                'react/prop-types': checks.includes('props') ? 'warn' : 'off',
                'react/require-default-props': checks.includes('props') ? 'warn' : 'off',
                // State management
                'react/no-direct-mutation-state': checks.includes('state') ? 'error' : 'off',
                'react/no-unused-state': checks.includes('state') ? 'warn' : 'off',
                // Effects and lifecycle
                'react/no-did-mount-set-state': checks.includes('effects') ? 'warn' : 'off',
                'react/no-did-update-set-state': checks.includes('effects') ? 'warn' : 'off',
                // General best practices
                'react/jsx-no-target-blank': 'warn',
                'react/no-unescaped-entities': 'warn',
                'react/self-closing-comp': 'warn',
            },
            settings: {
                react: {
                    version: 'detect',
                },
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
            suggestion: getSuggestion(msg.ruleId),
        })));
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        issues,
                        summary: {
                            totalIssues: issues.length,
                            errorCount: issues.filter(i => i.severity === 'high').length,
                            warningCount: issues.filter(i => i.severity === 'medium').length,
                            filesChecked: results.length,
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
                    text: `Error running React best practices check: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}
function getSuggestion(ruleId) {
    const suggestions = {
        'react-hooks/rules-of-hooks': 'Only call Hooks at the top level. Don\'t call Hooks inside loops, conditions, or nested functions.',
        'react-hooks/exhaustive-deps': 'Add all dependencies used inside useEffect/useCallback/useMemo to the dependency array.',
        'react/jsx-key': 'Add a unique "key" prop to each element in a list.',
        'react/prop-types': 'Define PropTypes for all component props, or use TypeScript interfaces.',
        'react/no-direct-mutation-state': 'Never mutate this.state directly. Use setState() instead.',
        'react/jsx-no-target-blank': 'Add rel="noopener noreferrer" when using target="_blank".',
        'react/self-closing-comp': 'Use self-closing tags for components without children: <Component />',
    };
    return suggestions[ruleId || ''] || 'See ESLint documentation for this rule.';
}
//# sourceMappingURL=react-best-practices.js.map