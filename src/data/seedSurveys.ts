import { at } from './seed';
import type { FormValues, Survey, SurveyResponse } from './types';

/** Team surveys for the Lotus Logistics demo: one open, one closed, one draft. */
export const surveys: Survey[] = [
  {
    id: 'pulse-q4',
    title: 'Hybrid work pulse · Q4',
    description: 'Five quick questions about how work is going. Answers are anonymous: we only see totals.',
    audience: [],
    anonymous: true,
    status: 'open',
    createdBy: 'dara',
    createdAt: at(-4, 15),
    publishedAt: at(-3, 9),
    closesAt: at(4, 18),
    fields: [
      { id: 'productive', label: 'How productive did you feel this month?', kind: 'rating', required: true },
      { id: 'where', label: 'Where do you do your best work?', kind: 'radio', required: true, options: ['In the office', 'At home', 'A mix of both'] },
      {
        id: 'slows',
        label: 'What slows you down most?',
        help: 'Choose all that apply.',
        kind: 'checkboxes',
        required: false,
        options: ['Waiting for approvals', 'Too many meetings', 'Unclear priorities', 'Slow tools'],
      },
      { id: 'recommend', label: 'How likely are you to recommend Lotus Logistics as a place to work?', kind: 'scale', required: true },
      { id: 'change', label: 'What one change would help you most?', kind: 'longtext', required: false },
    ],
  },
  {
    id: 'party',
    title: 'Year-end party: are you coming?',
    description: 'Help us book the right venue and food. Please answer by Friday.',
    audience: [],
    anonymous: false,
    status: 'closed',
    createdBy: 'sokha',
    createdAt: at(-21, 10),
    publishedAt: at(-20, 9),
    closesAt: at(-10, 18),
    fields: [
      { id: 'join', label: 'Will you join the party on 19 December?', kind: 'yesno', required: true },
      {
        id: 'venue',
        label: 'Which venue do you prefer?',
        kind: 'radio',
        required: true,
        options: ['Riverside restaurant', 'Office rooftop', 'Karaoke night'],
        showIf: { fieldId: 'join', equals: 'Yes' },
      },
      {
        id: 'food',
        label: 'Any food needs?',
        kind: 'checkboxes',
        required: false,
        options: ['Vegetarian', 'Halal', 'No nuts', 'None'],
        showIf: { fieldId: 'join', equals: 'Yes' },
      },
      { id: 'note', label: 'Anything else we should know?', kind: 'text', required: false },
    ],
  },
  {
    id: 'laptops',
    title: 'Laptop policy: your input',
    description: 'We’re updating which laptops we buy. Tell us what works for you today.',
    audience: ['Operations', 'Product', 'IT'],
    anonymous: false,
    status: 'draft',
    createdBy: 'dara',
    createdAt: at(-1, 16),
    fields: [
      { id: 'model', label: 'Which laptop do you use now?', kind: 'select', required: true, options: ['MacBook Air', 'MacBook Pro', 'ThinkPad', 'Other'] },
      { id: 'fit', label: 'How well does it handle your work?', kind: 'rating', required: true },
      { id: 'screen', label: 'Would a second screen help?', kind: 'yesno', required: false },
    ],
  },
];

const r = (surveyId: string, personId: string, days: number, hour: number, answers: FormValues): SurveyResponse => ({
  id: `${surveyId}-${personId}`,
  surveyId,
  personId,
  at: at(days, hour),
  answers,
});

export const surveyResponses: SurveyResponse[] = [
  r('pulse-q4', 'priya', -3, 10, {
    productive: '4',
    where: 'A mix of both',
    slows: ['Too many meetings'],
    recommend: '9',
    change: 'Fewer status meetings; the approvals page already tells me what I need.',
  }),
  r('pulse-q4', 'sokha', -3, 14, { productive: '3', where: 'In the office', slows: ['Unclear priorities', 'Too many meetings'], recommend: '8' }),
  r('pulse-q4', 'maria', -2, 11, {
    productive: '4',
    where: 'At home',
    slows: ['Waiting for approvals'],
    recommend: '7',
    change: 'Contract reviews arrive without the final draft attached.',
  }),
  r('pulse-q4', 'omar', -1, 17, { productive: '2', where: 'A mix of both', slows: ['Slow tools', 'Waiting for approvals'], recommend: '6', change: 'Faster laptops for the IT team.' }),
  r('pulse-q4', 'lina', 0, 9, { productive: '5', where: 'At home', slows: [], recommend: '10' }),

  r('party', 'dara', -20, 11, { join: 'Yes', venue: 'Riverside restaurant', food: ['None'] }),
  r('party', 'alex', -19, 9, { join: 'Yes', venue: 'Karaoke night', food: ['Vegetarian'], note: 'Bringing my partner if that’s OK.' }),
  r('party', 'priya', -19, 15, { join: 'Yes', venue: 'Riverside restaurant', food: ['Halal'] }),
  r('party', 'sokha', -18, 10, { join: 'Yes', venue: 'Office rooftop', food: ['None'] }),
  r('party', 'maria', -17, 12, { join: 'No', note: 'Travelling that week, have fun!' }),
  r('party', 'daniel', -15, 16, { join: 'Yes', venue: 'Riverside restaurant', food: ['No nuts'] }),
  r('party', 'lina', -13, 9, { join: 'Yes', venue: 'Karaoke night', food: ['Vegetarian', 'No nuts'] }),
];
