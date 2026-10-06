import type { DataState } from '../data/types';
import type { Employee } from './types';
import { applyHR, hrProblem } from './engine';
export const EMPLOYEE_HEADERS = [
  'code',
  'name',
  'email',
  'department',
  'branch',
  'position',
  'startDate',
  'salary',
  'currency',
  'leaveAllowance',
] as const;
/** RFC-style quoted CSV, including commas/newlines in quoted cells and doubled quotes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [],
    row: string[] = [];
  let cell = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!cell || quoted) quoted = !quoted;
      else throw new Error('Invalid CSV quoting.');
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push([...row]);
      row.length = 0;
      cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('Close the quoted CSV field.');
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
export interface ImportResult {
  line: number;
  record: Employee;
  problem?: string;
}
export function previewEmployees(
  state: DataState,
  text: string,
): ImportResult[] {
  const [headers, ...rows] = parseCSV(text.trim());
  if (
    !headers ||
    headers.length !== EMPLOYEE_HEADERS.length ||
    headers.some((header, index) => header.trim() !== EMPLOYEE_HEADERS[index])
  )
    throw new Error('Use the employee template headers in the same order.');
  if (rows.length > 500) throw new Error('Import between 1 and 500 employees.');
  let preview = state;
  return rows.map((cells, index) => {
    const data = Object.fromEntries(
      headers.map((key, n) => [key.trim(), cells[n]?.trim() ?? '']),
    );
    const record: Employee = {
      id: `import-${Date.now().toString(36)}-${index}`,
      version: 0,
      status: 'probation',
      createdAt: '',
      updatedAt: '',
      code: data.code!,
      name: data.name!,
      email: data.email!,
      department: data.department!,
      branch: data.branch!,
      position: data.position!,
      startDate: data.startDate!,
      salary: Number(data.salary),
      currency: data.currency as Employee['currency'],
      leaveAllowance: Number(data.leaveAllowance),
      accountId: '',
      managerId: '',
      endDate: '',
    };
    const command = {
      kind: 'save' as const,
      collection: 'employees' as const,
      record,
    };
    const problem =
      cells.length !== headers.length
        ? 'Each CSV row must match the template columns.'
        : !data.salary || !data.leaveAllowance
          ? 'Fill every template column.'
          : hrProblem(preview, command);
    if (!problem) preview = applyHR(preview, command);
    return { line: index + 2, record, problem };
  });
}
