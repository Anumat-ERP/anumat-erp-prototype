import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from '../../ui';

const meta = { title: 'Components/Forms/Switch', component: Switch, args: { label: 'Receive in-app notifications' }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithHelp: Story = { args: { helpText: 'Only applies to your account.' } };
