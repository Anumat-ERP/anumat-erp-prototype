import type { Meta, StoryObj } from '@storybook/react-vite';
import { List } from '../../ui';

const meta = { title: 'Components/Content/List', component: List, args: { children: <><List.Item>Confirm scope and ownership</List.Item><List.Item>Deliver the expected outcome</List.Item><List.Item>Verify completion evidence</List.Item></> }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof List>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Numbered: Story = { args: { type: 'number' } };
export const Tight: Story = { args: { spacing: 'tight' } };
