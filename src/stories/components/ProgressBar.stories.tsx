import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from '../../ui';

const meta = { title: 'Components/Feedback/ProgressBar', component: ProgressBar, args: { label: 'Sprint completion', value: 60, showValue: true }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { value: 0 } };
export const Complete: Story = { args: { value: 100, tone: 'success' } };
export const Indeterminate: Story = { args: { value: null } };
export const Critical: Story = { args: { tone: 'critical', value: 20 } };
