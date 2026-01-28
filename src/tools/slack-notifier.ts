export async function sendSlackReport(args: any) {
  const { webhookUrl, reportData, channel = '#code-review', mentionOnCritical = true } = args;

  try {
    const { summary } = reportData;
    
    const color = summary.criticalIssues > 0 ? 'danger' : 
                  summary.totalIssues > 10 ? 'warning' : 'good';
    
    const text = mentionOnCritical && summary.criticalIssues > 0 
      ? '<!channel> Critical code issues detected!' 
      : 'Code Quality Report';

    const payload = {
      channel,
      username: 'Code Review Bot',
      icon_emoji: ':robot_face:',
      text,
      attachments: [
        {
          color,
          title: 'Code Quality Summary',
          fields: [
            {
              title: 'Total Issues',
              value: summary.totalIssues.toString(),
              short: true,
            },
            {
              title: 'Critical Issues',
              value: summary.criticalIssues.toString(),
              short: true,
            },
            {
              title: 'Nested Anchors',
              value: summary.categories.nestedAnchors.toString(),
              short: true,
            },
            {
              title: 'Security Issues',
              value: summary.categories.security.toString(),
              short: true,
            },
            {
              title: 'Accessibility Issues',
              value: summary.categories.accessibility.toString(),
              short: true,
            },
            {
              title: 'TypeScript Errors',
              value: summary.categories.typescript.toString(),
              short: true,
            },
          ],
          footer: 'Code Review MCP Server | Powered by free open-source tools',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Report sent to ${channel}`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error sending Slack report: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
