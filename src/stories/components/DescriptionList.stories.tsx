import type { Meta, StoryObj } from '@storybook/react-vite';
import { DescriptionList } from '../../ui';

const meta = { title: 'Components/Content/DescriptionList', component: DescriptionList, args: { items: [{term:'Responsible',description:'Dara Sok'},{term:'Accountable',description:'Priya Patel'},{term:'Sprint',description:'Sprint 1'},{term:'Evidence',description:''}] }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof DescriptionList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Inline: Story = { args: { layout: 'inline' } };
export const Dividers: Story = { args: { dividers: true } };
export const Tight: Story = { args: { spacing: 'tight' } };
