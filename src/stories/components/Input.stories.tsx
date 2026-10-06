import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../../ui';

const meta = { title: 'Components/Forms/Input', component: Input, args: { 'aria-label': 'Task title', placeholder: 'Task title' }, parameters: { docs: { description: { component: 'Wrap inputs in Field for visible labels, help, and linked errors. The standalone examples have accessible names.' } } } } satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: 'Prepare onboarding' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Read only' } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'PR-2026' } };
export const Invalid: Story = { args: { invalid: true, defaultValue: 'Incomplete' } };
export const Search: Story = { args: { type: 'search', defaultValue: 'Sprint' } };
export const CharacterCount: Story = { args: { maxLength: 80, showCharacterCount: true, defaultValue: 'Onboarding' } };
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
