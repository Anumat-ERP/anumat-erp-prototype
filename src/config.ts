/**
 * Contact details and integrations. Fill these in with your real links; the
 * app never invents them. Anything left empty shows as "not set up yet".
 */
export const CONFIG = {
  support: {
    /** Telegram username or group link. Example default; replace with your real channel. */
    telegram: 'https://t.me/anumatkh',
    /** Facebook page or Messenger link. Example default; replace with your real page. */
    facebook: 'https://facebook.com/anumat',
    /** Support email address. Example default; replace with your real inbox. */
    email: 'support@anumat.com',
  },
  sales: {
    /** Where sales enquiries should go. Example default; replace with your real inbox. */
    email: 'sales@anumat.com',
  },
  telegram: {
    /** Your notification bot's username, without the @, e.g. "AnumatBot". */
    botUsername: '',
  },
  forms: {
    /**
     * Optional form-service links (Tally, Google Forms, Formspree…). When set,
     * the survey and contact form also link there so answers reach you.
     */
    feedbackUrl: '',
    salesUrl: '',
  },
} as const;

/** Is a configured value filled in? */
export const isSet = (value: string) => value.trim().length > 0;
