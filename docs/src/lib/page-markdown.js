// prepend frontmatter title and lede so /<page>.md and Copy page match the rendered header
export const markdownFor = (entry) => `# ${entry.data.title}\n\n${entry.data.lede}\n\n${entry.body.trim()}\n`;
