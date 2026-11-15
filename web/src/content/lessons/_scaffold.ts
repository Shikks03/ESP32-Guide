/**
 * PowerShell block that recreates a lab folder from the real files (passed in via ?raw),
 * so it can never drift. Writes UTF-8 without BOM (Windows PowerShell 5.1's
 * Set-Content -Encoding utf8 adds one). Shared by every lesson with firmware.
 */
export function buildScaffold(dir: string, files: { path: string; text: string }[]): string {
  const win = (p: string) => p.replace(/\//g, '\\');
  const lines: string[] = [
    '# Run from the repo root (the folder that contains labs\\).',
    '$utf8 = New-Object System.Text.UTF8Encoding $false   # UTF-8, no BOM',
    `New-Item -ItemType Directory -Force -Path '${win(dir)}\\src' | Out-Null`,
  ];
  for (const f of files) {
    const body = f.text.replace(/\r\n/g, '\n').replace(/\n$/, '');
    lines.push(
      '',
      `$path = Join-Path $PWD '${win(dir)}\\${win(f.path)}'`,
      "$text = @'",
      body,
      "'@",
      'New-Item -ItemType Directory -Force -Path (Split-Path $path) | Out-Null',
      '[IO.File]::WriteAllText($path, $text + "`n", $utf8)',
    );
  }
  return lines.join('\n') + '\n';
}
