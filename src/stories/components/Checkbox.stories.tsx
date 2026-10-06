import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../../ui';

const meta = { title: 'Components/Forms/Checkbox', component: Checkbox, args: { label: 'Acceptance criteria verified' }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = { args: { checked: 'indeterminate' } };
export const Disabled: Story = { args: { disabled: true } };
