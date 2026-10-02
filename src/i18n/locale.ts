import { km } from './messages';

export const LOCALE_COOKIE = 'anumat-locale';
export type Locale = 'en' | 'km';
export const isLocale = (value: unknown): value is Locale => value === 'en' || value === 'km';
export const intlLocale = (locale: Locale) => (locale === 'km' ? 'km-KH' : 'en-GB');
export type Variables = Record<string, string | number>;

const englishSingular: Record<string, string> = {
  'Showing {count} requests on page {page}': 'Showing {count} request on page {page}',
  'Showing {count} matching requests on page {page}': 'Showing {count} matching request on page {page}',
  'Approved {count} requests': 'Approved {count} request',
  'Approve {count} requests?': 'Approve {count} request?',
  'Review {count} approvals': 'Review {count} approval',
  '{count} files attached for your approver.': '{count} file attached for your approver.',
  'Fix {count} fields to submit': 'Fix {count} field to submit',
  'Median of {count} decisions, {period}': 'Median of {count} decision, {period}',
};

// Shared form errors and historical activity/notification rows contain rendered
// English copy. Match only known system templates, retaining embedded user content.
const storedSystemMessages = new Set([
  'approved {step}',
  '{name} needs your decision · {request}',
  '{name} approved {request}',
  '{name} asked for changes · {request}',
  '{name} declined {request}',
  '{name} commented on {request}: “{comment}”',
  'Waiting on you: {request} is past its deadline',
  '{request} is waiting on {approver}, past its deadline',
]);
const legacyTemplates = Object.keys(km)
  .filter((key) => key.includes('{field}') || storedSystemMessages.has(key))
  .map((key) => {
    const names: string[] = [];
    const pattern = key
      .split(/(\{\w+\})/g)
      .map((part) => {
        if (/^\{\w+\}$/.test(part)) {
          names.push(part.slice(1, -1));
          return '(.*?)';
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('');
    return { key, names, pattern: new RegExp(`^${pattern}$`) };
  });

/** Translate interface copy only. User content and stored enum values stay intact. */
export function translate(locale: Locale, message: string, variables: Variables = {}): string {
  let template = locale === 'km' && Object.hasOwn(km, message) ? km[message]! : message;
  if (locale === 'en' && variables.count === 1 && Object.hasOwn(englishSingular, message)) template = englishSingular[message]!;
  if (locale === 'km' && !Object.hasOwn(km, message)) {
    for (const candidate of legacyTemplates) {
      const match = message.match(candidate.pattern);
      if (!match) continue;
      template = km[candidate.key]!;
      variables = {
        ...Object.fromEntries(candidate.names.map((name, index) => [name, match[index + 1]!])),
        ...variables,
      };
      break;
    }
  }
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.hasOwn(variables, key) ? String(variables[key]) : match));
}

export const createTranslator = (locale: Locale) => (message: string, variables?: Variables) => translate(locale, message, variables);
export type Translate = ReturnType<typeof createTranslator>;
