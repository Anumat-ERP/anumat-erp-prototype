import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner } from '../../ui';

const meta = { title: 'Components/Feedback/Banner', component: Banner, args: { title: 'Preview mode', children: 'Changes stay in this example.', tone: 'info' }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof Banner>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Success: Story = { args: { tone: 'success', title: 'Task saved' } };
export const Warning: Story = { args: { tone: 'warning', title: 'Completion evidence needed' } };
export const Critical: Story = { args: { tone: 'critical', title: 'Unable to save', children: 'Check the required fields and try again.' } };
export const Inline: Story = { args: { inline: true } };
