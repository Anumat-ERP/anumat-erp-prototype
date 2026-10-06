import type { Meta, StoryObj } from '@storybook/react-vite';
import { FigureValue } from '../../ui';

const meta = { title: 'Components/Content/Figure', component: FigureValue, args: { value: '12', unit: 'tasks' }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof FigureValue>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Small: Story = { args: { size: 'md' } };
export const Percentage: Story = { args: { value: '73%', unit: undefined } };
