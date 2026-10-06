import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../../ui';

const meta = { title: 'Components/Feedback/Badge', component: Badge, args: { children: 'In progress', tone: 'info' }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Neutral: Story = { args: { tone: 'neutral', children: 'Neutral' } };
export const Success: Story = { args: { tone: 'success', children: 'Success' } };
export const Warning: Story = { args: { tone: 'warning', children: 'Warning' } };
export const Critical: Story = { args: { tone: 'critical', children: 'Critical' } };
export const Attention: Story = { args: { tone: 'attention', children: 'Attention' } };
export const WithDot: Story = { args: { dot: true } };
export const Partial: Story = { args: { progress: 'partial', progressLabel: 'Partially complete' } };
