import { glob } from 'glob';
import { readFileSync } from 'fs';
export async function scanNestedAnchors(args) {
    const { projectPath, filePatterns = ['**/*.tsx', '**/*.jsx'] } = args;
    const issues = [];
    const files = await glob(filePatterns, {
        cwd: projectPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });
    for (const file of files) {
        try {
            const content = readFileSync(file, 'utf-8');
            const lines = content.split('\n');
            // Pattern 1: <Link><a>...</a></Link>
            const linkWithAnchorPattern = /<Link[^>]*>[\s\S]*?<a[^>]*>[\s\S]*?<\/a>[\s\S]*?<\/Link>/g;
            // Pattern 2: <a><Link>...</Link></a>
            const anchorWithLinkPattern = /<a[^>]*>[\s\S]*?<Link[^>]*>[\s\S]*?<\/Link>[\s\S]*?<\/a>/g;
            // Pattern 3: <Link><Button>...</Button></Link> (Button renders as <a>)
            const linkWithButtonPattern = /<Link[^>]*>[\s\S]*?<Button[^>]*>[\s\S]*?<\/Button>[\s\S]*?<\/Link>/g;
            // Check for Pattern 1
            let match;
            while ((match = linkWithAnchorPattern.exec(content)) !== null) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                issues.push({
                    file: file.replace(projectPath, ''),
                    line: lineNumber,
                    column: match.index - content.lastIndexOf('\n', match.index),
                    severity: 'critical',
                    message: 'Nested anchor tags detected: <Link> contains <a>',
                    suggestion: 'Remove the inner <a> tag and use only <Link>. Example: <Link href="/path">Text</Link>',
                    codeSnippet: lines[lineNumber - 1]?.trim(),
                });
            }
            // Check for Pattern 2
            linkWithAnchorPattern.lastIndex = 0;
            while ((match = anchorWithLinkPattern.exec(content)) !== null) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                issues.push({
                    file: file.replace(projectPath, ''),
                    line: lineNumber,
                    column: match.index - content.lastIndexOf('\n', match.index),
                    severity: 'critical',
                    message: 'Nested anchor tags detected: <a> contains <Link>',
                    suggestion: 'Remove the outer <a> tag and use only <Link>',
                    codeSnippet: lines[lineNumber - 1]?.trim(),
                });
            }
            // Check for Pattern 3
            anchorWithLinkPattern.lastIndex = 0;
            while ((match = linkWithButtonPattern.exec(content)) !== null) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                issues.push({
                    file: file.replace(projectPath, ''),
                    line: lineNumber,
                    column: match.index - content.lastIndexOf('\n', match.index),
                    severity: 'high',
                    message: 'Potential nested anchor: <Link> wraps <Button>',
                    suggestion: 'Use Button with asChild prop: <Button asChild><Link href="/path">Text</Link></Button>',
                    codeSnippet: lines[lineNumber - 1]?.trim(),
                });
            }
            // Check for mismatched closing tags (e.g., <Link>...</a>)
            const mismatchedPattern = /<Link[^>]*>[\s\S]*?<\/a>/g;
            while ((match = mismatchedPattern.exec(content)) !== null) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                issues.push({
                    file: file.replace(projectPath, ''),
                    line: lineNumber,
                    column: match.index - content.lastIndexOf('\n', match.index),
                    severity: 'critical',
                    message: 'Mismatched JSX tags: <Link> closed with </a>',
                    suggestion: 'Change </a> to </Link>',
                    codeSnippet: lines[lineNumber - 1]?.trim(),
                });
            }
        }
        catch (error) {
            console.error(`Error scanning ${file}:`, error);
        }
    }
    const filesWithIssues = new Set(issues.map(i => i.file)).size;
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    issues,
                    summary: {
                        totalFiles: files.length,
                        filesWithIssues,
                        totalIssues: issues.length,
                        criticalIssues: issues.filter(i => i.severity === 'critical').length,
                        highIssues: issues.filter(i => i.severity === 'high').length,
                    },
                }, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=nested-anchors.js.map