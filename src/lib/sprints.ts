import type { Sprint } from '../data/types';

const DAY = 86_400_000;
const calendarTime = (date: string) => Date.parse(`${date}T00:00:00Z`);
export function validSprintDate(date: string): boolean {
  const time = calendarTime(date);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date;
}
export function sprintDays(start: string, end: string): number {
  return Math.round((calendarTime(end) - calendarTime(start)) / DAY) + 1;
}
export function sprintEnd(start: string, days: number): string {
  return validSprintDate(start) ? new Date(calendarTime(start) + (days - 1) * DAY).toISOString().slice(0, 10) : '';
}
export function todayDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function sprintProblem(sprint: Pick<Sprint, 'id' | 'name' | 'startDate' | 'endDate'>, existing: Sprint[]): string | null {
  if (!sprint.name.trim()) return 'Give the sprint a name.';
  if (existing.some((item) => item.id !== sprint.id && item.name.trim().toLowerCase() === sprint.name.trim().toLowerCase())) return 'A sprint already has this name.';
  if (!validSprintDate(sprint.startDate) || !validSprintDate(sprint.endDate)) return 'Choose valid start and end dates.';
  if (sprint.endDate < sprint.startDate) return 'The end date must be on or after the start date.';
  return null;
}
export function nextSprintName(sprints: Sprint[]): string {
  let number = 1;
  while (sprints.some((sprint) => sprint.name.trim().toLowerCase() === `sprint ${number}`)) number++;
  return `Sprint ${number}`;
}
