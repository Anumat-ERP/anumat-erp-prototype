import { Text } from '@repo/ui';
import { Mail, MessageCircle, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import { CONFIG, isSet } from '../config';

interface Channel {
  key: string;
  label: string;
  icon: ReactNode;
  value: string;
  href: (v: string) => string;
  shown: (v: string) => string;
}

const CHANNELS: Channel[] = [
  {
    key: 'telegram',
    label: 'Telegram',
    icon: <Send />,
    value: CONFIG.support.telegram,
    href: (v) => (v.startsWith('http') ? v : `https://t.me/${v.replace(/^@/, '')}`),
    shown: (v) => (v.startsWith('http') ? v.replace(/^https?:\/\//, '') : `@${v.replace(/^@/, '')}`),
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: <MessageCircle />,
    value: CONFIG.support.facebook,
    href: (v) => v,
    shown: (v) => v.replace(/^https?:\/\/(www\.)?/, ''),
  },
  {
    key: 'email',
    label: 'Email',
    icon: <Mail />,
    value: CONFIG.support.email,
    href: (v) => `mailto:${v}`,
    shown: (v) => v,
  },
];

/** Support channels from src/config.ts. Unset ones say so instead of showing a made-up link. */
export function ContactChannels({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={compact ? 'flex flex-wrap gap-x-5 gap-y-2' : 'grid gap-3 sm:grid-cols-3'}>
      {CHANNELS.map((c) => {
        const set = isSet(c.value);
        return (
          <li
            key={c.key}
            className={compact ? 'flex items-center gap-2 text-md' : 'flex items-start gap-3 rounded-lg border border-border bg-surface p-4'}
          >
            <span aria-hidden className="inline-flex text-fg-muted [&_svg]:size-5">
              {c.icon}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-medium text-fg">{c.label}</span>
              {set ? (
                <a
                  href={c.href(c.value)}
                  target={c.key === 'email' ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="truncate text-fg-link underline underline-offset-2"
                >
                  {c.shown(c.value)}
                </a>
              ) : (
                <Text as="span" variant="bodySm" tone="muted">
                  Not set up yet
                </Text>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
