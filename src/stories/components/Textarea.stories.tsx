import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from '../../ui';

const meta = { title: 'Components/Forms/Textarea', component: Textarea, args: { 'aria-label': 'Expected outcome', placeholder: 'Describe the result', rows: 3 }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: 'Every new starter can access their tools.' } };
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };
