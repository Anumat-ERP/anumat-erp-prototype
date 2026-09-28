/**
 * Contact details and integrations. Fill these in with your real links; the
 * app never invents them. Anything left empty shows as "not set up yet".
 */
export const CONFIG = {
  support: {
    /** Telegram username or group link, e.g. "https://t.me/anumat_support". */
    telegram: '',
    /** Facebook page or Messenger link, e.g. "https://m.me/anumat". */
    facebook: '',
    /** Support email address. */
    email: '',
  },
  sales: {
    /** Where sales enquiries should go. */
    email: '',
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
