import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker } from '../../ui';

const meta = { title: 'Components/Forms/DatePicker', component: DatePicker, args: { label: 'Due date', defaultValue: '2026-10-12' }, parameters: { docs: { description: { component: 'Stores ISO YYYY-MM-DD. Type a real date or open the calendar; ArrowDown opens it. Invalid dates block enclosing primary actions.' } } } } satisfies Meta<typeof DatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { defaultValue: '' } };
export const Required: Story = { args: { required: true } };
export const InvalidDate: Story = { args: { defaultValue: '2026-02-30' } };
export const WithBounds: Story = { args: { min: '2026-10-01', max: '2026-10-31' } };
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { readOnly: true } };
