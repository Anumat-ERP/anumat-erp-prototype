import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from '../../App';
const meta = {
  title: 'Apps/Recruitment',
  component: App,
  parameters: {
    layout: 'fullscreen',
    hr: true,
    recruitmentDemo: 'demo',
    docs: {
      description: {
        component:
          'Complete local recruitment journey: versioned job descriptions, independent headcount approval linked to Requests, vacancy publication and application preview, scoped assessments, immutable offer reviews, and employee/onboarding handoff. Public publishing and candidate responses are simulations.',
      },
    },
  },
} satisfies Meta<typeof App>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Dashboard: Story = {
  parameters: { route: '/home?app=recruitment' },
};
export const Pipeline: Story = {
  parameters: { route: '/recruitment?tab=pipeline' },
};
export const Positions: Story = {
  parameters: { route: '/recruitment?tab=positions' },
};
export const HeadcountReview: Story = {
  parameters: {
    route: '/recruitment?tab=requisitions',
    recruitmentDemo: 'reviewer',
  },
};
export const InterviewAssessments: Story = {
  parameters: {
    route: '/recruitment?tab=interviews',
    recruitmentDemo: 'reviewer',
  },
};
export const OfferReview: Story = {
  parameters: { route: '/recruitment?tab=offers', recruitmentDemo: 'reviewer' },
};
export const Onboarding: Story = {
  parameters: {
    route: '/recruitment?tab=onboarding',
    recruitmentDemo: 'onboarding',
  },
};
export const CareerPreview: Story = {
  parameters: { route: '/recruitment?tab=careers' },
};
export const KhmerDark: Story = {
  parameters: { route: '/home?app=recruitment' },
  globals: { locale: 'km', theme: 'dark' },
};
export const Interviewer: Story = {
  parameters: {
    route: '/recruitment?tab=interviews',
    role: 'member',
    recruitmentDemo: 'reviewer',
  },
};
export const Empty: Story = {
  parameters: {
    route: '/home?app=recruitment',
    empty: true,
    recruitmentDemo: undefined,
  },
};

export const CandidateBackground: Story = {
  parameters: { route: '/recruitment?tab=applications&record=hr-application' },
};

export const JobDescriptionDetails: Story = {
  parameters: { route: '/recruitment?tab=positions&record=hr-position' },
};
