import type { Meta, StoryObj } from '@storybook/react-vite';
import { KbdShortcut } from '../../ui';

const meta = { title: 'Components/Content/Kbd', component: KbdShortcut, args: { keys: ['⌘', 'K'] }, parameters: { docs: { description: { component: '' } } } } satisfies Meta<typeof KbdShortcut>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Escape: Story = { args: { keys: ['Esc'] } };
