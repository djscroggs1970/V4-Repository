const forbiddenMainlineExtensions = ['.pdf', '.xlsx', '.xls', '.csv'];

export function validateInstanceBoundaries(paths: string[]): string[] {
  const failures: string[] = [];

  for (const path of paths) {
    const lower = path.toLowerCase();
    const isAllowedFixture = lower.includes('/fixtures/') || lower.includes('/sandbox/');
    const hasForbiddenExt = forbiddenMainlineExtensions.some((ext) => lower.endsWith(ext));

    if (hasForbiddenExt && !isAllowedFixture) {
      failures.push(`Forbidden project-like artifact in framework path: ${path}`);
    }

    if (lower.includes('project_instance_id') && lower.includes('templates/') && !lower.endsWith('.json')) {
      failures.push(`Template metadata should live in explicit manifest/config files: ${path}`);
    }
  }

  return failures;
}

if (require.main === module) {
  const failures = validateInstanceBoundaries(process.argv.slice(2));
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
}
