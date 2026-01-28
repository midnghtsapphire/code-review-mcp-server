import { execSync } from 'child_process';
import { join } from 'path';

export async function validateTypeScript(args: any) {
  const { projectPath, strict = false } = args;

  try {
    // Run TypeScript compiler in check mode
    const command = `cd ${projectPath} && npx tsc --noEmit${strict ? ' --strict' : ''}`;
    
    try {
      execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'No TypeScript errors found',
              issues: [],
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      // TypeScript errors are in stderr
      const output = error.stdout || error.stderr || '';
      const issues = parseTypeScriptErrors(output, projectPath);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              issues,
              summary: {
                totalErrors: issues.length,
                strictMode: strict,
              },
            }, null, 2),
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error running TypeScript validation: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

function parseTypeScriptErrors(output: string, projectPath: string) {
  const issues = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    // Match format: path/to/file.ts(line,col): error TS#### message
    const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
    
    if (match) {
      const [, file, lineNum, col, severity, code, message] = match;
      issues.push({
        file: file.replace(projectPath, ''),
        line: parseInt(lineNum),
        column: parseInt(col),
        severity: severity === 'error' ? 'high' : 'medium',
        code: `TS${code}`,
        message,
        suggestion: getTypeScriptSuggestion(code),
      });
    }
  }
  
  return issues;
}

function getTypeScriptSuggestion(code: string): string {
  const suggestions: Record<string, string> = {
    '2304': 'Cannot find name. Check if the variable/type is imported or defined.',
    '2322': 'Type mismatch. Ensure the assigned value matches the expected type.',
    '2339': 'Property does not exist on type. Check spelling or add the property to the type definition.',
    '2345': 'Argument type mismatch. Ensure function arguments match the parameter types.',
    '2571': 'Object is of type "unknown". Add type assertion or type guard.',
    '2769': 'No overload matches this call. Check function signature and argument types.',
    '7006': 'Parameter implicitly has "any" type. Add explicit type annotation.',
    '7031': 'Binding element implicitly has "any" type. Add type annotation to destructured parameters.',
  };
  
  return suggestions[code] || 'See TypeScript documentation for error code TS' + code;
}
