export function downloadCSV(rows: object[], filename: string) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  // Protect spreadsheet users from formula execution in user-entered text.
  const cell = (value: unknown) => {
    const text = String(value ?? '');
    return `"${(typeof value === 'string' && /^[=+@\-\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
  };
  const content = [
    keys.join(','),
    ...rows.map((row) =>
      keys.map((key) => cell((row as Record<string, unknown>)[key])).join(','),
    ),
  ].join('\r\n');
  const url = URL.createObjectURL(
    new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
